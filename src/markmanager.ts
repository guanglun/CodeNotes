import * as vscode from 'vscode';
import * as sidebar from './sidebar';
import * as database from './database';
import * as mark from './mark';
import * as path from 'path';
import { Position } from 'vscode';
import { mainModule } from 'node:process';


export enum ShowColorType {
    SCT_CLICK,
    SCT_SHOW,
    SCT_CLEAR
}

export enum TEColorManagerType {
    TECMT_INIT,
    TECMT_SHOW,
    TECMT_CLEAR
}

export class markmanager {


    private context: vscode.ExtensionContext;
    private el: sidebar.EntryList | undefined;
    private db: database.database | undefined;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public init(el:sidebar.EntryList,db: database.database) {
        this.el = el;
        this.db = db;
    }

    public insert(te: vscode.TextEditor) {
        if (this.db && this.el) {

            const name = path.basename(te.document.fileName) + " " + te.selection.active.line;


            const mk = new mark.mark(++this.db.lastId,
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
            this.el.insert(mk);
            this.el.refresh();
            if(vscode.window.activeTextEditor?.document.fileName == mk.file_path)
            {
                this.TEColorManager(TEColorManagerType.TECMT_SHOW,mk);
            }
        }

    }

    public delete(id: number) {
        if (this.db && this.el) {
            const mk = this.db.mkmap.get(id);
            this.TEColorManager(TEColorManagerType.TECMT_CLEAR,mk);
            this.db.deleteDB(id);
            this.db.mkmap.delete(id);
            this.el.refresh();
        }
    }

    public load() {
        if (this.db) {
            this.db.checkLoadDB();
            this.db.loadDB();
        }
    }

    public TEColorManager(type: TEColorManagerType, mk?: mark.mark) {
        if (type === TEColorManagerType.TECMT_INIT) {
            vscode.window.visibleTextEditors.forEach(editor => {
                if (editor && this.db) {
                    this.db.mkmap.forEach((value, key, map) => {
                        if (value.file_path === editor.document.fileName) {

                            this.showColor(editor, value, ShowColorType.SCT_SHOW);
                        }
                    });
                }
            });
        }
        if (type === TEColorManagerType.TECMT_SHOW) {
            vscode.window.visibleTextEditors.forEach(editor => {
                if (editor && mk) {
                    if (mk.file_path === editor.document.fileName) {
                        this.showColor(editor, mk, ShowColorType.SCT_SHOW);
                    }
                }
            });
        }        
        if (type === TEColorManagerType.TECMT_CLEAR) {
            vscode.window.visibleTextEditors.forEach(editor => {
                if (editor && mk) {
                    if (mk.file_path === editor.document.fileName) {
                        this.showColor(editor, mk, ShowColorType.SCT_CLEAR);
                    }
                }
            });
        }
    }

    

    public showColor(textEditor: vscode.TextEditor, mk: mark.mark, en: ShowColorType) {


        if (en === ShowColorType.SCT_CLICK) {
            textEditor.selection = new vscode.Selection(new Position(mk.anchor_line, mk.anchor_character),
                new Position(mk.active_line, mk.active_character));

            textEditor.revealRange(new vscode.Range(new Position(mk.start_line, mk.start_character),
                new Position(mk.end_line, mk.end_character)));
        }


        if (en === ShowColorType.SCT_SHOW) {
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

            textEditor.setDecorations(decorationType, [new vscode.Range(new Position(mk.start_line, mk.start_character),
                new Position(mk.end_line, mk.end_character))]);
        }

        if (en === ShowColorType.SCT_CLEAR) {
            
            if(mk.mdata?.decorationType)
            {
                mk.mdata.decorationType.dispose();

                textEditor.setDecorations(mk.mdata.decorationType, [new vscode.Range(new Position(mk.start_line, mk.start_character),
                    new Position(mk.end_line, mk.end_character))]);
            }
        }
    }

    //文件插入内容请看:http://www.voidcn.com/article/p-kyntjbrl-bvo.html
    public click(id: number) {
        if (this.db && this.el) {
            const mk = this.db.mkmap.get(id);
            if (mk) {

                if (mk.file_path) {

                    const uri = vscode.Uri.file(mk.file_path);
                    vscode.workspace.openTextDocument(uri).then(document => {
                        vscode.window.showTextDocument(document).then(textEditor => {

                            this.showColor(textEditor, mk, ShowColorType.SCT_CLICK);

                        });
                    });
                }
            }
        }
    }

}

