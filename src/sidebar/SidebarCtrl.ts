import * as vscode from 'vscode';
import * as mark  from '../mark';
import * as database from '../DataBase';
import * as sidebar from './Sidebar';

export enum CtrlType {
    ctrlInit,
}

export class EntryList implements vscode.TreeDataProvider<sidebar.EntryItem>
{

    private childs: Array < sidebar.EntryItem > =[
        new sidebar.EntryItem("init",vscode.TreeItemCollapsibleState.None),
        //new sidebar.EntryItem("2",vscode.TreeItemCollapsibleState.None),
        //new sidebar.EntryItem("3",vscode.TreeItemCollapsibleState.None),
    ];

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
            this.childs[0].command = {command:"sidebar_marks_ctrl.openChild", 
            title:"codenotes",
            arguments:[CtrlType.ctrlInit]
            };
            return this.childs;
        // } 
        // else { //根节点
        //     return [new sidebar.EntryItem("root",vscode.TreeItemCollapsibleState.Collapsed)];
        // }
    }

    public refresh(){
        this._onDidChangeTreeData.fire();
    }

}
