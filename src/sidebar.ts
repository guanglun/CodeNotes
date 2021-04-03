import * as vscode from 'vscode';
import * as mark  from './mark';
import * as database from './database';
import { CONNREFUSED } from 'node:dns';

// 树节点
export class EntryItem extends vscode.TreeItem
{
}


//树的内容组织管理
export class EntryList implements vscode.TreeDataProvider<EntryItem>
{

    // private childs: Array < EntryItem > =[
    //     new EntryItem("1",vscode.TreeItemCollapsibleState.None),
    //     new EntryItem("2",vscode.TreeItemCollapsibleState.None),
    //     new EntryItem("3",vscode.TreeItemCollapsibleState.None),
    // ];    

    private db: database.database | undefined;

    private _onDidChangeTreeData: vscode.EventEmitter<EntryItem | undefined | null | void> = new vscode.EventEmitter<EntryItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<EntryItem | undefined | null | void> = this._onDidChangeTreeData.event;

    public init(db: database.database) {
        this.db = db;
    }

    getTreeItem(element: EntryItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: EntryItem): vscode.ProviderResult<EntryItem[]> {
        //if (element) {
            const item: EntryItem[] = [];
            this.db?.mkmap.forEach((value, key, map)=>
            {
                if(value.mdata?.eitem)
                    item.push(value.mdata.eitem);
            });
            return item;
        // } 
        // else { //根节点
        //     return [new EntryItem("root",vscode.TreeItemCollapsibleState.Collapsed)];
        // }
    }

    refresh(){
        this._onDidChangeTreeData.fire();
    }


    insert(mk: mark.mark){
        if(mk.name)
        {
            const entryItem = new EntryItem(mk.name,vscode.TreeItemCollapsibleState.None);
        
            entryItem.command = {command:"sidebar_marks_all.openChild", 
            title:"title",
            arguments:[mk.id] 
            };

            mk.mdata?.setEntryItem(entryItem);
        }
    }
}
