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

export class MarkManager {

    public static MD_STYPE_DISABLE = 0;
    public static MD_STYPE_ONLYMD = 1;
    public static MD_STYPE_MD_EDIT = 2;

    public showMarkDownType: number = 0;

    private context: vscode.ExtensionContext;
    private sidebar: Sidebar.Sidebar | undefined;

    private db: database.DataBase | undefined;

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
            return path.join(workspacePath, rPath);
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
                    { // 这个对象中所有参数都是可选参数
                        password: false, 			// 输入内容是否是密码
                        ignoreFocusOut: true, 		// 默认false，设置为true时鼠标点击别的地方输入框不会消失
                        placeHolder: 'Function Name', 	// 在输入框内的提示信息
                        prompt: 'Input Function Name', 	// 在输入框下方的提示信息
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

            }
            return true;
        }
        return false;
    }

    public checkDBInit() {
        if (this.db?.isDBInit === false) {
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
        if (this.db && this.sidebar) {
            const mk = this.db.mkmap.get(id);

            if (mk?.mdata.jb[0] === null && mk?.mdata.jb.length === 1) {
                vscode.window.setStatusBarMessage('No one Jump Link', 2000);
            } else {
                const name = mk?.name;

                let items: vscode.QuickPickItem[] = [];

                mk?.mdata.jb.forEach((value, key, map) => {
                    items.push({
                        label: value.name ? value.name : "null",
                        description: 'id:' + value.id,
                        detail: "click delete"
                    });
                });

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

                        delete mk?.mdata.jb[mk?.mdata.jb.findIndex(findJb)];
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

    public getQuickPickItem(mk: mark.Mark) {
        return {
            label: mk.name ? mk.name : "null",
            description: 'id:' + mk.id,
            detail: 'jump num:' + mk.mdata.jb.length + ' flag: ' + mark.Mark.flagStr[mk.flag]
        }
    }

    public async addJump(id: number) {
        if (id === 0)
            return;

        if (this.db && this.sidebar) {
            const mk = this.db.mkmap.get(id);
            const name = mk?.name;

            let btName = await vscode.window.showInputBox({
                password: false, 			        // 输入内容是否是密码
                ignoreFocusOut: true, 		        // 默认false，设置为true时鼠标点击别的地方输入框不会消失
                placeHolder: 'Jump To Function',    // 在输入框内的提示信息
                prompt: 'Input Jumper Name', 		// 在输入框下方的提示信息
            }
            );
            if (btName?.length == 0) {
                btName = 'Jump To Function';
            }


            if (btName && mk && this.db) {
                let items: vscode.QuickPickItem[] = [];
                const itemsFlag = [
                    {
                        label: 'Function',
                        description: 'select from function',
                        detail: 'number: ' + this.db.mkmapFunction.size
                    },
                    {
                        label: 'Line',
                        description: 'select from line',
                        detail: 'number: ' + this.db.mkmapLine.size
                    },
                    {
                        label: 'Default(Marks)',
                        description: 'select from default',
                        detail: 'number: ' + this.db.mkmapDefault.size
                    },
                ];


                let type = await vscode.window.showQuickPick(itemsFlag, { placeHolder: 'Sletct ' + mk?.name + ' Jump To Type' });

                if (type) {
                    if (type?.label === 'Function') {
                        this.db.mkmapFunction.forEach((value, key, map) => {
                            items.push(this.getQuickPickItem(value));
                        });
                    } else if (type?.label === 'Line') {
                        this.db.mkmapLine.forEach((value, key, map) => {
                            items.push(this.getQuickPickItem(value));
                        });
                    } else if (type?.label === 'Default(Marks)') {
                        this.db.mkmapDefault.forEach((value, key, map) => {
                            items.push(this.getQuickPickItem(value));
                        });
                    }
                    let value = await vscode.window.showQuickPick(items, { placeHolder: 'Sletct ' + mk?.name + ' Jump To ' });

                    if (value && mk) {
                        const jumpId = Number(value?.description?.split('id:')[1]);
                        mk.mdata.jb.push(new mark.JumpLink(btName, jumpId));
                        let json = JSON.stringify(mk.mdata.jb);
                        mk.jumpLink = json;
                        this.db.updateJumpLink(id, mk.jumpLink);
    
                        vscode.window.setStatusBarMessage('Jumper Add Success', 2000);
                    }
                }
            }
        }
    }

    private renameItemPromise() {
        return new Promise((resolve, reject) => {
            vscode.window.showInputBox(
                { // 这个对象中所有参数都是可选参数
                    password: false, 			// 输入内容是否是密码
                    ignoreFocusOut: true, 		// 默认false，设置为true时鼠标点击别的地方输入框不会消失
                    placeHolder: 'Rename Mark', 	// 在输入框内的提示信息
                    prompt: 'Input New Name', 		// 在输入框下方的提示信息
                    //validateInput:function(text){return text;} // 对输入内容进行验证并返回
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
    public showMarkDown(fileName: string, line: number) {



        if (this.showMarkDownType === MarkManager.MD_STYPE_DISABLE) {
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

        await vscode.commands.executeCommand("workbench.action.closeEditorsInOtherGroups");

        if (this.showMarkDownType !== MarkManager.MD_STYPE_DISABLE) {
            if (vscode.workspace.workspaceFolders) {
                var rootUri = vscode.workspace.workspaceFolders[0].uri;
                var mDUri = vscode.Uri.file(rootUri.fsPath + "/" + database.DataBase.databasePath + "/line.md");
                const file = await pfs.open(mDUri.fsPath, 'w+');
                file.close();

                if (this.showMarkDownType === MarkManager.MD_STYPE_MD_EDIT) {
                    await vscode.workspace.openTextDocument(mDUri).then(document => {
                        vscode.window.showTextDocument(document);

                    });
                    await vscode.commands.executeCommand("workbench.action.moveEditorToRightGroup");
                }
                await vscode.commands.executeCommand("markdown.showPreviewToSide", mDUri);

                if (this.showMarkDownType === MarkManager.MD_STYPE_MD_EDIT) {
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
     * 颜色管理
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
     * 段落颜色显示
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



        if (en === ShowColorType.sctShow) {

            let color;
            if (mk.color) {
                color = mk.color;
            } else {
                color = "#FF0000";
            }

            let decorationType;
            let range;

            if (mk.flag === mark.Mark.FLAG_DEFAULT) {
                decorationType = vscode.window.createTextEditorDecorationType({
                    gutterIconSize: "14px",
                    backgroundColor: color + "50",
                    opacity: "1",
                    borderRadius: "4px",
                });
                range = new vscode.Range(textEditor.document.positionAt(mk.startOffsetMark),
                    textEditor.document.positionAt(mk.endOffsetMark));
            } else if (mk.flag === mark.Mark.FLAG_LINE) {
                decorationType = vscode.window.createTextEditorDecorationType({
                    gutterIconSize: "14px",
                    gutterIconPath: path.join(this.context.extensionPath, "images/code-line.png"),
                });
                range = new vscode.Range(textEditor.document.positionAt(mk.startOffsetMark),
                    textEditor.document.positionAt(mk.endOffsetMark));
            } else if (mk.flag === mark.Mark.FLAG_FUNCTION) {
                decorationType = vscode.window.createTextEditorDecorationType({
                    gutterIconSize: "14px",
                    gutterIconPath: path.join(this.context.extensionPath, "images/functions.png"),
                });
                range = new vscode.Range(textEditor.document.positionAt(mk.startOffsetMark),
                    textEditor.document.positionAt(mk.startOffsetMark));
            }




            if (mk.mdata?.decorationType) {
                mk.mdata.decorationType.dispose();
            }

            if (decorationType && range) {
                mk.mdata?.setDecorationType(decorationType);
                if (vscode.workspace.getConfiguration().get('CodeNotes.disableColor') === false) {
                    textEditor.setDecorations(decorationType, [range]);
                }
            }

        }

        if (en === ShowColorType.sctClear) {

            if (mk.mdata?.decorationType) {
                mk.mdata.decorationType.dispose();

                textEditor.setDecorations(mk.mdata.decorationType, [new vscode.Range(textEditor.document.positionAt(mk.startOffsetMark),
                    textEditor.document.positionAt(mk.endOffsetMark))]);
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
`\r\n|查看函数源码  |路径  |
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
                                    
                                    if(mkl.startLine <= mkd.startLine && mkl.endLine >= mkd.startLine && mkl.filePath === mkd.filePath)
                                    {
                            
                                        for (let cjb = 0; cjb < mkd.mdata.jb.length; cjb++) {
                                            const jb = mkd.mdata.jb[cjb];
                                            if(jb)
                                            {
                                                const jbName = jb.name;
                                                const mkk = this.db?.mkmap.get(jb.id);
                                                const fName = mkk?.name;
                                                const fPath = date.split(" ")[0].replace(/-/g,"/");
                                                let type="";
                                                if(mkk?.flag == mark.Mark.FLAG_DEFAULT)
                                                {
                                                    type = "标签";
                                                }else if(mkk?.flag == mark.Mark.FLAG_LINE)
                                                {
                                                    type = "行";
                                                }else if(mkk?.flag == mark.Mark.FLAG_FUNCTION)
                                                {
                                                    type = "函数";
                                                }
                                                if(jbName && fName)
                                                {
                                                    await file.appendFile(`* [查看${fName}${type}](${gHexoPath}/${fPath}/${gCategories}/${fName})  \r\n\r\n`);
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
     * 点击item执行
     * @param id 
     */
    //文件插入内容请看:http://www.voidcn.com/article/p-kyntjbrl-bvo.html
    public click(id: number) {
        if (this.db && this.sidebar?.elAll) {
            const mk = this.db.mkmap.get(id);
            if (mk) {

                this.sidebar.smark?.updateMarkEdit(mk);

                if (mk.filePath) {
                    const uri = vscode.Uri.file(mk.filePath);
                    vscode.workspace.openTextDocument(uri).then(document => {
                        vscode.window.showTextDocument(document).then(textEditor => {
                            this.showColor(textEditor, mk, ShowColorType.sctClick);
                        });
                    });
                }
            }
        }
    }

    /**
     * 检查point在文件中的位置是否符合段内
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

    public async selectWhitch(te: vscode.TextEditor, work: string,type?:number | undefined) {
        //console.log(te);
        let items: vscode.QuickPickItem[] = [];
        this.db?.mkmap.forEach((value, key, map) => {
            
            if (value.filePath === te.document.fileName) {
                if(type !== undefined)
                {
                    if(value.flag === type)
                    {
                        if (MarkManager.checkPoint(te.document, value, te.selection.anchor) === true) {
                            items.push(this.getQuickPickItem(value));
                        }
                    }
                }else{
                    if (value.flag === mark.Mark.FLAG_DEFAULT) {
                        if (MarkManager.checkPoint(te.document, value, te.selection.anchor) === true) {
                            items.push(this.getQuickPickItem(value));
                        }
                    } else if (value.flag === mark.Mark.FLAG_LINE) {
                        if (MarkManager.checkLine(te.selection.start.line, value) === true) {
                            items.push(this.getQuickPickItem(value));
                        }
                    } else if (value.flag === mark.Mark.FLAG_FUNCTION) {
                        if (te.selection.start.line === value.startLine) {
                            items.push(this.getQuickPickItem(value));
                        }
                    }
                }
            }

        });

        if (items.length > 1) {
            let value = await vscode.window.showQuickPick(items, { placeHolder: 'Sletct ' + work + ' Mark' });

            if (value) {
                const jumpId = Number(value?.description?.split('id:')[1]);
                return jumpId;
            }
        } else if (items.length == 1 && items[0] != null) {
            return Number(items[0]?.description?.split('id:')[1]);
        } else {
            vscode.window.setStatusBarMessage('Not Found Marks', 2000);
            return 0;
        }
        return 0;
    }

    //https://code.visualstudio.com/api/extension-guides/command
    /**
     * 获取HoverProvider
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

                //使用细节查看https://code.visualstudio.com/api/extension-guides/command
                //搜索 commentCommandUri 快速定位

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
     * 设置颜色
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

