import * as vscode from 'vscode';
import * as SidebarAll from './SidebarAll';
import * as SidebarNow from './SidebarNow';

export class Sidebar {

    public elAll: SidebarAll.EntryList = new SidebarAll.EntryList();
    public elNow: SidebarNow.EntryList = new SidebarNow.EntryList();

    constructor() {

    }
}

// 树节点
export class EntryItem extends vscode.TreeItem {

}
