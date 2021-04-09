import * as vscode from 'vscode';
import * as mark  from '../Mark';
import * as database from '../DataBase';
import * as sidebar from './Sidebar';

export class EntryList implements vscode.TreeDataProvider<sidebar.EntryItem>
{

    // private childs: Array < sidebar.EntryItem > =[
    //     new sidebar.EntryItem("1",vscode.TreeItemCollapsibleState.None),
    //     new sidebar.EntryItem("2",vscode.TreeItemCollapsibleState.None),
    //     new sidebar.EntryItem("3",vscode.TreeItemCollapsibleState.None),
    // ];

    private db: database.DataBase | undefined;

    private _onDidChangeTreeData: vscode.EventEmitter<sidebar.EntryItem | undefined | null | void> = new vscode.EventEmitter<sidebar.EntryItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<sidebar.EntryItem | undefined | null | void> = this._onDidChangeTreeData.event;

    public init(db: database.DataBase) {
        this.db = db;
    }

    getTreeItem(element: sidebar.EntryItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: sidebar.EntryItem): vscode.ProviderResult<sidebar.EntryItem[]> {
        //if (element) {
            const item: sidebar.EntryItem[] = [];
            this.db?.mkmap.forEach((value, key, map)=>
            {
                if(value.mdata?.eitemAll)
                {
                    item.push(value.mdata.eitemAll);
                }
            });
            return item;
        // } 
        // else { //根节点
        //     return [new sidebar.EntryItem("root",vscode.TreeItemCollapsibleState.Collapsed)];
        // }
    }

    public refresh(){
        this._onDidChangeTreeData.fire();
    }


    public insert(mk: mark.Mark){
        if(mk.name)
        {
            const entryItem = new sidebar.EntryItem(mk.name,vscode.TreeItemCollapsibleState.None);
        
            entryItem.command = {command:"sidebar_marks_all.openChild", 
            title:"codenotes",
            arguments:[mk.id] 
            };

            mk.mdata?.setEntryItemAll(entryItem);
        }
    }

    public reloadItemName(mk: mark.Mark)
    {        
        if(mk.name)
        {
            if(mk.mdata.eitemAll)
            {
                delete mk.mdata.eitemAll;
            }
            this.insert(mk);
        }
    }
}
