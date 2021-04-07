import * as vscode from 'vscode';
import * as Sidebar from './sidebar/Sidebar';
import * as database from './DataBase';
import * as mark from './mark';
import * as path from 'path';
import { Position } from 'vscode';


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

    public insert(te: vscode.TextEditor) {
        if (this.db && this.sidebar) {

            const name = "[" + path.basename(te.document.fileName) + "] " + te.selection.active.line + "-" +
                te.selection.anchor.character;

            const mk = new mark.Mark(++this.db.lastId,
                name,
                0,
                te.document.fileName,
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
            const mk = this.db?.mkmap.get(id);
            if (mk) {
                if (mk.filePath) { mk.setName("[" + path.basename(mk.filePath) + "] " + res); }
                else { mk.setName("[-] " + res); }

                this.db?.updateName(id, res);
                this.sidebar?.elNow.reloadItemName(mk);
                this.sidebar?.elAll.reloadItemName(mk);

                this.sidebar?.elNow.refresh();
                this.sidebar?.elAll.refresh();
            }
        });
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

            const decorationType = vscode.window.createTextEditorDecorationType({
                gutterIconSize: "14px",
                gutterIconPath: "C:\\Users\\27207\\hello-code\\images\\icon.png",
                backgroundColor: "#FF000050",
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

            mk.mdata?.setDecorationType(decorationType);

            const range = new vscode.Range(new Position(mk.startLine, mk.startCharacter),
                new Position(mk.endLine, mk.endCharacter));

            textEditor.setDecorations(decorationType, [range]);

            mk.startOffsetMark = textEditor.document.offsetAt(new Position(mk.startLine, mk.startCharacter));
            mk.endOffsetMark = textEditor.document.offsetAt(new Position(mk.endLine, mk.endCharacter));
        }

        if (en === ShowColorType.sctClear) {

            if (mk.mdata?.decorationType) {
                mk.mdata.decorationType.dispose();

                textEditor.setDecorations(mk.mdata.decorationType, [new vscode.Range(new Position(mk.startLine, mk.startCharacter),
                    new Position(mk.endLine, mk.endCharacter))]);
            }
        }
    }

    //文件插入内容请看:http://www.voidcn.com/article/p-kyntjbrl-bvo.html
    public click(id: number) {
        if (this.db && this.sidebar?.elAll) {
            const mk = this.db.mkmap.get(id);
            if (mk) {

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

    public static checkPoint(mk: mark.Mark, p: Position): boolean {
        if (mk.startLine <= p.line && p.line <= mk.endLine) {
            if (mk.startCharacter <= p.character && p.character <= mk.endCharacter) {
                return true;
            } else if (mk.startCharacter >= p.character && p.character >= mk.endCharacter) {
                return true;
            }
        } else if (mk.startLine >= p.line && p.line >= mk.endLine) {
            if (mk.startCharacter <= p.character && p.character <= mk.endCharacter) {
                return true;
            } else if (mk.startCharacter >= p.character && p.character >= mk.endCharacter) {
                return true;
            }
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
                        if (MarkManager.checkPoint(value, position) === true) {
                            note += "* " + value.name + "   \r\n";
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
}

