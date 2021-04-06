// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as database from './DataBase';
import * as Sidebar from './sidebar/Sidebar';
import * as markmanager from './MarkManager';
import * as SidebarWeb from './sidebar/SidebarWeb';


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

	if(sd.sweb)
	{
		
		//context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("sidebar_web", sd.sweb);//);
	}
	
	vscode.commands.registerCommand('codenotes.deleteItem', (res: Sidebar.EntryItem) => {
		if(res.command && res.command.arguments)
		{
			//vscode.window.setStatusBarMessage('Delete ' + res.command.arguments[0],3000);
			mm.delete(res.command.arguments[0]);
		}
	});

	vscode.commands.registerCommand('codenotes.renameItem', (res: Sidebar.EntryItem) => {
		if(res.command && res.command.arguments)
		{
			mm.renameItem(res.command.arguments[0]);
		}
	});

	let command = vscode.commands.registerTextEditorCommand('codenotes.insertmark', function (textEditor, edit) {
		// const text = textEditor.document.getText(textEditor.selection);
		// console.log(textEditor.document.fileName);
		// console.log(textEditor.selection.start.line + " : " + textEditor.selection.start.character);
		// console.log(textEditor.selection.end.line + " : " + textEditor.selection.end.character);
		// console.log('选中的文本是:', text);
		// console.log(textEditor.selection.anchor.line +" " +textEditor.selection.anchor.character);
		// console.log(textEditor.selection.active.line +" " +textEditor.selection.active.character);
		// console.log(textEditor.document. +" " +textEditor.selection.active.character);
		//vscode.window.setStatusBarMessage('Insert',3000);


		mm.insert(textEditor);
	});



	vscode.window.registerTreeDataProvider("sidebar_marks_all", sd.elAll);
	vscode.commands.registerCommand("sidebar_marks_all.openChild", (args: number) => {
		mm.click(args);
	});

	vscode.window.registerTreeDataProvider("sidebar_marks_now", sd.elNow);
	vscode.commands.registerCommand("sidebar_marks_now.openChild", (args: number) => {
		mm.click(args);
	});

	// vscode.window.registerTreeDataProvider("sidebar_marks_ctrl", sd.elCtrl);
	// vscode.commands.registerCommand("sidebar_marks_ctrl.openChild", (args: number) => {
	// 	//mm.click(args);
	// 	console.log(args);
	// });

	context.subscriptions.push(vscode.commands.registerCommand('codenotes.openWebview', function (uri) {
		// 建立webview
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

// 	const hover = vscode.languages.registerHoverProvider('*', {
// 		provideHover(document, position, token) {
// 		  const fileName    = document.fileName;
// 		  const workDir     = path.dirname(fileName);
// 		  const word        = document.getText(document.getWordRangeAtPosition(position));
// 		  // console.log(1, document)
// 		  // console.log(2, position)
// 		  // console.log(3, token)
// 		  console.log(4, '这个就是悬停的文字', word)
// 		  // 支持markdown语法
// 		  return new vscode.Hover(
// 		  `### 我就是返回的信息!
// 			1. 第一项：
// 			  - 第一个元素
// 			  -
// 			  - 第二个元素
// 			2. 第二项：
// 			  - 第一个元素
// 			  - 第二个元素
// 		`+word);
// 		}
// 	   }
// 	  );
//   context.subscriptions.push(hover);

	vscode.window.onDidChangeActiveTextEditor(editor => {  
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
	});
	
}



// this method is called when your extension is deactivated
export function deactivate() { }

