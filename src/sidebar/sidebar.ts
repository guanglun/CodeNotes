import * as vscode from 'vscode';
import * as SidebarAll from './SidebarAll';
import * as SidebarNow from './SidebarNow';
import * as SidebarCtrl from './SidebarCtrl';
import * as SidebarWeb from './SidebarWeb';

export class Sidebar {

    public elAll: SidebarAll.EntryList = new SidebarAll.EntryList();
    public elNow: SidebarNow.EntryList = new SidebarNow.EntryList();
    //public elCtrl: SidebarCtrl.EntryList = new SidebarCtrl.EntryList();
    public sweb: SidebarWeb.SidebarWeb | undefined ;

    constructor() {

    }

    public setSWeb(sweb: SidebarWeb.SidebarWeb)
    {
        this.sweb = sweb;
    }
}

// 树节点
export class EntryItem extends vscode.TreeItem {

}
