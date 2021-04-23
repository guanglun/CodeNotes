// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as database from './DataBase';
import * as Sidebar from './sidebar/Sidebar';
import * as markmanager from './MarkManager';
import * as SidebarWeb from './sidebar/SidebarWeb';
import * as SidebarMark from './sidebar/SidebarMark';
import * as path from 'path';

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

	context.subscriptions.push(vscode.commands.registerCommand('codenotes.deleteItem', (res: Sidebar.EntryItem) => {
		if(!mm.checkDBInit())
			return;
		if(res.command && res.command.arguments)
		{
			mm.delete(res.command.arguments[0]);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('codenotes.renameItem', (res: Sidebar.EntryItem) => {
		if(!mm.checkDBInit())
			return;		
		if(res.command && res.command.arguments)
		{
			mm.renameItem(res.command.arguments[0]);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('codenotes.editItem', (res: Sidebar.EntryItem) => {
		if(!mm.checkDBInit())
			return;		
		if(res.command && res.command.arguments)
		{
			mm.editItem(res.command.arguments[0]);
		}
	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand('codenotes.editMark', async function (textEditor, edit) {
		if(!mm.checkDBInit())
			return;		
		await mm.editItem( await mm.selectWhitch(textEditor,'Edit'));

	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand('codenotes.deleteMark', async function (textEditor, edit) {
		if(!mm.checkDBInit())
			return;		
		await mm.delete( await mm.selectWhitch(textEditor,'Delete'));

	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand('codenotes.renameMark', async function (textEditor, edit) {
		if(!mm.checkDBInit())
			return;		
		await mm.renameItem( await mm.selectWhitch(textEditor,'Rename'));

	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand('codenotes.addJumpLinkMark', async function (textEditor, edit) {
		if(!mm.checkDBInit())
			return;
		await mm.addJump( await mm.selectWhitch(textEditor,'Add Jump Link'));

	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand('codenotes.deleteJumpLinkMark', async function (textEditor, edit) {
		if(!mm.checkDBInit())
			return;		
		await mm.deleteJump( await mm.selectWhitch(textEditor,'Delete Jump Link'));

	}));

	context.subscriptions.push(vscode.commands.registerCommand('codenotes.addJumpLink', (res: Sidebar.EntryItem) => {
		if(!mm.checkDBInit())
			return;		
		if(res.command && res.command.arguments)
		{
			mm.addJump(res.command.arguments[0]);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('codenotes.deleteJumpLink', (res: Sidebar.EntryItem) => {
		if(!mm.checkDBInit())
			return;		
		if(res.command && res.command.arguments)
		{
			mm.deleteJump(res.command.arguments[0]);
		}
	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand('codenotes.insertmark', function (textEditor, edit) {
		if(!mm.checkDBInit())
			return;		
		mm.insert(textEditor);
	}));

	context.subscriptions.push(vscode.window.registerTreeDataProvider("sidebar_marks_all", sd.elAll));
	context.subscriptions.push(vscode.commands.registerCommand("sidebar_marks_all.openChild", (args: number) => {
		if(!mm.checkDBInit())
			return;		
		mm.click(args);
	}));

	context.subscriptions.push(vscode.window.registerTreeDataProvider("sidebar_marks_now", sd.elNow));
	context.subscriptions.push(vscode.commands.registerCommand("sidebar_marks_now.openChild", (args: number) => {
		if(!mm.checkDBInit())
			return;		
		mm.click(args);
	}));

	// vscode.window.registerTreeDataProvider("sidebar_marks_ctrl", sd.elCtrl);
	// vscode.commands.registerCommand("sidebar_marks_ctrl.openChild", (args: number) => {
	// 	//mm.click(args);
	// 	console.log(args);
	// });

	context.subscriptions.push(vscode.commands.registerCommand('codenotes.openWebview', function (uri) {
		if(!mm.checkDBInit())
			return;
		const panel = vscode.window.createWebviewPanel(
			'testWebview', // viewType
			"WebView演示", // 视图标题
			vscode.ViewColumn.One, // 显示在编辑器的哪一个部位
			{
				enableScripts: true, // 启用JS，默认禁用
				retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
			}
		);
		panel.webview.html = SidebarWeb.getWebViewContent(context, 'src/view/index.html');
	}));

	mm.load();
	context.subscriptions.push(mm.getHoverProvider(db));

	context.subscriptions.push (vscode.window.onDidChangeActiveTextEditor(editor => {  
		if(editor) { 
			db.mkmap.forEach((value, key, map)=>
            {
                if(value.filePath === editor.document.fileName)
				{
					mm.showColor(editor,value,markmanager.ShowColorType.sctShow);
				}
            });

			mm.reloadNowItem();
		}  
	}));
	
	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument((editor => {  
		//console.log(editor.fileName);

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
			console.log("affectsConfiguration");
			mm.reloadAllDocColor();
            // if(vscode.workspace.getConfiguration().get('CodeNotes.disableColor') === true)
            // {
			// 	mm.reloadNowItem();
			// }
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

}



// this method is called when your extension is deactivated
export function deactivate() { }

