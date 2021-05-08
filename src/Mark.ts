import * as vscode from 'vscode';
import { MarkManager } from './MarkManager';
import * as sidebar from './sidebar/Sidebar';

export class Mark {

    public static flagStr:string[] = ["DEFALUT","LINE","FUNCTION"];
    public static FLAG_DEFAULT      = 0;
    public static FLAG_LINE         = 1;
    public static FLAG_FUNCTION     = 2;

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

    public newRange: vscode.Range | undefined;

    public mdata = new Mdata();

    public textEditor: vscode.TextEditor | undefined;

    public isOffsetInit = false;
    public startOffsetMark: number = 0;
    public endOffsetMark: number = 0;

    public color: string = "#FF0000";
    public relativePath: string | undefined;
    public jumpLink: string = "";
    public description: string = "";

    constructor(id?: number, name?: string, flag?: number, relativePath?: string,
        anchorLine?: number, anchorCharacter?: number, activeLine?: number, activeCharacter?: number,
        startLine?: number, startCharacter?: number, endLine?: number, endCharacter?: number,color?:string,jumpLink?:string,description?:string) {

        if (id) { this.id = id; }
        if (name) { this.name = name; }
        if (flag) { this.flag = flag; }
        if (relativePath) { 
            this.relativePath = relativePath; 
            this.filePath = MarkManager.pathRelativeToAbsolute(relativePath);
        }
        if (anchorLine) { this.anchorLine = anchorLine; }
        if (anchorCharacter) { this.anchorCharacter = anchorCharacter; }
        if (activeLine) { this.activeLine = activeLine; }
        if (activeCharacter) { this.activeCharacter = activeCharacter; }


        if (startLine) {
            this.startLine = startLine;
        }
        if (startCharacter) {
            this.startCharacter = startCharacter;
        }
        if (endLine) {
            this.endLine = endLine;
        }
        if (endCharacter) {
            this.endCharacter = endCharacter;
        }
        if (color) {
            this.color = color;
        }
        if (jumpLink) {

            this.jumpLink = jumpLink;
            var obj;
            try{
                this.mdata.jb = JSON.parse(jumpLink);
            }catch{}
        }        
        if (description) {
            this.description = description;
        }
    }

    public setName(name: string) {
        this.name = name;
    }

    public setTextEditor(textEditor: vscode.TextEditor) {
        this.textEditor = textEditor;
    }

    public writeRange(doc: vscode.TextDocument)
    {
        const startP = doc.positionAt(this.startOffsetMark);
        const endP = doc.positionAt(this.endOffsetMark);

        this.startLine = startP.line;
        this.startCharacter = startP.character;
        this.endLine = endP.line;
        this.endCharacter = endP.character;
    }
}

export class Mdata {

    public decorationType: vscode.TextEditorDecorationType | undefined;

    public eitemAll: sidebar.EntryItem | undefined;
    public eitemNow: sidebar.EntryItem | undefined;

    public eitemMark: sidebar.EntryItem | undefined;
    public eitemLine: sidebar.EntryItem | undefined;
    public eitemFunction: sidebar.EntryItem | undefined;

    public eitemNowMark: sidebar.EntryItem | undefined;
    public eitemNowLine: sidebar.EntryItem | undefined;
    public eitemNowFunction: sidebar.EntryItem | undefined;

    public jb:JumpLink[] = [];

    public setEntryItemAll(el: sidebar.EntryItem) {
        this.eitemAll = el;
    }
    public setEntryItemAllEach(mk:Mark,el: sidebar.EntryItem){
        if(mk.flag === Mark.FLAG_DEFAULT)
        {
            this.eitemMark = el;
        }else if(mk.flag === Mark.FLAG_LINE)
        {
            this.eitemLine = el;
        }else if(mk.flag === Mark.FLAG_FUNCTION)
        {
            this.eitemFunction = el;
        }
    }

    public setEntryItemNowEach(mk:Mark,el: sidebar.EntryItem){
        if(mk.flag === Mark.FLAG_DEFAULT)
        {
            this.eitemNowMark = el;
        }else if(mk.flag === Mark.FLAG_LINE)
        {
            this.eitemNowLine = el;
        }else if(mk.flag === Mark.FLAG_FUNCTION)
        {
            this.eitemNowFunction = el;
        }
    }

    public setEntryItemNow(el: sidebar.EntryItem) {
        this.eitemNow = el;
    }

    public setDecorationType(dt: vscode.TextEditorDecorationType) {
        this.decorationType = dt;
    }
}

export class JumpLink {
    public name: string = "";
    public id: number = 0;

    constructor(name?: string, id?: number)
    {
        if(name)
            this.name = name;

        if(id)
            this.id = id;
    }
}