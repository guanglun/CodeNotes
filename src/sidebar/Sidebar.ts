import * as vscode from 'vscode';
import * as SidebarAll from './SidebarAll';
import * as SidebarNow from './SidebarNow';
import * as SidebarCtrl from './SidebarCtrl';
import * as SidebarWeb from './SidebarWeb';
import * as SidebarMark from './SidebarMark';
import { Mark } from '../Mark';
import * as path from 'path';

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

    public static setIcon(mk:Mark,ei:EntryItem)
    {
        if(mk.flag === Mark.FLAG_DEFAULT)
        {
            ei.iconPath = {
                light: path.join(__filename, '..', '..', '..', 'images', 'price-tag-3-line.png'),
                dark: path.join(__filename, '..','..', '..', 'images', 'price-tag-3-line.png')
              };
        }else if(mk.flag === Mark.FLAG_LINE)
        {
            ei.iconPath = {
                light: path.join(__filename, '..', '..', '..', 'images', 'code-line.png'),
                dark: path.join(__filename, '..','..', '..', 'images', 'code-line.png')
              };
        }else if(mk.flag === Mark.FLAG_FUNCTION)
        {
            ei.iconPath = {
                light: path.join(__filename, '..', '..', '..', 'images', 'functions.png'),
                dark: path.join(__filename, '..','..', '..', 'images', 'functions.png')
              };
        }
    }
}

// 树节点
export class EntryItem extends vscode.TreeItem {
    // constructor(
    //     public readonly label: string,
    //     public collapsibleState: vscode.TreeItemCollapsibleState,
    //     public readonly iconPath = {
    //         light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'dependency.svg'),
    //         dark: path.join(__filename, '..','..', '..', 'resources', 'dark', 'dependency.svg')
    //     }
    // ) {
    //     super(label, collapsibleState);
    // }

}

