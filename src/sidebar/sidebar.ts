import * as vscode from 'vscode';
import * as SidebarAll from './SidebarAll';
import * as SidebarNow from './SidebarNow';
import * as SidebarCtrl from './SidebarCtrl';
import * as SidebarWeb from './SidebarWeb';
import * as SidebarMark from './Sidebarmark';
export class Sidebar {

    public elAll: SidebarAll.EntryList = new SidebarAll.EntryList();
    public elNow: SidebarNow.EntryList = new SidebarNow.EntryList();
    //public elCtrl: SidebarCtrl.EntryList = new SidebarCtrl.EntryList();

    
    public sweb: SidebarWeb.SidebarWeb | undefined ;
    public smark: SidebarMark.SidebarMark | undefined ;

    constructor() {

    }

    public setSWeb(sweb: SidebarWeb.SidebarWeb)
    {
        this.sweb = sweb;
    }

    public setSMark(smark: SidebarMark.SidebarMark)
    {
        this.smark = smark;
    }

}

// 树节点
export class EntryItem extends vscode.TreeItem {

}
