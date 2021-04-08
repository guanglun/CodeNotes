import * as vscode from 'vscode';
import * as Sidebar from './sidebar/Sidebar';
import * as database from './DataBase';
import * as mark from './mark';
import * as path from 'path';
import { Position } from 'vscode';
import { mkdir } from 'node:fs';


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

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public init(sidebar: Sidebar.Sidebar, db: database.DataBase) {
        this.sidebar = sidebar;
        this.db = db;
    }

    public static pathRelativeToAbsolute(rPath:string)
    {
        if(vscode.workspace.workspaceFolders)
        {
            const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            console.log(workspacePath);
            return path.join(workspacePath,rPath);
        }
        return undefined;
    }

    public static pathAbsoluteToRelative(aPath:string)
    {
        if(vscode.workspace.workspaceFolders)
        {
            const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            console.log(workspacePath);
            const sp = aPath.split(workspacePath);
            if(sp[1])
            {
                return sp[1];
            }
        }
        return undefined;
    }

    public insert(te: vscode.TextEditor) {
        if (this.db && this.sidebar) {

            const name = "[" + path.basename(te.document.fileName) + "] " + te.selection.active.line + "-" +
                te.selection.anchor.character;

            //console.log("Path: "+ te.document.fileName);
            //console.log("Work: "+ vscode.workspace.name);
            const rPath = MarkManager.pathAbsoluteToRelative(te.document.fileName);
            //console.log(rPath);

            const mk = new mark.Mark(++this.db.lastId,
                name,
                0,
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

            this.db.insertDB(mk);
            this.sidebar.elAll?.insert(mk);
            this.sidebar.elAll?.refresh();

            if (vscode.window.activeTextEditor?.document.fileName === mk.filePath) {
                this.teColorManager(TEColorManagerType.tecmtShow, mk);
            }

            if (vscode.window.activeTextEditor?.document.fileName === mk.filePath) {
                this.sidebar.elNow?.insert(mk);
                this.sidebar.elNow?.refresh();
            }
            this.sidebar.smark?.updateMarkEdit(mk);
        }
    }

    public delete(id: number) {
        if (this.db && this.sidebar) {
            const mk = this.db.mkmap.get(id);
            this.teColorManager(TEColorManagerType.tecmtClear, mk);
            this.db.deleteDB(id);
            this.db.mkmap.delete(id);
            this.sidebar.elNow.refresh();
            this.sidebar.elAll.refresh();
        }
    }

    private renameItemPromise() {
        return new Promise((resolve, reject) => {
            vscode.window.showInputBox(
                { // 这个对象中所有参数都是可选参数
                    password: false, 			// 输入内容是否是密码
                    ignoreFocusOut: true, 		// 默认false，设置为true时鼠标点击别的地方输入框不会消失
                    placeHolder: 'Rename Item', 	// 在输入框内的提示信息
                    prompt: 'Rename Item', 		// 在输入框下方的提示信息
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
        const promise = this.renameItemPromise();
        promise.then((res: any) => {
            this.setName(id,res);
        });
    }

    public setName(id:number,name:string)
    {
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

    public setDescription(id:number,description:string)
    {
        const mk = this.db?.mkmap.get(id);
        if (mk) {

            mk.description = description;

            this.db?.updateDescription(id, description);
        }
    }

    public editItem(id: number) {

        const mk = this.db?.mkmap.get(id);
        if (mk) {
            console.log(mk.textEditor);
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

    public reloadAllDocColor()
    {
        this.db?.mkmap.forEach((mk, key, map) => {
            this.teColorManager(TEColorManagerType.tecmtShow,mk);
        });

    }

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

    public async showColor(textEditor: vscode.TextEditor, mk: mark.Mark, en: ShowColorType) {

        if(mk.isOffsetInit === false)
        {
            mk.isOffsetInit = true;
            mk.startOffsetMark = textEditor.document.offsetAt(new Position(mk.startLine, mk.startCharacter));
            mk.endOffsetMark = textEditor.document.offsetAt(new Position(mk.endLine, mk.endCharacter));
        }

        if (en === ShowColorType.sctClick) {
            // textEditor.selection = new vscode.Selection(new Position(mk.startLine, mk.startCharacter),
            //     new Position(mk.endLine, mk.endCharacter));

            //if(await textEditor.document.save() === true)
            {

                // mk.startOffsetMark = textEditor.document.offsetAt(new Position(mk.startLine,mk.startCharacter));
                // mk.endOffsetMark = textEditor.document.offsetAt(new Position(mk.endLine,mk.endCharacter));

                textEditor.selection = new vscode.Selection(textEditor.document.positionAt(mk.startOffsetMark),
                    textEditor.document.positionAt(mk.endOffsetMark));
            }


            textEditor.revealRange(new vscode.Range(textEditor.document.positionAt(mk.startOffsetMark),
                textEditor.document.positionAt(mk.endOffsetMark)));

            // textEditor.revealRange(new vscode.Range(new Position(mk.startLine, mk.startCharacter),
            //     new Position(mk.endLine, mk.endCharacter)), vscode.TextEditorRevealType.InCenter);
        }

        if (en === ShowColorType.sctShow) {
            // let editorConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('editor');
            // let fontSize = editorConfig.get<number>('fontSize');
            let color;
            if(mk.color)
            {
                color = mk.color;
            }else{
                color = "#FF0000";
            }

            const decorationType = vscode.window.createTextEditorDecorationType({
                gutterIconSize: "14px",
                gutterIconPath: "C:\\Users\\27207\\hello-code\\images\\icon.png",
                backgroundColor: color+"50",
                opacity: "1",
                borderRadius: "4px",
                //border: "solid blue",
                //     before: { 
                //         // contentIconPath: "C:\\Users\\27207\\hello-code\\images\\draft-fill.svg",
                //         // width:"1em",
                //         // height:"1em",
                //         contentText:"✎",
                //         color:"#FF00FF",
                //         backgroundColor:"red transparent",
                //         //fontStyle:"italic",
                //         //border: "solid red",

                //         //margin: '0px 10px 0px 10px'
                // }
            });

            const range = new vscode.Range(textEditor.document.positionAt(mk.startOffsetMark),
            textEditor.document.positionAt(mk.endOffsetMark));

            if(mk.mdata?.decorationType)
            {
                mk.mdata.decorationType.dispose();
            }

            mk.mdata?.setDecorationType(decorationType);
            if(vscode.workspace.getConfiguration().get('CodeNotes.enableColor') === true)
            {
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

    public static checkPoint(doc:vscode.TextDocument,mk: mark.Mark, p: Position): boolean {
        const docOffset = doc.offsetAt(p);
        if(mk.startOffsetMark <= docOffset && docOffset <= mk.endOffsetMark)
        {
            return true;
        }
        return false;
    }

    public getHoverProvider(db: database.DataBase) {
        return vscode.languages.registerHoverProvider('*', {
            provideHover(document, position, token) {

                const fileName = document.fileName;
                const workDir = path.dirname(fileName);
                const word = document.getText(document.getWordRangeAtPosition(position));

                //![123](../images/icon.png)   \r\n
                //let noteHead        = '#### CodeNotes   \r\n';
                let note = "";


                db?.mkmap.forEach((value, key, map) => {
                    if (value.filePath === fileName) {
                        if (MarkManager.checkPoint(document,value, position) === true) {
                            note += "### " + value.name + "    \r\n";
                            // if(value.description.length > 0)
                            // {
                                note += value.description + "    \r\n\r\n---    \r\n";
                            // }else{
                            //     note += "    \r\n---    \r\n";
                            // }
                            
                        }

                    }
                });

                // console.log(1, noteHead)
                // console.log(2, position)
                // console.log(3, token)
                // console.log(4, '这个就是悬停的文字', word);

                if ("" === note) {
                    return undefined;
                } else {
                    return new vscode.Hover(note);
                }
            }
        }
        );
    }

    public onChnageDoc(mk: mark.Mark, cc: vscode.TextDocumentContentChangeEvent, doc: vscode.TextDocumentChangeEvent) {

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

                if((cc.rangeOffset + cc.text.length) < mk.endOffsetMark)
                {
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

    public setColor(id:number,color:string)
    {
        const mk = this.db?.mkmap.get(id);
        if(mk)
        {
            mk.color = color;
            //console.log("set color " + color);
            vscode.window.visibleTextEditors.forEach(editor => {
                if (editor && mk) {
                    if (mk.filePath === editor.document.fileName) {
                        this.showColor(editor, mk, ShowColorType.sctShow);
                    }
                }
            });

            this.db?.updateColor(mk.id,color);
        }
    }
}

