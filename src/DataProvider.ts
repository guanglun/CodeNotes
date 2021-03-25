import { TreeDataProvider, Event, TreeItem, TreeItemCollapsibleState, ProviderResult } from "vscode";

export class DataProvider implements TreeDataProvider<DataItem> {
    onDidChangeTreeData?: Event<DataItem | null | undefined> | undefined;
    data: DataItem[];

    constructor() {
        this.data = [
            new DataItem('line1', [new DataItem('line1-sub1'), new DataItem('line1-sub2')]),
            new DataItem('line2', [new DataItem('line2-sub1'), new DataItem('line2-sub2')]),
            new DataItem('line3', [new DataItem('line3-sub1'), new DataItem('line3-sub2')])
        ];
    }

    getTreeItem(element: DataItem): TreeItem | Thenable<TreeItem> {
        return element;
    }

    getChildren(element?: DataItem | undefined): ProviderResult<DataItem[]> {
        if (element === undefined) {
            return this.data;
        }
        return element.children;
    }
}


class DataItem extends TreeItem{
    public children: DataItem[] | undefined;

    constructor(label: string, children?: DataItem[] | undefined) {
        super(label, children === undefined ? TreeItemCollapsibleState.None : TreeItemCollapsibleState.Collapsed);
        this.children = children;
    }
}