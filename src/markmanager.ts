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

    public init(sidebar: Sidebar.Sidebar,db: database.DataBase) {
        this.sidebar = sidebar;
        this.db = db;
    }

    public insert(te: vscode.TextEditor) {
        if (this.db && this.sidebar) {

            const name = path.basename(te.document.fileName) + " " + te.selection.active.line;

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

            if(vscode.window.activeTextEditor?.document.fileName === mk.filePath)
            {
                this.teColorManager(TEColorManagerType.tecmtShow,mk);
            }

            if(vscode.window.activeTextEditor?.document.fileName === mk.filePath)
            {
                this.sidebar.elNow?.insert(mk);
                this.sidebar.elNow?.refresh();
            }

        }

    }

    public delete(id: number) {
        if (this.db && this.sidebar) {
            const mk = this.db.mkmap.get(id);
            this.teColorManager(TEColorManagerType.tecmtClear,mk);
            this.db.deleteDB(id);
            this.db.mkmap.delete(id);
            this.sidebar.elNow.refresh();
            this.sidebar.elAll.refresh();
        }
    }

    public reloadNowItem()
    {
        if(vscode.window.activeTextEditor)
        {

            this.db?.mkmap.forEach((value, key, map)=>
            {
                delete value.mdata.eitemNow;
                if(value.filePath === vscode.window.activeTextEditor?.document.fileName)
                {
                    this.sidebar?.elNow.insert(value);
                }
            });
            this.sidebar?.elNow.refresh();
        }

    }


    public load() {
        if (this.db) {
            this.db.checkLoadDB();
            this.db.loadDB();
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

    public showColor(textEditor: vscode.TextEditor, mk: mark.Mark, en: ShowColorType) {

        if (en === ShowColorType.sctClick) {
            textEditor.selection = new vscode.Selection(new Position(mk.anchorLine, mk.anchorCharacter),
                new Position(mk.activeLine, mk.activeCharacter));

            textEditor.revealRange(new vscode.Range(new Position(mk.startLine, mk.startCharacter),
                new Position(mk.endLine, mk.endCharacter)));
        }

        if (en === ShowColorType.sctShow) {
            // let editorConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('editor');
            // let fontSize = editorConfig.get<number>('fontSize');

            const decorationType = vscode.window.createTextEditorDecorationType({
                //outlineColor: '#fff'
                //backgroundColor: '#fff'
                //border: '1px solid red;'
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

            textEditor.setDecorations(decorationType, [new vscode.Range(new Position(mk.startLine, mk.startCharacter),
                new Position(mk.endLine, mk.endCharacter))]);
        }

        if (en === ShowColorType.sctClear) {
            
            if(mk.mdata?.decorationType)
            {
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

}

