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
            
            const name = "[M]" + path.basename(te.document.fileName) + " " + te.selection.active.line;


            const mk = new mark.mark(++this.db.lastId,
                name,
                0,
                te.document.fileName,
                te.selection.anchor.line,
                te.selection.anchor.character,
                te.selection.active.line,
                te.selection.active.character,
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

                            })
                        });
                    }

                
            }
        }
    }
}
