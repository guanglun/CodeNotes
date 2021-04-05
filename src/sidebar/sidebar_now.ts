import * as vscode from 'vscode';
import * as mark  from './../mark';
import * as database from './../database';
import * as sidebar from './sidebar';

import { CONNREFUSED } from 'node:dns';



//树的内容组织管理
export class EntryList implements vscode.TreeDataProvider<sidebar.EntryItem>
{

    // private childs: Array < sidebar.EntryItem > =[
    //     new sidebar.EntryItem("1",vscode.TreeItemCollapsibleState.None),
    //     new sidebar.EntryItem("2",vscode.TreeItemCollapsibleState.None),
    //     new sidebar.EntryItem("3",vscode.TreeItemCollapsibleState.None),
    // ];

    private db: database.database | undefined;

    private _onDidChangeTreeData: vscode.EventEmitter<sidebar.EntryItem | undefined | null | void> = new vscode.EventEmitter<sidebar.EntryItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<sidebar.EntryItem | undefined | null | void> = this._onDidChangeTreeData.event;

    public init(db: database.database) {
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
                if(value.mdata?.eitem_all)
                    item.push(value.mdata.eitem_all);
            });
            return item;
        // } 
        // else { //根节点
        //     return [new sidebar.EntryItem("root",vscode.TreeItemCollapsibleState.Collapsed)];
        // }
    }

    refresh(){
        this._onDidChangeTreeData.fire();
    }


    insert(mk: mark.mark){
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
}
