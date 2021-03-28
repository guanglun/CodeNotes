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
    private sidebarView: sidebar.EntryList;
    private db: database.database;

    constructor(context: vscode.ExtensionContext,sidebarView: sidebar.EntryList,db: database.database) {
        this.context = context;
        this.sidebarView = sidebarView;
        this.db = db;

        console.log(this.context.storageUri);
        this.context.secrets.delete(this.value);
        //this.context.workspaceState.update(this.value);
        this.marks = <MMark[]>this.context.workspaceState.get(this.value);
        this.dump();

    }
    
    public insert(textEditor: vscode.TextEditor)
    {
        const name = "[M]" + textEditor.document.getText(textEditor.selection);
        this.db.insertDB(new mark.mark(0,name));
        const entryItem = this.sidebarView.insert(name);
        this.sidebarView.refresh();

    }
    
    public load(){

        if(this.marks.length > 0)
        {
            console.log('load...');
            for(let i=0;i<this.marks.length;i++)
            {
                console.log(this.marks[i]);
                //this.marks[i].entryItem = 
                this.sidebarView.insert(this.marks[i].textEditor.document.fileName);
                
            }
        }
        this.sidebarView.refresh();

    }

    private save() {
        this.context.workspaceState.update(this.value,this.marks);
    }

    public match(textEditor?: vscode.TextEditor,entryItem?: sidebar.EntryItem):MMark | undefined{

        console.log('match1...');
		if(this.marks.length > 0)
        {
            if(textEditor === undefined && entryItem !== undefined)
            {
                console.log('match2...');
                for(let i=0;i<this.marks.length;i++){
                    console.log('match3...');
                    if(entryItem === this.marks[i].entryItem)
                    {
                        console.log('match4...');
                        return this.marks[i];
                    }
                }
            }else if(textEditor !== undefined && entryItem === undefined)
            {
                for(let i=0;i<this.marks.length;i++){
                    if(textEditor === this.marks[i].textEditor)
                    {
                        return this.marks[i];
                    }
                }
            }else if(textEditor !== undefined && entryItem !== undefined)
            {
                for(let i=0;i<this.marks.length;i++){
                    if(textEditor === this.marks[i].textEditor && entryItem === this.marks[i].entryItem)
                    {
                        return this.marks[i];
                    }
                }
            }

        }

    }

    
    private dump() {
        
        console.log(this.marks);
    }
}
