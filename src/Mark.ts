import * as vscode from 'vscode';
import * as sidebar from './sidebar';


export class MMark {
    public textEditor: vscode.TextEditor;
    public entryItem: sidebar.EntryItem;

    constructor(textEditor: vscode.TextEditor,entryItem: sidebar.EntryItem) {
        this.textEditor = textEditor;
        this.entryItem = entryItem;
    }
}

export class Mark{
    private value = "Marks";
    private maps: Map<string, any>[] = []; 
    public marks: MMark[]=[];
    //private maps = new Map([[string,"22"]]);
    //private maps: Array<Map>[];
    private context: vscode.ExtensionContext;
    private sidebarView: sidebar.EntryList;
    
    constructor(context: vscode.ExtensionContext,sidebarView: sidebar.EntryList) {
        this.context = context;
        this.sidebarView = sidebarView;

        console.log(this.context.storageUri);
        this.context.secrets.delete(this.value);
        //this.context.workspaceState.update(this.value);
        this.marks = <MMark[]>this.context.workspaceState.get(this.value);
        this.dump();

        const json = "{'1':'a'}";
        

        const jsonStr = JSON.parse(json);
        console.log(jsonStr);

    }
    
    public insert(textEditor: vscode.TextEditor)
    {

        const entryItem = this.sidebarView.insert(textEditor.document.getText(textEditor.selection));
        this.sidebarView.refresh();
        console.log('111...');
        this.marks.push(new MMark(textEditor,entryItem));
        console.log('222...');
        
        this.dump();

        console.log('333...');
        this.save();
        console.log('444...');
        this.dump();
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
