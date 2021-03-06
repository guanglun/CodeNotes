// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as database from './DataBase';
import * as Sidebar from './sidebar/Sidebar';
import * as markmanager from './MarkManager';
import * as SidebarWeb from './sidebar/SidebarWeb';
import * as SidebarMark from './sidebar/SidebarMark';
import * as ViewMarks from './webview/ViewMarks';
import * as Mark from './Mark';
import * as path from 'path';
import { exec } from 'node:child_process';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const sd = new Sidebar.Sidebar();

	const db = new database.DataBase(context);
	const mm = new markmanager.MarkManager(context);

	db.init(sd,mm);
	mm.init(sd,db);

	sd.elNow.init(db);
	sd.elAll.init(db);

	sd.setSWeb(new SidebarWeb.SidebarWeb(context,mm,db));
	sd.setSMark(new SidebarMark.SidebarMark(context,mm,db));

	if(sd.sweb){context.subscriptions.push (vscode.window.registerWebviewViewProvider("codenotes.sidebar_web", sd.sweb,{webviewOptions: {retainContextWhenHidden: true}}));}
	if(sd.smark){context.subscriptions.push (vscode.window.registerWebviewViewProvider("codenotes.sidebar_mark", sd.smark,{webviewOptions: {retainContextWhenHidden: true}}));}

	context.subscriptions.push(vscode.commands.registerCommand('codenotes.objdump', (res) => {
		const os = require('os');
		const objdumpPath = <string>vscode.workspace.getConfiguration().get('CodeNotes.objdumpPath');
		if(objdumpPath && os.platform() === "linux")
		{
			const spl = res.path.split(".o");
			const cp = require('child_process');
			cp.exec(`${objdumpPath} -s -d ${res.path} >  ${spl[0]}.txt`);
		}

	}));

	context.subscriptions.push(vscode.commands.registerCommand('codenotes.jumpTo', (res) => {
		if(!mm.checkDBInit())
		{
			return;
		}		
		mm.jumpTo();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('codenotes.jumpToMark', (res) => {
		if(!mm.checkDBInit())
		{
			return;
		}		
		mm.jumpTo(Mark.Mark.FLAG_DEFAULT);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('codenotes.jumpToLine', (res) => {
		if(!mm.checkDBInit())
		{
			return;
		}		
		mm.jumpTo(Mark.Mark.FLAG_LINE);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('codenotes.jumpToFunction', (res) => {
		if(!mm.checkDBInit())
		{
			return;
		}		
		mm.jumpTo(Mark.Mark.FLAG_FUNCTION);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('codenotes.deleteItem', (res: Sidebar.EntryItem) => {
		if(!mm.checkDBInit())
		{
			return;
		}
		if(res.command && res.command.arguments)
		{
			mm.delete(res.command.arguments[0]);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('codenotes.renameItem', (res: Sidebar.EntryItem) => {
		if(!mm.checkDBInit())
		{
			return;
		}		
		if(res.command && res.command.arguments)
		{
			mm.renameItem(res.command.arguments[0]);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('codenotes.editItem', (res: Sidebar.EntryItem) => {
		if(!mm.checkDBInit())
		{
			return;
		}		
		if(res.command && res.command.arguments)
		{
			mm.editItem(res.command.arguments[0]);
		}
	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand('codenotes.editMark', async function (textEditor, edit) {
		if(!mm.checkDBInit(true))
		{
			return;
		}		
		await mm.editItem( await mm.selectWhitch(textEditor,'Edit'));

	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand('codenotes.editMarkDown', async function (textEditor, edit) {
		if(!mm.checkDBInit(true))
		{
			return;
		}		
		await mm.editMarkDown( await mm.selectWhitch(textEditor,'Edit'));
	}));

	context.subscriptions.push(vscode.commands.registerCommand('codenotes.showMarkDown.disable', (res) => {
		if(!mm.checkDBInit(true))
		{
			return;
		}		
		mm.showMarkDownType = markmanager.MDStype.disable;
		mm.typeMarkDown();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('codenotes.showMarkDown.onlyPreview', (res) => {
		if(!mm.checkDBInit(true))
		{
			return;
		}		
		mm.showMarkDownType = markmanager.MDStype.onlyMd;
		mm.typeMarkDown();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('codenotes.showMarkDown.previewAndEdit', (res) => {
		if(!mm.checkDBInit(true))
		{
			return;
		}		
		mm.showMarkDownType = markmanager.MDStype.mdEdit;
		mm.typeMarkDown();
	}));
	
	context.subscriptions.push(vscode.commands.registerTextEditorCommand('codenotes.deleteMark', async function (textEditor, edit) {
		if(!mm.checkDBInit(true))
		{
			return;
		}		
		await mm.delete( await mm.selectWhitch(textEditor,'Delete'));
		mm.loadCursorJumper(textEditor);
	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand('codenotes.renameMark', async function (textEditor, edit) {
		if(!mm.checkDBInit(true))
		{
			return;
		}		
		await mm.renameItem( await mm.selectWhitch(textEditor,'Rename'));

	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand('codenotes.jumpToNext', async function (textEditor, edit) {
		if(!mm.checkDBInit(true))
		{
			return;
		}
		await mm.jumpToNext();
	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand('codenotes.jumpToPrevious', async function (textEditor, edit) {
		if(!mm.checkDBInit(true))
		{
			return;
		}
		await mm.jumpToPrevious();
	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand('codenotes.addJumpLinkMark', async function (textEditor, edit) {
		if(!mm.checkDBInit(true))
		{
			return;
		}
		await mm.addJump( await mm.selectWhitch(textEditor,'Add Jump Link'));
		mm.loadCursorJumper(textEditor);
	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand('codenotes.deleteJumpLinkMark', async function (textEditor, edit) {
		if(!mm.checkDBInit(true))
		{
			return;
		}		
		await mm.deleteJump( await mm.selectWhitch(textEditor,'Delete Jump Link'));
		mm.loadCursorJumper(textEditor);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('codenotes.addJumpLink', (res: Sidebar.EntryItem) => {
		if(!mm.checkDBInit(true))
		{
			return;
		}		
		if(res.command && res.command.arguments)
		{
			mm.addJump(res.command.arguments[0]);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('codenotes.deleteJumpLink', (res: Sidebar.EntryItem) => {
		if(!mm.checkDBInit(true))
		{
			return;
		}		
		if(res.command && res.command.arguments)
		{
			mm.deleteJump(res.command.arguments[0]);
		}
	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand('codenotes.insertMark', function (textEditor, edit) {
		if(!mm.checkDBInit(true))
		{
			return;
		}		
		
		mm.insert(textEditor,Mark.Mark.FLAG_DEFAULT);
		mm.loadCursorJumper(textEditor);
	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand('codenotes.insertLine', async function (textEditor, edit) {
		if(!mm.checkDBInit(true))
		{
			return;
		}		
		mm.insert(textEditor,Mark.Mark.FLAG_LINE);
		mm.showMarkDown(textEditor.document.fileName,textEditor.selection.active.line);
		mm.loadCursorJumper(textEditor);
	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand('codenotes.insertFunction', async function (textEditor, edit) {
		if(!mm.checkDBInit(true))
		{
			return;
		}		
		mm.insert(textEditor,Mark.Mark.FLAG_FUNCTION);
		mm.showMarkDown(textEditor.document.fileName,textEditor.selection.active.line);
		mm.loadCursorJumper(textEditor);
	}));

	context.subscriptions.push(vscode.window.registerTreeDataProvider("sidebar_marks_all", sd.elAll));
	context.subscriptions.push(vscode.commands.registerCommand("sidebar_marks_all.openChild", (args: number) => {
		if(!mm.checkDBInit())
		{
			return;
		}		
		mm.click(args);
	}));

	context.subscriptions.push(vscode.window.registerTreeDataProvider("sidebar_marks_now", sd.elNow));
	context.subscriptions.push(vscode.commands.registerCommand("sidebar_marks_now.openChild", (args: number) => {
		if(!mm.checkDBInit())
		{
			return;
		}		
		mm.click(args);
	}));

	// vscode.window.registerTreeDataProvider("sidebar_marks_ctrl", sd.elCtrl);
	// vscode.commands.registerCommand("sidebar_marks_ctrl.openChild", (args: number) => {
	// 	//mm.click(args);
	// 	console.log(args);
	// });

	context.subscriptions.push(vscode.commands.registerCommand('codenotes.openWebview', function (uri) {
		if(!mm.checkDBInit(true))
		{
			return;
		}

		ViewMarks.ViewMarksPanel.createOrShow(context.extensionUri,mm,db);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('codenotes.generate', function (uri) {
		if(!mm.checkDBInit(true))
		{
			return;
		}
		mm.generate();
	}));

	
	mm.load();
	//context.subscriptions.push(mm.getHoverProvider(db));

	context.subscriptions.push (vscode.window.onDidChangeActiveTextEditor(editor => {  
		if(editor) { 
			db.mkmap.forEach((value, key, map)=>
            {
                if(value.filePath === editor.document.fileName)
				{
					mm.showColor(editor,value,markmanager.ShowColorType.sctClear);
					mm.showColor(editor,value,markmanager.ShowColorType.sctShow);
				}
            });

			mm.reloadNowItem();
		}  
	}));
	
	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument((editor => {  
		if(!mm.checkDBInit())
		{
			return;
		}		
		mm.saveMarkDown(editor);
		db?.mkmap.forEach((mk, key, map)=>
		{
			if(mk.filePath === editor.fileName)
			{
				mk.writeRange(editor);
				db.updateRange(mk);
			}
		});
	})));
	
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((cevent =>{
		if (cevent.affectsConfiguration("CodeNotes.disableColor")) {
			mm.reloadAllDocColor();
		}
	})));

	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(doc => {  
	
		doc.contentChanges.forEach((cc, key, map)=>
		{
			db?.mkmap.forEach((mk, key, map)=>
			{
				if(mk.filePath === doc.document.fileName)
				{
					mm.onChangeDoc(mk,cc,doc);
				}
			});
		});

	}));

	context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(event =>{
		if(event.textEditor.viewColumn === vscode.ViewColumn.One)
		{
			mm.showMarkDown(event.textEditor.document.fileName,event.selections[0].active.line);
			mm.loadCursorJumper(event.textEditor);
		}
	}));
}



// this method is called when your extension is deactivated
export function deactivate() { }

