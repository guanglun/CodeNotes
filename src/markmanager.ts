import * as vscode from 'vscode';
import * as sidebar from './sidebar';
import * as database from './database';
import * as mark  from './mark';
import * as path  from 'path';

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
                mark.mark.FLAG_SELECT,
                te.document.fileName,
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

    public click(id:number)
    {
        if(this.db && this.el)
        {
            const mk = this.db.mkmap.get(id);
            if(mk)
            {
                if(mk.flag === mark.mark.FLAG_SELECT)
                {
                    if(mk.file_path)
                    {
                        console.log("open... "+mk.file_path);
                        const uri = vscode.Uri.file(mk.file_path);
                        vscode.workspace.openTextDocument(uri).then(
                            document => {
                                //document.
                                vscode.window.showTextDocument(document);
                            }
                        )
                    }

                }
            }
        }
    }
}
