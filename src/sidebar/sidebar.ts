import * as vscode from 'vscode';
import * as sidebar_all from './sidebar_all';
import * as sidebar_now from './sidebar_now';

export class sidebar {

    public el_all: sidebar_all.EntryList = new sidebar_all.EntryList();
    public el_now: sidebar_now.EntryList = new sidebar_now.EntryList();



    constructor() {

    }
}

// 树节点
export class EntryItem extends vscode.TreeItem {
}
