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
        let item: sidebar.EntryItem[] = [];
        if (element?.label === "Mark") {

            this.db?.mkmap.forEach((value, key, map) => {
                if (value.mdata?.eitemNowMark) {
                    item.push(value.mdata.eitemNowMark);
                }
            });
            return item;
        } else if (element?.label === "Line") {
            this.db?.mkmap.forEach((value, key, map) => {
                if (value.mdata?.eitemNowLine) {
                    item.push(value.mdata.eitemNowLine);
                }
            });
            return item;
        } else if (element?.label === "Function") {

            this.db?.mkmap.forEach((value, key, map) => {
                if (value.mdata?.eitemNowFunction) {
                    item.push(value.mdata.eitemNowFunction);
                }
            });
            return item;
        }
        else { //根节点
            return [new sidebar.EntryItem("Mark", vscode.TreeItemCollapsibleState.Collapsed),
            new sidebar.EntryItem("Line", vscode.TreeItemCollapsibleState.Collapsed),
            new sidebar.EntryItem("Function", vscode.TreeItemCollapsibleState.Collapsed)];
        }
    }

    public refresh(){
        this._onDidChangeTreeData.fire();
    }


    public insert(mk: mark.Mark){
        if(mk.name)
        {
            const entryItem = new sidebar.EntryItem(mk.name,vscode.TreeItemCollapsibleState.None);
            sidebar.Sidebar.setIcon(mk,entryItem);
            entryItem.command = {command:"sidebar_marks_now.openChild", 
            title:"codenotes",
            arguments:[mk.id] 
            };

            mk.mdata?.setEntryItemNowEach(mk,entryItem);
        }
    }

    public reloadItemName(mk: mark.Mark)
    {        
        if(mk.name)
        {
            delete mk.mdata.eitemNow;
            delete mk.mdata.eitemNowMark;
            delete mk.mdata.eitemNowLine;
            delete mk.mdata.eitemNowFunction;
            this.insert(mk);
        }
    }
}
