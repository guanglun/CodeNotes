import * as vscode from 'vscode';
import * as sidebar from './sidebar';
import * as database from './database';
import * as mark  from './mark';
import * as path  from 'path';
import { Position } from 'vscode';

export class MMark {
    public te: vscode.TextEditor;
    public entryItem: sidebar.EntryItem;

    constructor(te: vscode.TextEditor,entryItem: sidebar.EntryItem) {
        this.te = te;
        this.entryItem = entryItem;
    }
}

export class markmanager{
    private value = "Marks";
    private maps: Map<string, any>[] = []; 
    public marks: MMark[]=[];
    //private maps = new Map([[string,"22"]]);
    //private maps: Array<Map>[];
    private context: vscode.ExtensionContext;
    private el: sidebar.EntryList | undefined;
    private db: database.database | undefined;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }
    
    public init(el: sidebar.EntryList,db: database.database)
    {
        this.el = el;
        this.db = db;
    }

    public insert(te: vscode.TextEditor)
    {
        if(this.db && this.el)
        {
            
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
        }

    }
    
    public delete(id: number)
    {
        if(this.db && this.el)
        {
            this.db.deleteDB(id);
            this.el.delete(id);
            this.el.refresh();
        }
    }

    public load(){
        if(this.db)
        {
            this.db.checkLoadDB();
            this.db.loadDB();
        }
    }

    clamp(n:number, min:number, max:number) {
        if (n < min) {
            return min;
        }
        if (n > max) {
            return max;
        }
        return n;
    }

    safeParseInt(n: any, defaultValue: number) {
        if (typeof n === 'number') {
            return Math.round(n);
        }
        let r = parseInt(n);
        if (isNaN(r)) {
            return defaultValue;
        }
        return r;
    }

    readEditorLineHeight() {
        const MINIMUM_LINE_HEIGHT = 8;
        const MAXIMUM_LINE_HEIGHT = 150;
        const GOLDEN_LINE_HEIGHT_RATIO = (process.platform === 'darwin') ? 1.5 : 1.35;
    
        let editorConfig = vscode.workspace.getConfiguration('editor');
        let fontSize = editorConfig.get<number>('fontSize');

        let configuredLineHeight = editorConfig.get('lineHeight');
    
        let lineHeight = this.safeParseInt(configuredLineHeight, 0);
        lineHeight = this.clamp(lineHeight, 0, MAXIMUM_LINE_HEIGHT);
        if (lineHeight === 0 && fontSize) {
            lineHeight = Math.round(GOLDEN_LINE_HEIGHT_RATIO * fontSize);
        } else if (lineHeight < MINIMUM_LINE_HEIGHT) {
            lineHeight = MINIMUM_LINE_HEIGHT;
        }
        return lineHeight;
    }

    //文件插入内容请看:http://www.voidcn.com/article/p-kyntjbrl-bvo.html
    public click(id:number)
    {
        if(this.db && this.el)
        {
            const mk = this.db.mkmap.get(id);
            if(mk)
            {

                    if(mk.file_path)
                    {

                        const uri = vscode.Uri.file(mk.file_path);
                        vscode.workspace.openTextDocument(uri).then(document => {
                            vscode.window.showTextDocument(document).then(textEditor =>{
                                textEditor.selection = new vscode.Selection(new Position(mk.anchor_line,mk.anchor_character),
                                new Position(mk.active_line,mk.active_character));
                                textEditor.revealRange(new vscode.Range(new Position(mk.start_line,mk.start_character),
                                new Position(mk.end_line,mk.end_character)));



                                let editorConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('editor');
                                let fontSize = editorConfig.get<number>('fontSize');
                                
                                console.log(this.readEditorLineHeight());
                                const hight = this.readEditorLineHeight();
                                let decorationType = vscode.window.createTextEditorDecorationType({
                                    //outlineColor: '#fff'
                                    //backgroundColor: '#fff'
                                    //border: '1px solid red;'
                                    gutterIconSize:"18px",
                                    gutterIconPath: "C:\\Users\\27207\\hello-code\\images\\icon.png",
                                    before: { 
                                        // contentIconPath: "C:\\Users\\27207\\hello-code\\images\\draft-fill.svg",
                                        // width:"1em",
                                        // height:"1em",
                                        contentText:"✎",
                                        color:"#FF00FF",
                                        //backgroundColor:"#00FFFF",
                                        //fontStyle:"italic",
                                        //border: "solid red",
                           
                                        //margin: '0px 10px 0px 10px'
                                }
                                });

                                textEditor.setDecorations(decorationType, [new vscode.Range(new Position(mk.start_line,mk.start_character),
                                    new Position(mk.end_line,mk.end_character))]);
                                
                            });
                        });
                    }

                
            }
        }
    }
}
