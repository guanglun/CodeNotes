import * as vscode from 'vscode';
import * as sidebar from './sidebar/Sidebar';

export class Mark {

    public id: number = 0;
    public name: string | undefined;
    public flag: number = 0;

    public filePath: string | undefined;
    public anchorLine: number = 0;
    public anchorCharacter: number = 0;
    public activeLine: number = 0;
    public activeCharacter: number = 0;

    public startLine: number = 0;
    public startCharacter: number = 0;
    public endLine: number = 0;
    public endCharacter: number = 0;

    public mdata = new Mdata();

    constructor(id?: number, name?: string, flag?: number, filePath?: string, 
        anchorLine?: number, anchorCharacter?: number, activeLine?: number, activeCharacter?: number,
        startLine?: number, startCharacter?: number, endLine?: number, endCharacter?: number) {

        if (id)
            {this.id = id;}
        if (name)
            {this.name = name;}
        if (flag)
            {this.flag = flag;}
        if (filePath)
            {this.filePath = filePath;}
        if (anchorLine)
            {this.anchorLine = anchorLine;}
        if (anchorCharacter)
            {this.anchorCharacter = anchorCharacter;}
        if (activeLine)
            {this.activeLine = activeLine;}
        if (activeCharacter)
            {this.activeCharacter = activeCharacter;}
        if (startLine)
            {this.startLine = startLine;}
        if (startCharacter)
            {this.startCharacter = startCharacter;}
        if (endLine)
            {this.endLine = endLine;}
        if (endCharacter)
            {this.endCharacter = endCharacter;}            
        
    }

    public setName(name: string)
    {
        this.name = name;
    }
}

export class Mdata {

    public decorationType: vscode.TextEditorDecorationType | undefined;

    public eitemAll: sidebar.EntryItem | undefined;
    public eitemNow: sidebar.EntryItem | undefined;

    public setEntryItemAll(el: sidebar.EntryItem)
    {
        this.eitemAll = el;
    }

    public setEntryItemNow(el: sidebar.EntryItem)
    {
        this.eitemNow = el;
    }

    public setDecorationType(dt:vscode.TextEditorDecorationType)
    {
        this.decorationType = dt;
    }

}