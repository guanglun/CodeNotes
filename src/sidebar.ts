import * as vscode from 'vscode';

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

    private _onDidChangeTreeData: vscode.EventEmitter<EntryItem | undefined | null | void> = new vscode.EventEmitter<EntryItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<EntryItem | undefined | null | void> = this._onDidChangeTreeData.event;

    getTreeItem(element: EntryItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }
    getChildren(element?: EntryItem): vscode.ProviderResult<EntryItem[]> {
        //if (element) {//子节点
        // if(this.childs.length > 0)
        //     for (let index = 0; index < this.childs.length; index++) {
        //         let str = index.toString();
        //         this.childs[index].command = {command:"sidebar_test_id1.openChild", //命令id
        //                         title:"标题",
        //                         arguments:[this.childs[index]] //命令接收的参数
		// 						};
        //     }            
        //     console.log('getChildren...');
            return this.childs;
        // } 
        // else { //根节点
        //     return [new EntryItem("root",vscode.TreeItemCollapsibleState.Collapsed)];
        // }
    }
    refresh(): void {
        console.log('refresh...');
        this._onDidChangeTreeData.fire();
      }


    insert(name: string){
        console.log('insert...' + name);
        const entryItem = new EntryItem(name,vscode.TreeItemCollapsibleState.None);
        
        entryItem.command = {command:"sidebar_test_id1.openChild", //命令id
        title:"title",
        arguments:[entryItem] //命令接收的参数
        };

        this.childs.push(entryItem);

        return entryItem;
    }
}
