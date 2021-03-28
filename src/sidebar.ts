import * as vscode from 'vscode';
import * as mark  from './mark';

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

    private childs: EntryItem[] = [];
    private eimap: Map<number, EntryItem> = new Map<number, EntryItem>();

    private _onDidChangeTreeData: vscode.EventEmitter<EntryItem | undefined | null | void> = new vscode.EventEmitter<EntryItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<EntryItem | undefined | null | void> = this._onDidChangeTreeData.event;

    getTreeItem(element: EntryItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }
    getChildren(element?: EntryItem): vscode.ProviderResult<EntryItem[]> {
        //if (element) {//子节点
            const item: EntryItem[] = [];
            this.eimap.forEach((value, key, map)=>
            {
                item.push(value);
            });
            return item;
        // } 
        // else { //根节点
        //     return [new EntryItem("root",vscode.TreeItemCollapsibleState.Collapsed)];
        // }
    }
    refresh(): void {
        console.log('refresh...');
        this._onDidChangeTreeData.fire();
      }


    insert(mk: mark.mark){
        if(mk.name)
        {
            const entryItem = new EntryItem(mk.name,vscode.TreeItemCollapsibleState.None);
        
            entryItem.command = {command:"sidebar_test_id1.openChild", 
            title:"title",
            arguments:[mk.id] 
            };
            this.eimap.set(mk.id,entryItem);
        }
    }

    delete(id:number)
    {
        this.eimap.delete(id);
    }

}
