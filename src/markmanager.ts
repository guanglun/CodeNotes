import * as vscode from 'vscode';
import * as sidebar from './sidebar';
import * as database from './database';
import * as mark  from './mark';

export class MMark {
    public textEditor: vscode.TextEditor;
    public entryItem: sidebar.EntryItem;

    constructor(textEditor: vscode.TextEditor,entryItem: sidebar.EntryItem) {
        this.textEditor = textEditor;
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

    public insert(textEditor: vscode.TextEditor)
    {
        if(this.db && this.el)
        {
            const name = "[M]" + textEditor.document.getText(textEditor.selection);
            const mk = new mark.mark(++this.db.lastId,name);
    
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
}
