import * as vscode from 'vscode';

// 树节点
export class EntryItem extends vscode.TreeItem
{
}

//树的内容组织管理
export class EntryList implements vscode.TreeDataProvider<EntryItem>
{
    onDidChangeTreeData?: vscode.Event<void | EntryItem | null | undefined> | undefined;
    getTreeItem(element: EntryItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }
    getChildren(element?: EntryItem): vscode.ProviderResult<EntryItem[]> {
        if (element) {//子节点
            var childs = [];
            for (let index = 0; index < 3; index++) {
                let str = index.toString();
                var item = new EntryItem(str,vscode.TreeItemCollapsibleState.None);
                item.command = {command:"sidebar_test_id1.openChild", //命令id
                                title:"标题",
                                arguments:[str] //命令接收的参数
								};
                childs[index] = item;
            }
            return childs;
        } else { //根节点
            return [new EntryItem("root",vscode.TreeItemCollapsibleState.Collapsed)];
        }
    }
}
