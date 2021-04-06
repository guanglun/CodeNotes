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

    public newRange: vscode.Range | undefined;

    public mdata = new Mdata();

    public textEditor: vscode.TextEditor | undefined;

    private startLineDB: number = 0;
    private startCharacterDB: number = 0;
    private endLineDB: number = 0;
    private endCharacterDB: number = 0;

    constructor(id?: number, name?: string, flag?: number, filePath?: string,
        anchorLine?: number, anchorCharacter?: number, activeLine?: number, activeCharacter?: number,
        startLine?: number, startCharacter?: number, endLine?: number, endCharacter?: number) {

        if (id) { this.id = id; }
        if (name) { this.name = name; }
        if (flag) { this.flag = flag; }
        if (filePath) { this.filePath = filePath; }
        if (anchorLine) { this.anchorLine = anchorLine; }
        if (anchorCharacter) { this.anchorCharacter = anchorCharacter; }
        if (activeLine) { this.activeLine = activeLine; }
        if (activeCharacter) { this.activeCharacter = activeCharacter; }


        if (startLine) {
            this.startLine = startLine;
            this.startLineDB = startLine;
        }
        if (startCharacter) {
            this.startCharacter = startCharacter;
            this.startCharacterDB = startCharacter;
        }
        if (endLine) {
            this.endLine = endLine;
            this.endLineDB = endLine;
        }
        if (endCharacter) {
            this.endCharacter = endCharacter;
            this.endCharacterDB = endCharacter;
        }

    }

    public setName(name: string) {
        this.name = name;
    }

    public setTextEditor(textEditor: vscode.TextEditor) {
        this.textEditor = textEditor;
    }

    public resetRange() {
        console.log("######### resetRange");
        this.startLine = this.startLineDB;
        this.startCharacter = this.startCharacterDB;
        this.endLine = this.endLineDB;
        this.endCharacter = this.endCharacterDB;
    }

    public writeRange() {
        console.log("######### writeRange");

        this.startLineDB = this.startLine;
        this.startCharacterDB = this.startCharacter;
        this.endLineDB = this.endLine;
        this.endCharacterDB = this.endCharacter;
    }

}

export class Mdata {

    public decorationType: vscode.TextEditorDecorationType | undefined;

    public eitemAll: sidebar.EntryItem | undefined;
    public eitemNow: sidebar.EntryItem | undefined;

    public setEntryItemAll(el: sidebar.EntryItem) {
        this.eitemAll = el;
    }

    public setEntryItemNow(el: sidebar.EntryItem) {
        this.eitemNow = el;
    }

    public setDecorationType(dt: vscode.TextEditorDecorationType) {
        this.decorationType = dt;
    }

}