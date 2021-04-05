import * as vscode from 'vscode';
import * as sidebar from './sidebar/sidebar';

export class mark {

    public id: number = 0;
    public name: string | undefined;
    public flag: number = 0;
    public file_path: string | undefined;
    public anchor_line: number = 0;
    public anchor_character: number = 0;
    public active_line: number = 0;
    public active_character: number = 0;

    public start_line: number = 0;
    public start_character: number = 0;
    public end_line: number = 0;
    public end_character: number = 0;

    //public static FLAG_SELECT = 0;
    //public static FLAG_CURSOR = 1;

    public mdata = new mdata();

    constructor(id?: number, name?: string, flag?: number, file_path?: string, 
        anchor_line?: number, anchor_character?: number, active_line?: number, active_character?: number,
        start_line?: number, start_character?: number, end_line?: number, end_character?: number) {

        if (id)
            this.id = id;
        if (name)
            this.name = name;
        if (flag)
            this.flag = flag;
        if (file_path)
            this.file_path = file_path;
        if (anchor_line)
            this.anchor_line = anchor_line;
        if (anchor_character)
            this.anchor_character = anchor_character;
        if (active_line)
            this.active_line = active_line;
        if (active_character)
            this.active_character = active_character;
        if (start_line)
            this.start_line = start_line;
        if (start_character)
            this.start_character = start_character;
        if (end_line)
            this.end_line = end_line;
        if (end_character)
            this.end_character = end_character;            
        
    }
}

export class mdata {

    public decorationType: vscode.TextEditorDecorationType | undefined;

    public eitem_all: sidebar.EntryItem | undefined;
    public eitem_now: sidebar.EntryItem | undefined;

    public setEntryItemAll(el: sidebar.EntryItem)
    {
        this.eitem_all = el;
    }

    public setEntryItemNow(el: sidebar.EntryItem)
    {
        this.eitem_now = el;
    }

    public setDecorationType(dt:vscode.TextEditorDecorationType)
    {
        this.decorationType = dt;
    }

}