import * as vscode from 'vscode';

// 树节点
export class EntryItem extends vscode.TreeItem
{
}


//树的内容组织管理
export class EntryList implements vscode.TreeDataProvider<EntryItem>
{

    private childs: Array < EntryItem > =[
        new EntryItem("1",vscode.TreeItemCollapsibleState.None),
        new EntryItem("2",vscode.TreeItemCollapsibleState.None),
        new EntryItem("3",vscode.TreeItemCollapsibleState.None),
];
    
    _onDidChangeTreeData: vscode.EventEmitter<EntryItem> = new vscode.EventEmitter<EntryItem>();
    onDidChangeTreeData: vscode.Event<EntryItem> = this._onDidChangeTreeData.event;

    getTreeItem(element: EntryItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }
    getChildren(element?: EntryItem): vscode.ProviderResult<EntryItem[]> {
        //if (element) {//子节点

            // for (let index = 0; index < 3; index++) {
            //     let str = index.toString();
            //     var item = new EntryItem(str,vscode.TreeItemCollapsibleState.None);
            //     item.command = {command:"sidebar_test_id1.openChild", //命令id
            //                     title:"标题",
            //                     arguments:[item] //命令接收的参数
			// 					};
            //     this.childs[index] = item;
            // }
            for (let index = 0; index < 3; index++) {
                let str = index.toString();
                this.childs[index].command = {command:"sidebar_test_id1.openChild", //命令id
                                title:"标题",
                                arguments:[this.childs[index]] //命令接收的参数
								};
            }            
            console.log('getChildren...');
            return this.childs;
            
        // } 
        // else { //根节点
        //     return [new EntryItem("root",vscode.TreeItemCollapsibleState.Collapsed)];
        // }
    }
    refresh(): void {
        this._onDidChangeTreeData.fire(this.childs[0]);
      }

    refresh2(){
        console.log('dispose...');
        this.childs[0].label="jahaja";
        this.refresh();
    }
}
