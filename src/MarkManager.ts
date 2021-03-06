import * as vscode from 'vscode';
import * as Sidebar from './sidebar/Sidebar';
import * as database from './DataBase';
import * as mark from './Mark';
import * as path from 'path';
import { Position } from 'vscode';
import { mkdir } from 'node:fs';
import { isDate } from 'node:util';
import { promises as pfs } from 'fs';
import * as fs from 'fs';
import * as util from 'util';

const readline = require('readline');


export enum ShowColorType {
    sctClick,
    sctShow,
    sctClear
}

export enum TEColorManagerType {
    tecmtInit,
    tecmtShow,
    tecmtClear
}
export enum MDStype {
    disable,
    onlyMd,
    mdEdit
}
export enum QuickPickItemType {
    mark,
    jumper
}

export class MarkManager {

    public showMarkDownType: MDStype = MDStype.disable;

    private context: vscode.ExtensionContext;
    private sidebar: Sidebar.Sidebar | undefined;

    private db: database.DataBase | undefined;

    private mkJPPrevious: mark.Mark[][] = [];
    private mkPrevious: mark.Mark[] = [];
    private mkJPNext: mark.Mark[][] = [];
    private mkNext: mark.Mark[] = [];
    private mkJpNameNext: string[][] = [];
    private mkJpNamePrevious: string[][] = [];
    
    private lineId: number = 0;
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public init(sidebar: Sidebar.Sidebar, db: database.DataBase) {
        this.sidebar = sidebar;
        this.db = db;
    }

    public static pathRelativeToAbsolute(rPath: string) {
        if (vscode.workspace.workspaceFolders) {
            const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            return path.join(workspacePath, rPath.substr(1).replace(/\\/g, '/'));
        }
        return undefined;
    }

    public static pathAbsoluteToRelative(aPath: string) {
        if (vscode.workspace.workspaceFolders) {
            const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            const sp = aPath.split(workspacePath);
            if (sp[1]) {
                return sp[1];
            }
        }
        return undefined;
    }

    public static checkLine(line: number, mk: mark.Mark): boolean {
        let lineCheck: number;
        for (lineCheck = mk.startLine; lineCheck <= mk.endLine; lineCheck++) {
            if (lineCheck === line) {
                break;
            }
        }
        if (lineCheck > mk.endLine) {
            return false;
        } else {
            return true;
        }
    }

    public async insert(tee: vscode.TextEditor, type: number): Promise<boolean> {

        let te = Object.assign({}, tee);

        if (this.db && this.sidebar) {

            let checkline = false;
            let name = te.document.getText(te.selection);
            name = name.replace(/\"/g, '');
            if (name.length === 0 && type === mark.Mark.FLAG_DEFAULT) {
                vscode.window.setStatusBarMessage('Not Found Select String', 2000);
                return false;
            }

            if (type === mark.Mark.FLAG_LINE) {
                let line: number;

                for (line = te.selection.start.line; line <= te.selection.end.line; line++) {
                    this.db?.mkmap.forEach((value, key, map) => {
                        if (value.flag === mark.Mark.FLAG_LINE && value.filePath === te.document.fileName) {
                            if (MarkManager.checkLine(line, value)) {
                                vscode.window.setStatusBarMessage('Line Set Used', 2000);
                                checkline = true;
                            }
                        }
                        if (checkline) {
                            return;
                        }
                    });
                    if (checkline) {
                        break;
                    }
                }
            }

            if (type === mark.Mark.FLAG_FUNCTION) {
                let line: number;

                for (line = te.selection.start.line; line <= te.selection.end.line; line++) {
                    this.db?.mkmap.forEach((value, key, map) => {
                        if (value.filePath === te.document.fileName) {
                            if (value.flag === mark.Mark.FLAG_FUNCTION || (line === te.selection.start.line && value.flag === mark.Mark.FLAG_LINE)) {
                                if (MarkManager.checkLine(line, value)) {
                                    vscode.window.setStatusBarMessage('Fun Set Used', 2000);
                                    checkline = true;
                                }
                            }
                        }

                        if (checkline) {
                            return;
                        }
                    });
                    if (checkline) {
                        break;
                    }
                }
            }

            if (checkline) {
                return false;
            }

            if (name.length === 0 || type === mark.Mark.FLAG_LINE) {
                name = "[" + path.basename(te.document.fileName) + "] " + te.selection.active.line + "-" + te.selection.anchor.character;
            }

            if (type === mark.Mark.FLAG_FUNCTION) {
                const input = await vscode.window.showInputBox(
                    { // ?????????????????????????????????????????????
                        password: false, 			// ???????????????????????????
                        ignoreFocusOut: true, 		// ??????false????????????true????????????????????????????????????????????????
                        placeHolder: 'Function Name', 	// ??????????????????????????????
                        prompt: 'Input Function Name', 	// ?????????????????????????????????
                        validateInput: (text) => {
                            return text.length > 0 ? null : 'NULL Error';
                        },
                    });
                if (input) {
                    name = input;
                } else {
                    vscode.window.setStatusBarMessage('Function Name Error', 2000);
                    return false;
                }
            }

            if (name.length > 64) {
                name = name.slice(0, 63);
            }
            const rPath = MarkManager.pathAbsoluteToRelative(te.document.fileName);

            const mk = new mark.Mark(++this.db.lastId,
                name,
                type,
                rPath,
                te.selection.anchor.line,
                te.selection.anchor.character,
                te.selection.active.line,
                te.selection.active.character,
                te.selection.start.line,
                te.selection.start.character,
                te.selection.end.line,
                te.selection.end.character,
            );

            if (this.db.insertDB(mk)) {
                this.db?.mkmapSet(mk);

                this.sidebar?.elAll?.insert(mk);
                this.sidebar?.elAll?.refresh();

                if (vscode.window.activeTextEditor?.document.fileName === mk.filePath) {
                    this.teColorManager(TEColorManagerType.tecmtShow, mk);
                }

                if (vscode.window.activeTextEditor?.document.fileName === mk.filePath) {
                    this.sidebar?.elNow?.insert(mk);
                    this.sidebar?.elNow?.refresh();
                }
                this.sidebar?.smark?.updateMarkEdit(mk);
                vscode.window.setStatusBarMessage(`Insert Success ${mk.id}`);
            }
            return true;
        }
        return false;
    }

    public checkDBInit(showError?:boolean) {
        if (this.db?.isDBInit === false && showError && showError === true) {
            vscode.window.showErrorMessage("Please Initialize CodeNotes");
        }

        return this.db?.isDBInit;
    }

    public delete(id: number) {
        if (this.db && this.sidebar) {

            const mk = this.db.mkmap.get(id);
            const name = mk?.name;
            this.teColorManager(TEColorManagerType.tecmtClear, mk);

            const promise = this.db.loadDeleteDBPromise(id);
            promise.then((res: any) => {
                this.db?.mkmapDelete(id);
                this.sidebar?.elNow.refresh();
                this.sidebar?.elAll.refresh();
                vscode.window.setStatusBarMessage('Delete ' + name, 2000);
            });
        }
    }

    public async deleteJump(id: number) {
        const mk = this.db?.mkmap.get(id);
        if (this.db && this.sidebar && mk) {
            if (mk.mdata.jb.length === 0) {
                vscode.window.setStatusBarMessage('No one Jump Link', 2000);
            } else {
                const name = mk.name;

                let items: vscode.QuickPickItem[] = [];

                for (let i = 0; i < mk.mdata.jb.length; i++) {
                    items.push({
                        label: mk.mdata.jb[i].name ? mk.mdata.jb[i].name : "null",
                        description: 'id:' + mk.mdata.jb[i].id,
                        detail: "click delete"
                    });
                };

                if (items.length > 0) {
                    let value = await vscode.window.showQuickPick(items, { placeHolder: 'Sletct Delete Jump' });

                    if (value && mk) {
                        const deleteId = Number(value?.description?.split('id:')[1]);

                        function findJb(res: any) {
                            if (res.name === value?.label && res.id === deleteId) {
                                return true;
                            }
                            else {
                                return false;
                            }

                        }

                        mk.mdata.jb.splice(mk.mdata.jb.findIndex(findJb), 1);
                        let json = JSON.stringify(mk.mdata.jb);
                        mk.jumpLink = json;
                        this.db.updateJumpLink(id, mk.jumpLink);
                    }
                } else {
                    vscode.window.setStatusBarMessage('Not Found Jump', 2000);
                }

            }
        }

    }


    public getQuickPickItem(mk: mark.Mark,type?:QuickPickItemType,jpName?:string) {
        if(type === undefined || type === QuickPickItemType.mark)
        {
            return {
                label: mk.name ? "id:" + mk.id + " " + mk.name : "id:" + mk.id,
                description: mk.relativePath + ' id:' + mk.id,
                detail: 'jump num:' + mk.mdata.jb.length + ' flag: ' + mark.Mark.flagStr[mk.flag]
            };
        }
        else if(type === QuickPickItemType.jumper && jpName){
            return {
                label: jpName + " id:" + mk.id ,
                description: mk.relativePath?.substr(1).replace(/\\/g, '/') + ' id:' + mk.id,
                detail: mk.name + ' flag: ' + mark.Mark.flagStr[mk.flag]
            };
        }else{
            return {
                label: "",
                description: "",
                detail: ""
            };
        }

    }

    public async addJump(id: number) {
        if (id === 0)
            return;

        if (this.db && this.sidebar) {
            const mk = this.db.mkmap.get(id);
            const name = mk?.name;

            let btName = await vscode.window.showInputBox({
                password: false, 			        // ???????????????????????????
                ignoreFocusOut: true, 		        // ??????false????????????true????????????????????????????????????????????????
                placeHolder: 'Jump To Function',    // ??????????????????????????????
                prompt: 'Input Jumper Name', 		// ?????????????????????????????????
            }
            );
            if (btName?.length === 0) {
                btName = 'Jump To Function';
            }

            if (btName && mk && this.db) {
                let items: vscode.QuickPickItem[] = [];

                this.db.mkmap.forEach((value) => {
                    items.push(this.getQuickPickItem(value));
                });

                let value = await vscode.window.showQuickPick(items, { placeHolder: 'Sletct ' + mk?.name + ' Jump To ' });

                if (value && mk) {
                    const jumpId = Number(value?.description?.split('id:')[1]);
                    mk.mdata.jb.push(new mark.JumpLink(btName, jumpId));
                    let json = JSON.stringify(mk.mdata.jb);
                    mk.jumpLink = json;
                    this.db.updateJumpLink(id, mk.jumpLink);

                    vscode.window.setStatusBarMessage(`Jumper Add Success ${mk.id} to ${jumpId}`);
                }

            }

            // if (btName && mk && this.db) {
            //     let items: vscode.QuickPickItem[] = [];
            //     const itemsFlag = [
            //         {
            //             label: 'Function',
            //             description: 'select from function',
            //             detail: 'number: ' + this.db.mkmapFunction.size
            //         },
            //         {
            //             label: 'Line',
            //             description: 'select from line',
            //             detail: 'number: ' + this.db.mkmapLine.size
            //         },
            //         {
            //             label: 'Default(Marks)',
            //             description: 'select from default',
            //             detail: 'number: ' + this.db.mkmapDefault.size
            //         },
            //     ];


            //     let type = await vscode.window.showQuickPick(itemsFlag, { placeHolder: 'Sletct ' + mk?.name + ' Jump To Type' });

            //     if (type) {
            //         if (type?.label === 'Function') {
            //             this.db.mkmapFunction.forEach((value, key, map) => {
            //                 items.push(this.getQuickPickItem(value));
            //             });
            //         } else if (type?.label === 'Line') {
            //             this.db.mkmapLine.forEach((value, key, map) => {
            //                 items.push(this.getQuickPickItem(value));
            //             });
            //         } else if (type?.label === 'Default(Marks)') {
            //             this.db.mkmapDefault.forEach((value, key, map) => {
            //                 items.push(this.getQuickPickItem(value));
            //             });
            //         }
            //         let value = await vscode.window.showQuickPick(items, { placeHolder: 'Sletct ' + mk?.name + ' Jump To ' });

            //         if (value && mk) {
            //             const jumpId = Number(value?.description?.split('id:')[1]);
            //             mk.mdata.jb.push(new mark.JumpLink(btName, jumpId));
            //             let json = JSON.stringify(mk.mdata.jb);
            //             mk.jumpLink = json;
            //             this.db.updateJumpLink(id, mk.jumpLink);

            //             vscode.window.setStatusBarMessage('Jumper Add Success', 2000);
            //         }
            //     }
            // }
        }
    }

    private renameItemPromise() {
        return new Promise((resolve, reject) => {
            vscode.window.showInputBox(
                { // ?????????????????????????????????????????????
                    password: false, 			// ???????????????????????????
                    ignoreFocusOut: true, 		// ??????false????????????true????????????????????????????????????????????????
                    placeHolder: 'Rename Mark', 	// ??????????????????????????????
                    prompt: 'Input New Name', 		// ?????????????????????????????????
                    //validateInput:function(text){return text;} // ????????????????????????????????????
                }).then(function (msg) {
                    if (msg) {
                        resolve(msg);
                    } else {
                        reject(new Error("array length invalid"));
                    }
                });
        });
    }

    public renameItem(id: number) {
        if (id !== 0) {
            const promise = this.renameItemPromise();
            promise.then((res: any) => {
                this.setName(id, res);
            });
        }

    }

    public async saveMarkDown(editor: vscode.TextDocument) {
        if (editor && vscode.workspace.workspaceFolders) {

            var rootUri = vscode.workspace.workspaceFolders[0].uri;
            var mDUri = vscode.Uri.file(rootUri.fsPath + "/" + database.DataBase.databasePath + "/line.md");

            if (editor.fileName === mDUri.fsPath) {
                const data = await pfs.readFile(mDUri.fsPath);

                if (data) {
                    this.setDescription(this.lineId, data.toString());
                }
            }
        }
    }

    public async loadCursorJumper(te: vscode.TextEditor) {
        let mkNum = 0;
        let numMkPrevious = 0;
        let numMkJPPrevious = 0;
        let numMkNext = 0;
        let numMkJPNext = 0;

        let mkArry = this.getSelectMarkArry(te);

        mkNum = mkArry.length;

        this.mkJPPrevious.splice(0, this.mkJPPrevious.length);
        this.mkPrevious.splice(0, this.mkPrevious.length);
        this.mkJPNext.splice(0, this.mkJPNext.length);
        this.mkNext.splice(0, this.mkNext.length);
        this.mkJpNameNext.splice(0, this.mkJpNameNext.length);
        this.mkJpNamePrevious.splice(0, this.mkJpNamePrevious.length);

        if (this.db && mkArry.length > 0) {
            const arr = Array.from(this.db.mkmap);
            for (let i = 0; i < mkArry.length; i++) {

                let numArry: mark.Mark[] = [];
                let jpName: string[] = [];
                for (let ii = 0; ii < arr.length; ii++) {
                    const mk = arr[ii][1];
                    for (let iii = 0; iii < mk.mdata.jb.length; iii++) {

                        if (mk.mdata.jb[iii].id === mkArry[i].id) {
                            numArry.push(mk);
                            jpName.push(mk.mdata.jb[iii].name);
                        }
                    }
                }
                if (numArry.length > 0) {
                    numMkJPPrevious += numArry.length;
                    this.mkJPPrevious.push(numArry);
                    this.mkJpNamePrevious.push(jpName);
                    this.mkPrevious.push(mkArry[i]);
                }

                let numArryNext: mark.Mark[] = [];
                let jpNameNext: string[] = [];
                for (let count = 0; count < mkArry[i].mdata.jb.length; count++) {
                    const k = this.db.mkmap.get(mkArry[i].mdata.jb[count].id);
                    let ret = undefined;
                    if(k && k.filePath)
                    {
                        ret = await util.promisify(fs.exists)(k.filePath); 
                    }
                    
                    if (k && ret) {
                        numArryNext.push(k);
                        jpNameNext.push(mkArry[i].mdata.jb[count].name);
                    } else {
                        mkArry[i].mdata.jb.splice(count, 1);
                        let json = JSON.stringify(mkArry[i].mdata.jb);
                        mkArry[i].jumpLink = json;
                        this.db.updateJumpLink(mkArry[i].id, mkArry[i].jumpLink);
                    }
                }

                if (numArryNext.length > 0) {
                    numMkJPNext += numArryNext.length;
                    this.mkJPNext.push(numArryNext);
                    this.mkJpNameNext.push(jpNameNext);
                    this.mkNext.push(mkArry[i]);
                }
            }
            numMkPrevious = this.mkJPPrevious.length;
            numMkNext = this.mkJPNext.length;
        }

        let str = "";
        for(let i=0;i<mkArry.length;i++)
        {
            if(mkArry[i].flag === mark.Mark.FLAG_FUNCTION)
            {
                str += " ";
                str += mkArry[i].id;
            }
        }
        for(let i=0;i<mkArry.length;i++)
        {
            if(mkArry[i].flag === mark.Mark.FLAG_LINE)
            {
                str += " ";
                str += mkArry[i].id;
            }
        }
        for(let i=0;i<mkArry.length;i++)
        {
            if(mkArry[i].flag === mark.Mark.FLAG_DEFAULT)
            {
                str += " ";
                str += mkArry[i].id;
            }
        }
        str += " ";
            
        vscode.window.setStatusBarMessage(`${mkNum} [${str}] < ${numMkJPPrevious} ${numMkPrevious} | ${numMkNext} ${numMkJPNext} >`);
    }

    public showMarkDown(fileName: string, line: number) {

        if (this.showMarkDownType === MDStype.disable) {
            return;
        }

        this.db?.mkmap.forEach((value, key, map) => {

            if (value.filePath === fileName) {
                if ((value.flag === mark.Mark.FLAG_LINE && MarkManager.checkLine(line, value)) ||
                    (value.flag === mark.Mark.FLAG_FUNCTION && line === value.startLine)) {

                    this.editMarkDown(value.id);
                }
            }
        });
    }

    public async typeMarkDown() {

        //console.log(vscode.workspace.textDocuments);        
        await vscode.commands.executeCommand("workbench.action.closeEditorsInOtherGroups");

        if (this.showMarkDownType !== MDStype.disable) {
            if (vscode.workspace.workspaceFolders) {

                var rootUri = vscode.workspace.workspaceFolders[0].uri;
                var mDUri = vscode.Uri.file(rootUri.fsPath + "/" + database.DataBase.databasePath + "/line.md");
                const file = await pfs.open(mDUri.fsPath, 'w+');
                file.close();

                if (this.showMarkDownType === MDStype.mdEdit) {
                    await vscode.workspace.openTextDocument(mDUri).then(document => {
                        vscode.window.showTextDocument(document);
                    });
                    await vscode.commands.executeCommand("workbench.action.moveEditorToRightGroup");
                }
                await vscode.commands.executeCommand("markdown.showPreviewToSide", mDUri);

                if (this.showMarkDownType === MDStype.mdEdit) {
                    await vscode.commands.executeCommand("workbench.action.moveActiveEditorGroupDown");
                    await vscode.commands.executeCommand("workbench.action.moveActiveEditorGroupUp");
                }
            }
        }
    }

    public async editMarkDown(id: number) {

        if (id !== 0) {
            const mk = this.db?.mkmap.get(id);
            if (mk && vscode.workspace.workspaceFolders) {

                var rootUri = vscode.workspace.workspaceFolders[0].uri;
                var mDUri = vscode.Uri.file(rootUri.fsPath + "/" + database.DataBase.databasePath + "/line.md");

                this.lineId = mk.id;

                if (mk.description.length === 0) {
                    await pfs.writeFile(mDUri.fsPath, "-");
                } else {
                    await pfs.writeFile(mDUri.fsPath, mk.description);
                }

                // if(this.showMarkDownType === MarkManager.MD_STYPE_MD_EDIT)
                // {
                //     await vscode.workspace.openTextDocument(mDUri).then(document => {
                //         vscode.window.showTextDocument(document,vscode.ViewColumn.Three,true);
                //     });
                // }
            }
        }

    }

    public setName(id: number, name: string) {
        const mk = this.db?.mkmap.get(id);
        if (mk) {

            mk.setName(name);

            this.db?.updateName(id, name);
            this.sidebar?.elNow.reloadItemName(mk);
            this.sidebar?.elAll.reloadItemName(mk);

            this.sidebar?.elNow.refresh();
            this.sidebar?.elAll.refresh();
        }
    }

    public setDescription(id: number, description: string) {
        const mk = this.db?.mkmap.get(id);
        if (mk) {

            mk.description = description;

            this.db?.updateDescription(id, description);
        }
    }

    public editItem(id: number) {

        const mk = this.db?.mkmap.get(id);
        if (mk) {
            //console.log(mk.textEditor);
            this.sidebar?.smark?.updateMarkEdit(mk);
        }

    }

    public reloadNowItem() {
        if (vscode.window.activeTextEditor) {

            this.db?.mkmap.forEach((value, key, map) => {
                delete value.mdata.eitemNow;
                if (value.filePath === vscode.window.activeTextEditor?.document.fileName) {
                    this.sidebar?.elNow.insert(value);
                }
            });
            this.sidebar?.elNow.refresh();
        }
    }

    public load() {
        if (this.db) {
            this.db.checkLoadDB();
        }
    }

    public reloadAllDocColor() {
        this.db?.mkmap.forEach((mk, key, map) => {
            this.teColorManager(TEColorManagerType.tecmtShow, mk);
        });

    }

    /**
     * ????????????
     * @param type 
     * @param mk 
     */
    public teColorManager(type: TEColorManagerType, mk?: mark.Mark) {
        if (type === TEColorManagerType.tecmtInit) {
            vscode.window.visibleTextEditors.forEach(editor => {
                if (editor && this.db) {
                    this.db.mkmap.forEach((value, key, map) => {
                        if (value.filePath === editor.document.fileName) {

                            this.showColor(editor, value, ShowColorType.sctShow);
                        }
                    });
                }
            });
        }
        if (type === TEColorManagerType.tecmtShow) {
            vscode.window.visibleTextEditors.forEach(editor => {
                if (editor && mk) {
                    if (mk.filePath === editor.document.fileName) {
                        this.showColor(editor, mk, ShowColorType.sctShow);
                    }
                }
            });
        }
        if (type === TEColorManagerType.tecmtClear) {
            vscode.window.visibleTextEditors.forEach(editor => {
                if (editor && mk) {
                    if (mk.filePath === editor.document.fileName) {
                        this.showColor(editor, mk, ShowColorType.sctClear);
                    }
                }
            });
        }
    }

    /**
     * ??????????????????
     * @param textEditor 
     * @param mk 
     * @param en 
     */
    public async showColor(textEditor: vscode.TextEditor, mk: mark.Mark, en: ShowColorType) {

        if (mk.isOffsetInit === false) {
            mk.isOffsetInit = true;
            mk.startOffsetMark = textEditor.document.offsetAt(new Position(mk.startLine, mk.startCharacter));
            mk.endOffsetMark = textEditor.document.offsetAt(new Position(mk.endLine, mk.endCharacter));
        }

        if (en === ShowColorType.sctClick && mk.flag === mark.Mark.FLAG_DEFAULT) {
            textEditor.selection = new vscode.Selection(
                textEditor.document.positionAt(mk.startOffsetMark),
                textEditor.document.positionAt(mk.startOffsetMark));

            textEditor.revealRange(new vscode.Range(
                textEditor.document.positionAt(mk.startOffsetMark),
                textEditor.document.positionAt(mk.endOffsetMark)), vscode.TextEditorRevealType.InCenter);
        }

        if (en === ShowColorType.sctClick && (mk.flag === mark.Mark.FLAG_LINE || mk.flag === mark.Mark.FLAG_FUNCTION)) {
            textEditor.selection = new vscode.Selection(
                textEditor.document.positionAt(mk.startOffsetMark),
                textEditor.document.positionAt(mk.startOffsetMark));

            textEditor.revealRange(new vscode.Range(
                textEditor.document.positionAt(mk.startOffsetMark),
                textEditor.document.positionAt(mk.endOffsetMark)), vscode.TextEditorRevealType.InCenter);
        }



        if (en === ShowColorType.sctShow || en === ShowColorType.sctClear) {

            let color;
            if (mk.color) {
                color = mk.color;
            } else {
                color = "#FF0000";
            }

            let decorationType: vscode.TextEditorDecorationType[] = [];
            let range: vscode.Range[] = [];

            if (mk.flag === mark.Mark.FLAG_DEFAULT) {
                if (en === ShowColorType.sctShow) {
                    decorationType.push(vscode.window.createTextEditorDecorationType({
                        gutterIconSize: "14px",
                        backgroundColor: color + "50",
                        opacity: "1",
                        borderRadius: "4px",
                    }));
                }
                range.push(new vscode.Range(textEditor.document.positionAt(mk.startOffsetMark),
                    textEditor.document.positionAt(mk.endOffsetMark)));

            } else if (mk.flag === mark.Mark.FLAG_LINE) {

                if ((mk.endLine - mk.startLine) === 0) {
                    if (en === ShowColorType.sctShow) {
                        decorationType.push(vscode.window.createTextEditorDecorationType({
                            gutterIconSize: "14px",
                            gutterIconPath: path.join(this.context.extensionPath, "images/code-line.png"),
                        }));
                    }


                    range.push(new vscode.Range(textEditor.document.positionAt(mk.startOffsetMark),
                        textEditor.document.positionAt(mk.endOffsetMark)));
                } else {
                    if (en === ShowColorType.sctShow) {
                        decorationType.push(vscode.window.createTextEditorDecorationType({
                            gutterIconSize: "14px",
                            gutterIconPath: path.join(this.context.extensionPath, "images/line-top.png"),
                        }));
                        decorationType.push(vscode.window.createTextEditorDecorationType({
                            gutterIconSize: "14px",
                            gutterIconPath: path.join(this.context.extensionPath, "images/line-down.png"),
                        }));
                    }


                    range.push(new vscode.Range(textEditor.document.positionAt(mk.startOffsetMark),
                        textEditor.document.positionAt(mk.startOffsetMark)));
                    range.push(new vscode.Range(textEditor.document.positionAt(mk.endOffsetMark),
                        textEditor.document.positionAt(mk.endOffsetMark)));
                }
            } else if (mk.flag === mark.Mark.FLAG_FUNCTION) {
                if (en === ShowColorType.sctShow) {
                    decorationType.push(vscode.window.createTextEditorDecorationType({
                        gutterIconSize: "14px",
                        gutterIconPath: path.join(this.context.extensionPath, "images/functions.png"),
                    }));
                }
                range.push(new vscode.Range(textEditor.document.positionAt(mk.startOffsetMark),
                    textEditor.document.positionAt(mk.startOffsetMark)));
            }

            if (mk.mdata?.decorationType?.length && en === ShowColorType.sctShow) {
                mk.mdata.decorationType.splice(0, mk.mdata.decorationType.length);
            }

            if (decorationType && range) {
                if (en === ShowColorType.sctShow) {
                    mk.mdata?.setDecorationType(decorationType);
                    if (vscode.workspace.getConfiguration().get('CodeNotes.disableColor') === false) {
                        if (mk.mdata.decorationType)
                            for (let i = 0; i < mk.mdata.decorationType.length; i++) {
                                textEditor.setDecorations(decorationType[i], [range[i]]);
                            }
                    }
                } else if (en === ShowColorType.sctClear) {
                    if (vscode.workspace.getConfiguration().get('CodeNotes.disableColor') === false) {
                        if (mk.mdata.decorationType)
                            for (let i = 0; i < mk.mdata.decorationType.length; i++) {
                                mk.mdata.decorationType[i].dispose();
                                textEditor.setDecorations(mk.mdata.decorationType[i], [range[i]]);
                            }
                    }
                }

            }
        }
    }

    public async generate() {
        if (!vscode.workspace.workspaceFolders) {
            return;
        }
        vscode.window.setStatusBarMessage('Generate Start...', 2000);
        const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        const gPath = <string>vscode.workspace.getConfiguration().get('CodeNotes.generatePath');
        const webCodePath = <string>vscode.workspace.getConfiguration().get('CodeNotes.generateWebCodePath');
        const gCategories = <string>vscode.workspace.getConfiguration().get('CodeNotes.generateCategories');
        const gHexoPath = <string>vscode.workspace.getConfiguration().get('CodeNotes.generateHexoPath');

        if (gPath.length === 0) {
            return;
        }

        if (this.db) {
            const arrFunction = Array.from(this.db.mkmapFunction);
            for (let cFunction = 0; cFunction < arrFunction.length; cFunction++) {
                const mkf = arrFunction[cFunction][1];

                //this.db?.mkmapFunction.forEach(async (mkf, key, map) => {
                if (this.db) {

                    const head =
                        `---
title: ${mkf.name}
date: ${date}
categories: ${gCategories}
---
`;
                    const mDUri = vscode.Uri.file(gPath + "/" + mkf.name + ".md");
                    const file = await pfs.open(mDUri.fsPath, 'w+');

                    await file.appendFile(head);

                    if (mkf.filePath) {
                        if (webCodePath.length !== 0 && mkf.relativePath) {
                            const source = "[SourceCode](" + webCodePath + "/blob/master" + mkf.relativePath.replace(/\\/g, "/") + "#L" + (mkf.startLine + 1) + ")";
                            const fPath = mkf.relativePath.replace(/\\/g, "/")
                            await file.appendFile(
                                `\r\n|??????????????????  |??????  |
|---|---|
|${source}| ${fPath} |`);
                        }

                        await file.appendFile("  \r\n```c\r\n");
                        const document = await vscode.workspace.openTextDocument(mkf.filePath);

                        if (document) {
                            const startOffsetMark = document.offsetAt(new Position(mkf.startLine, 0));
                            const endOffsetMark = document.offsetAt(new Position(mkf.startLine, 999999));
                            const range = new vscode.Range(document.positionAt(startOffsetMark), document.positionAt(endOffsetMark));
                            const text = document.getText(range);


                            await file.appendFile(text.trim());
                        }
                        await file.appendFile("\r\n```  \r\n\r\n");
                    }

                    await file.appendFile(mkf.description + "  \r\n\r\n");

                    let line: number;
                    for (line = mkf.startLine; line <= mkf.endLine; line++) {

                        const arr = Array.from(this.db?.mkmapLine);

                        for (let count = 0; count < arr.length; count++) {
                            const mkl = arr[count][1];

                            if (mkl.startLine <= line && mkl.endLine >= line && mkl.filePath === mkf.filePath)//match
                            {
                                await file.appendFile("  \r\n```c\r\n");
                                if (mkl.filePath) {


                                    const document = await vscode.workspace.openTextDocument(mkl.filePath);

                                    if (document) {
                                        const startOffsetMark = document.offsetAt(new Position(mkl.startLine, 0));
                                        const endOffsetMark = document.offsetAt(new Position(mkl.endLine, 999999));
                                        const range = new vscode.Range(document.positionAt(startOffsetMark), document.positionAt(endOffsetMark));
                                        let text = document.getText(range);
                                        if (mkl.startLine === mkl.endLine) {
                                            text = text.trim();
                                        }
                                        await file.appendFile(text);
                                    };

                                    line += (mkl.endLine - mkl.startLine);


                                }

                                await file.appendFile("\r\n```  \r\n\r\n");

                                const arrMark = Array.from(this.db?.mkmapDefault);


                                for (let cc = 0; cc < arrMark.length; cc++) {
                                    const mkd = arrMark[cc][1];

                                    if (mkl.startLine <= mkd.startLine && mkl.endLine >= mkd.startLine && mkl.filePath === mkd.filePath) {

                                        for (let cjb = 0; cjb < mkd.mdata.jb.length; cjb++) {
                                            const jb = mkd.mdata.jb[cjb];
                                            if (jb) {
                                                const jbName = jb.name;
                                                const mkk = this.db?.mkmap.get(jb.id);
                                                const fName = mkk?.name;
                                                const fPath = date.split(" ")[0].replace(/-/g, "/");
                                                let type = "";
                                                if (mkk?.flag == mark.Mark.FLAG_DEFAULT) {
                                                    type = "??????";
                                                } else if (mkk?.flag == mark.Mark.FLAG_LINE) {
                                                    type = "???";
                                                } else if (mkk?.flag == mark.Mark.FLAG_FUNCTION) {
                                                    type = "??????";
                                                }
                                                if (jbName && fName) {
                                                    await file.appendFile(`* [??????${fName}${type}](${gHexoPath}/${fPath}/${gCategories}/${fName})  \r\n\r\n`);
                                                }
                                            }


                                        }

                                    }

                                }

                                await file.appendFile(mkl.description + "\r\n\r\n");
                            }
                        };
                    }

                    await file.close();
                    vscode.window.setStatusBarMessage('Generate Success.', 2000);
                }
                //});
            };
        }

    }

    /**
     * ??????item??????
     * @param id 
     */
    //????????????????????????:http://www.voidcn.com/article/p-kyntjbrl-bvo.html
    public click(id: number) {
        if (this.db && this.sidebar?.elAll) {
            const mk = this.db.mkmap.get(id);
            if (mk) {

                this.sidebar.smark?.updateMarkEdit(mk);

                if (mk.filePath) {
                    const uri = vscode.Uri.file(mk.filePath);
                    vscode.workspace.openTextDocument(uri).then(document => {
                        vscode.window.showTextDocument(document, vscode.ViewColumn.One, false).then(textEditor => {
                            this.showColor(textEditor, mk, ShowColorType.sctClick);
                            this.loadCursorJumper(textEditor);
                        });
                    });
                }
            }
        }
    }

    public async jumpTo(type?: number | undefined) {
        let items: vscode.QuickPickItem[] = [];
        if (type === undefined && this.db) {
            const arr = Array.from(this.db.mkmap);
            for (let i = 0; i < arr.length; i++) {
                const mk = arr[i][1];
                items.push(this.getQuickPickItem(mk));
            }
        } else if (type === mark.Mark.FLAG_DEFAULT && this.db) {
            const arr = Array.from(this.db.mkmapDefault);
            for (let i = 0; i < arr.length; i++) {
                const mk = arr[i][1];
                items.push(this.getQuickPickItem(mk));
            }
        } else if (type === mark.Mark.FLAG_LINE && this.db) {
            const arr = Array.from(this.db.mkmapLine);
            for (let i = 0; i < arr.length; i++) {
                const mk = arr[i][1];
                items.push(this.getQuickPickItem(mk));
            }
        } else if (type === mark.Mark.FLAG_FUNCTION && this.db) {
            const arr = Array.from(this.db.mkmapFunction);
            for (let i = 0; i < arr.length; i++) {
                const mk = arr[i][1];
                items.push(this.getQuickPickItem(mk));
            }
        }
        if (items.length > 1) {
            let value = await vscode.window.showQuickPick(items, { placeHolder: 'Sletct JumpTo' });
            if (value) {
                const jumpId = Number(value?.description?.split('id:')[1]);
                if (jumpId) {
                    this.click(jumpId);
                }
            }

        }
    }

    // public jumpToNext(id: number) {
    //     const mk = this.db?.mkmap.get(id);
    //     if (mk && mk.mdata.jb && mk.mdata.jb.length !== 0) {
    //         let index = 0;
    //         if (mk.mdata.jb.length === 1) {
    //             index = 0;
    //         } else {
    //             for (let i = 0; i < mk.mdata.jb.length; i++) {

    //                 if (mk.mdata.jb[i].name === "Jump To Function") {
    //                     index = i;
    //                 }
    //             }
    //         }

    //         this.click(mk.mdata.jb[index].id);
    //     }
    // }

    public async jumpToNext() {
        if (this.mkNext.length > 0) {
            // const id = await this.getQuickPickItemId(this.mkNext);
            // if (id) {
            //     let i = 0;
            //     for (i = 0; i < this.mkNext.length; i++) {
            //         if (this.mkNext[i].id === id) {
            //             break;
            //         }
            //     }
            //     const idjp = await this.getQuickPickItemId(this.mkJPNext[i],QuickPickItemType.jumper,this.mkJpNameNext[i]);
            //     if (idjp) {
            //         this.click(idjp);
            //     }
            // }

            let mkArry: mark.Mark[] = [];
            let jpName:string[] = [];
            for (let i = 0; i < this.mkNext.length; i++) {
                mkArry.push.apply(mkArry,this.mkJPNext[i]);
                jpName.push.apply(jpName,this.mkJpNameNext[i]);
            }
            
            const idjp = await this.getQuickPickItemId(mkArry,QuickPickItemType.jumper,jpName);
            if (idjp) {
                this.click(idjp);
            }
        }
    }

    public async jumpToPrevious() {
        if (this.mkPrevious.length > 0) {
            // const id = await this.getQuickPickItemId(this.mkPrevious);
            // if (id) {
            //     let i = 0;
            //     for (i = 0; i < this.mkPrevious.length; i++) {
            //         if (this.mkPrevious[i].id === id) {
            //             break;
            //         }
            //     }
            //     const idjp = await this.getQuickPickItemId(this.mkJPPrevious[i]);
            //     if (idjp) {
            //         this.click(idjp);
            //     }
            // }

            let mkArry: mark.Mark[] = [];
            let jpName:string[] = [];
            for (let i = 0; i < this.mkPrevious.length; i++) {
                mkArry.push.apply(mkArry,this.mkJPPrevious[i]);
                jpName.push.apply(jpName,this.mkJpNamePrevious[i]);
            }
            
            const idjp = await this.getQuickPickItemId(mkArry,QuickPickItemType.jumper,jpName);
            if (idjp) {
                this.click(idjp);
            }
        }
    }

    public async getQuickPickItemId(mkArry: mark.Mark[],type?:QuickPickItemType,jpName?:string[]): Promise<number> {
        let items;
        if(type === undefined || type === QuickPickItemType.mark)
        {
            items = this.mkArryToQuickPickItem(mkArry);
        }else if(type === QuickPickItemType.jumper && jpName)
        {
            items = this.mkArryToQuickPickItem(mkArry,type,jpName);
        }
         
        if(items === undefined)
        {
            return 0;
        }

        if (items.length > 1) {
            let value = await vscode.window.showQuickPick(items, { placeHolder: 'Sletct Previous Mark' });

            if (value) {
                const jumpId = Number(value?.description?.split('id:')[1]);
                return jumpId;
            }
        } else if (items.length === 1 && items[0] !== null) {
            return Number(items[0]?.description?.split('id:')[1]);
        } else {
            vscode.window.setStatusBarMessage('Not Found Marks', 2000);
            return 0;
        }
        return 0;
    }

    /**
     * ??????point???????????????????????????????????????
     * @param doc 
     * @param mk 
     * @param p 
     * @returns 
     */
    public static checkPoint(doc: vscode.TextDocument, mk: mark.Mark, p: Position): boolean {
        const docOffset = doc.offsetAt(p);

        if (mk.flag === mark.Mark.FLAG_FUNCTION) {
            if (mk.startLine === p.line) {
                return true;
            }
        } else if (mk.flag === mark.Mark.FLAG_LINE) {
            if (mk.startLine <= p.line && mk.endLine >= p.line) {
                return true;
            }
        } else if (mk.startOffsetMark <= docOffset && docOffset <= mk.endOffsetMark) {
            return true;
        }
        return false;
    }

    public getSelectMarkArry(te: vscode.TextEditor, type?: number | undefined): mark.Mark[] {
        let arry: mark.Mark[] = [];

        this.db?.mkmap.forEach((value, key, map) => {

            if (value.filePath === te.document.fileName) {
                if (type !== undefined) {
                    if (value.flag === type) {
                        if (MarkManager.checkPoint(te.document, value, te.selection.anchor) === true) {
                            arry.push(value);
                        }
                    }
                } else {
                    if (value.flag === mark.Mark.FLAG_DEFAULT) {
                        if (MarkManager.checkPoint(te.document, value, te.selection.anchor) === true) {
                            arry.push(value);
                        }
                    } else if (value.flag === mark.Mark.FLAG_LINE) {
                        if (MarkManager.checkLine(te.selection.start.line, value) === true) {
                            arry.push(value);
                        }
                    } else if (value.flag === mark.Mark.FLAG_FUNCTION) {
                        if (te.selection.start.line === value.startLine) {
                            arry.push(value);
                        }
                    }
                }
            }
        });

        return arry;
    }

    public mkArryToQuickPickItem(mkArry: mark.Mark[],type?:QuickPickItemType,jpName?:string[]): vscode.QuickPickItem[] {
        let items: vscode.QuickPickItem[] = [];
        if (mkArry) {
            for (let i = 0; i < mkArry.length; i++) {
                if(type === undefined || type === QuickPickItemType.mark)
                {
                    items.push(this.getQuickPickItem(mkArry[i]));
                }else if(type === QuickPickItemType.jumper && jpName){
                    items.push(this.getQuickPickItem(mkArry[i],type,jpName[i]));
                }
                
            }
        }
        return items;
    }

    public async selectWhitch(te: vscode.TextEditor, work: string, type?: number | undefined) {


        let mkArry = this.getSelectMarkArry(te, type);

        let items = this.mkArryToQuickPickItem(mkArry);

        if (items.length > 1) {
            let value = await vscode.window.showQuickPick(items, { placeHolder: 'Sletct ' + work + ' Mark' });

            if (value) {
                const jumpId = Number(value?.description?.split('id:')[1]);
                return jumpId;
            }
        } else if (items.length === 1 && items[0] !== null) {
            return Number(items[0]?.description?.split('id:')[1]);
        } else {
            vscode.window.setStatusBarMessage('Not Found Marks', 2000);
            return 0;
        }
        return 0;
    }

    //https://code.visualstudio.com/api/extension-guides/command
    /**
     * ??????HoverProvider
     * @param db 
     * @returns 
     */
    public getHoverProvider(db: database.DataBase) {
        return vscode.languages.registerHoverProvider('*', {
            provideHover(document, position, token): vscode.ProviderResult<vscode.Hover> {

                let isShow = false;
                const contents = new vscode.MarkdownString();
                db?.mkmap.forEach((value, key, map) => {
                    if (value.filePath === document.fileName) {
                        if (MarkManager.checkPoint(document, value, position) === true) {
                            isShow = true;

                            contents.appendMarkdown("### " + value.name + "\r\n");

                            // const entryItem = new Sidebar.EntryItem("",vscode.TreeItemCollapsibleState.None);

                            // entryItem.command = {
                            // command:"", 
                            // title:"",
                            // arguments:[value.id] 
                            // };

                            // const args = [entryItem];
                            // const editUri = vscode.Uri.parse(`command:codenotes.editItem?${encodeURIComponent(JSON.stringify(args))}`);
                            // const deleteUri = vscode.Uri.parse(`command:codenotes.deleteItem?${encodeURIComponent(JSON.stringify(args))}`);
                            // contents.appendMarkdown(`[Edit](${editUri}) &ensp; [Delete](${deleteUri})  \r\n`);

                            contents.appendMarkdown(value.description + "  \r\n  \r\n");

                            value.mdata.jb.forEach((res) => {
                                const args = [res.id];
                                const commentCommandUri = vscode.Uri.parse(`command:sidebar_marks_all.openChild?${encodeURIComponent(JSON.stringify(args))}`);
                                contents.appendMarkdown(`* [` + res.name + `](${commentCommandUri})  \r\n`);
                            });

                            contents.appendMarkdown("  \r\n---   \r\n");

                        }
                    }
                });

                //??????????????????https://code.visualstudio.com/api/extension-guides/command
                //?????? commentCommandUri ????????????

                contents.isTrusted = true;
                if (isShow === false) {
                    return undefined;
                }
                else {
                    return new vscode.Hover(contents);
                }
            }
        }
        );
    }

    public onChangeDoc(mk: mark.Mark, cc: vscode.TextDocumentContentChangeEvent, doc: vscode.TextDocumentChangeEvent) {

        // console.log("***************");
        // console.log(mk.startLine + " " +mk.endLine);
        // console.log(mk.startCharacter + " " +mk.endCharacter);
        // console.log(cc.text.search('\r') );

        //console.log("old ==>>" + mk.startOffsetMark+ " " +mk.endOffsetMark);

        if (cc.rangeOffset < mk.startOffsetMark) {

            if (mk.startOffsetMark > cc.rangeOffset &&
                (cc.rangeOffset + cc.rangeLength) > mk.startOffsetMark) {
                //console.log("start code 0");


                if ((mk.startOffsetMark - cc.rangeOffset) >= cc.text.length) {
                    mk.startOffsetMark -= (cc.rangeLength - cc.text.length - ((cc.rangeOffset + cc.rangeLength) - mk.startOffsetMark));
                }


            } else if ((mk.startOffsetMark - cc.rangeOffset) < cc.rangeLength) {
                //console.log("start code 1");
                mk.startOffsetMark -= (mk.startOffsetMark - cc.rangeOffset);
            } else {
                //console.log("start code 2");
                mk.startOffsetMark += (cc.text.length - cc.rangeLength);
            }

        }

        //console.log("==>>" + (mk.endOffsetMark >= cc.rangeOffset));
        // console.log("==>>" + (cc.rangeLength <= cc.text.length));
        //console.log("==>>" + ((cc.rangeOffset + cc.text.length) >= mk.endOffsetMark));
        //console.log("==>>" + ((cc.rangeOffset + cc.rangeLength) > mk.endOffsetMark));
        //console.log("==>>" + (cc.rangeOffset >= mk.startOffsetMark));

        if (cc.rangeOffset <= mk.endOffsetMark) {
            if (mk.endOffsetMark >= cc.rangeOffset &&
                // cc.rangeLength <= cc.text.length &&
                //(cc.rangeOffset + cc.text.length) >= mk.endOffsetMark &&
                (cc.rangeOffset + cc.rangeLength) > mk.endOffsetMark &&
                cc.rangeOffset >= mk.startOffsetMark &&
                cc.rangeLength !== 0) {

                if ((cc.rangeOffset + cc.text.length) < mk.endOffsetMark) {
                    //console.log("end code 0.1");
                    mk.endOffsetMark -= (mk.endOffsetMark - cc.rangeOffset - cc.text.length);
                }

                //console.log("end code 0");
            } else if ((mk.endOffsetMark - cc.rangeOffset) < cc.rangeLength) {
                //console.log("end code 1");
                mk.endOffsetMark -= (mk.endOffsetMark - cc.rangeOffset);
            } else {
                //console.log("end code 2");
                mk.endOffsetMark += (cc.text.length - cc.rangeLength);
            }
        }


        //console.log("new ==>>" + mk.startOffsetMark+ " " +mk.endOffsetMark);

    }

    /**
     * ????????????
     * @param id 
     * @param color 
     */
    public setColor(id: number, color: string) {
        const mk = this.db?.mkmap.get(id);
        if (mk) {
            mk.color = color;
            //console.log("set color " + color);
            vscode.window.visibleTextEditors.forEach(editor => {
                if (editor && mk) {
                    if (mk.filePath === editor.document.fileName) {
                        this.showColor(editor, mk, ShowColorType.sctShow);
                    }
                }
            });

            this.db?.updateColor(mk.id, color);
        }
    }
}

