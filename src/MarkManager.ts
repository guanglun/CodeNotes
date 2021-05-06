import * as vscode from 'vscode';
import * as Sidebar from './sidebar/Sidebar';
import * as database from './DataBase';
import * as mark from './Mark';
import * as path from 'path';
import { Position } from 'vscode';
import { mkdir } from 'node:fs';
import { isDate } from 'node:util';
import { promises as pfs } from 'fs';
import  * as fs  from 'fs';
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

    private context: vscode.ExtensionContext;
    private sidebar: Sidebar.Sidebar | undefined;

    private db: database.DataBase | undefined;

    private lineId:number = 0;
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
            //console.log(workspacePath);
            return path.join(workspacePath, rPath);
        }
        return undefined;
    }

    public static pathAbsoluteToRelative(aPath: string) {
        if (vscode.workspace.workspaceFolders) {
            const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            //console.log(workspacePath);
            const sp = aPath.split(workspacePath);
            if (sp[1]) {
                return sp[1];
            }
        }
        return undefined;
    }

    public static checkLine(line:number,mk:mark.Mark):boolean
    {
        let lineCheck:number;
        for(lineCheck = mk.startLine;lineCheck <=  mk.endLine;lineCheck++)
        {
            if(lineCheck === line)
            {
                break;
            }
        }
        if(lineCheck > mk.endLine)
        {
            return false;
        }else{
            return true;
        }
    }

    public insert(te: vscode.TextEditor,type: number): boolean {
        if (this.db && this.sidebar) {

            let checkline = true;
            let name = te.document.getText(te.selection);

            if(name.length === 0 && type === mark.Mark.FLAG_DEFAULT)
            {
                vscode.window.setStatusBarMessage('Not Found Select String', 2000);
                return false;
            }

            if(type === mark.Mark.FLAG_LINE)
            {
                let line: number;
                let lineCheck: number;

                for(line = te.selection.start.line;line <=  te.selection.end.line;line++)
                {
                    this.db?.mkmap.forEach((value, key, map) => {
                        if (value.flag === mark.Mark.FLAG_LINE) {
                            if(MarkManager.checkLine(line,value))
                            {
                                vscode.window.setStatusBarMessage('Line Set Used', 2000);
                                 checkline = true;
                            }
                        }
                        if(checkline)
                        {
                            return;
                        }
                    });
                    if(checkline)
                    {
                        break;
                    }
                }
            }

            if(checkline)
            {
                return false;
            }

            if (name.length === 0) {
                name = "[" + path.basename(te.document.fileName) + "] " + te.selection.active.line + "-" + te.selection.anchor.character;
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

            const promise = this.db.loadInsertDBPromise(mk);
            promise.then((res: any) => {

                this.db?.mkmap.set(mk.id, mk);
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

            });

            return true;
        }
        return false;
    }

    public checkDBInit() {
        if (this.db?.isDBInit == false)
            vscode.window.showErrorMessage("Please Initialize CodeNotes");
        return this.db?.isDBInit;
    }

    public delete(id: number) {
        if (this.db && this.sidebar) {

            const mk = this.db.mkmap.get(id);
            const name = mk?.name;
            this.teColorManager(TEColorManagerType.tecmtClear, mk);

            const promise = this.db.loadDeleteDBPromise(id);
            promise.then((res: any) => {
                this.db?.mkmap.delete(id);
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
            detail: 'jump num:' + mk.mdata.jb.length + ' flag: '+ mark.Mark.flagStr[mk.flag]
        }
    }

    public async addJump(id: number) {
        if (id == 0)
            return;

        if (this.db && this.sidebar) {
            const mk = this.db.mkmap.get(id);
            const name = mk?.name;

            let btName = await vscode.window.showInputBox({
                password: false, 			// 输入内容是否是密码
                ignoreFocusOut: true, 		// 默认false，设置为true时鼠标点击别的地方输入框不会消失
                placeHolder: 'Jumper Name', // 在输入框内的提示信息
                prompt: 'Input Jumper Name', 		// 在输入框下方的提示信息
                //validateInput:function(text){return text;} // 对输入内容进行验证并返回
                validateInput: (text) => {
                    return text.length > 0 ? null : 'null is error';
                },
            }
            );

            if (btName) {
                let items: vscode.QuickPickItem[] = [];

                this.db?.mkmap.forEach((value, key, map) => {
                    items.push(this.getQuickPickItem(value));
                });

                let value = await vscode.window.showQuickPick(items, { placeHolder: 'Sletct Jump To Mark' });

                if (value && mk) {
                    const jumpId = Number(value?.description?.split('id:')[1]);
                    mk.mdata.jb.push(new mark.JumpLink(btName, jumpId));
                    let json = JSON.stringify(mk.mdata.jb);
                    mk.jumpLink = json;
                    this.db.updateJumpLink(id, mk.jumpLink);
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
        if (id != 0) {
            const promise = this.renameItemPromise();
            promise.then((res: any) => {
                this.setName(id, res);
            });
        }

    }

    public async saveMarkDown(editor:vscode.TextDocument)
    {
        if (editor && vscode.workspace.workspaceFolders) 
        {
            var rootUri = vscode.workspace.workspaceFolders[0].uri;
            var mDUri = vscode.Uri.file(rootUri.fsPath + "/" + database.DataBase.databasePath + "/line.md");
            console.log("in 1")
            if(editor.fileName === mDUri.fsPath)
            {
                const data = await pfs.readFile(mDUri.fsPath);

                console.log("in 2")
                if(data)
                {
                    console.log(data.toString())
                    this.setDescription(this.lineId,data.toString());
                }

            }
        }

    }
    public showMarkDown(event:vscode.TextEditorSelectionChangeEvent) {
        this.db?.mkmap.forEach((value, key, map) => {
            if (value.filePath ===event.textEditor.document.fileName) {
                if(value.flag === mark.Mark.FLAG_LINE && MarkManager.checkLine(event.selections[0].active.line,value))
                {
                    this.editMarkDown(value.id);
                }
            }
        });
    }

    public editMarkDown(id: number) {
        if (id !== 0) {
            const mk = this.db?.mkmap.get(id);
            if (mk && vscode.workspace.workspaceFolders) {

                var rootUri = vscode.workspace.workspaceFolders[0].uri;
                var mDUri = vscode.Uri.file(rootUri.fsPath + "/" + database.DataBase.databasePath + "/line.md");

                this.lineId = mk.id;
                fs.open(mDUri.fsPath, 'w+', function (err, fd) {
                    if (err) {
                        return console.error(err);
                    }

                    fs.writeFile(mDUri.fsPath, mk.description, async function (err) {
                        if (err) {
                            return console.error(err);
                        }

                        
                        await vscode.commands.executeCommand("markdown.showPreviewToSide",mDUri);
                        vscode.workspace.openTextDocument(mDUri).then(document => {
                            vscode.window.showTextDocument(document,vscode.ViewColumn.Three,true).then(textEditor => {
                                
                            });
                        });

                        if(vscode.window.visibleTextEditors)
                            vscode.window.showTextDocument(vscode.window.visibleTextEditors[0].document ,vscode.ViewColumn.One,false).then(textEditor => {
                                
                        });
                    });

                    
                });

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

        if (en === ShowColorType.sctClick) {
            textEditor.selection = new vscode.Selection(textEditor.document.positionAt(mk.startOffsetMark),
                textEditor.document.positionAt(mk.endOffsetMark));

            textEditor.revealRange(new vscode.Range(textEditor.document.positionAt(mk.startOffsetMark),
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
            if(mk.flag === mark.Mark.FLAG_DEFAULT)
            {
                decorationType = vscode.window.createTextEditorDecorationType({
                    gutterIconSize: "14px",
                    backgroundColor: color + "50",
                    opacity: "1",
                    borderRadius: "4px",
                });
            }else{
                decorationType = vscode.window.createTextEditorDecorationType({
                    gutterIconSize: "14px",
                    gutterIconPath: path.join(this.context.extensionPath, "images/mark.png"),
                });                
            }


            const range = new vscode.Range(textEditor.document.positionAt(mk.startOffsetMark),
                textEditor.document.positionAt(mk.endOffsetMark));

            if (mk.mdata?.decorationType) {
                mk.mdata.decorationType.dispose();
            }

            mk.mdata?.setDecorationType(decorationType);
            if (vscode.workspace.getConfiguration().get('CodeNotes.disableColor') === false) {
                textEditor.setDecorations(decorationType, [range]);
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
        if (mk.startOffsetMark <= docOffset && docOffset <= mk.endOffsetMark) {
            return true;
        }
        return false;
    }

    public async selectWhitch(te: vscode.TextEditor, work: string) {
        //console.log(te);
        let items: vscode.QuickPickItem[] = [];
        this.db?.mkmap.forEach((value, key, map) => {

            
            if (value.filePath === te.document.fileName && value.flag === mark.Mark.FLAG_DEFAULT) {
                if (MarkManager.checkPoint(te.document, value, te.selection.anchor) === true) {
                    //console.log(value);
                    items.push(this.getQuickPickItem(value));
                }
            }else if (value.filePath === te.document.fileName && value.flag === mark.Mark.FLAG_LINE) {
                if (MarkManager.checkLine(te.selection.start.line, value) === true) {
                    //console.log(value);
                    items.push(this.getQuickPickItem(value));
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
                if (isShow == false)
                    return undefined;
                else
                    return new vscode.Hover(contents);

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

