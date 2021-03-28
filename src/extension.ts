// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as sidebar from './sidebar';
import * as path from 'path';
import * as fs from 'fs';
import * as markmanager from './markmanager';
import * as mark from './mark';
import * as database from './database';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const sidebarView = new sidebar.EntryList();
	const db = new database.database(context,sidebarView);
	const mm = new markmanager.markmanager(context,sidebarView,db);

	console.log('Congratulations, your extension "hello-code" is now active!');

	// let disposable = vscode.commands.registerCommand('hello-code.helloWorld', () => {
	// 	vscode.window.showInformationMessage('Hello World from hello-code!'); 
		
	// });

	let command = vscode.commands.registerTextEditorCommand('hello-code.helloWorld', function(textEditor, edit) {
		// const text = textEditor.document.getText(textEditor.selection);
		// console.log(textEditor.document.fileName);
		// console.log(textEditor.selection.start.line + " : " + textEditor.selection.start.character);
		// console.log(textEditor.selection.end.line + " : " + textEditor.selection.end.character);
		// console.log('选中的文本是:', text);
		//mm.insert(textEditor);
	  });

	

	vscode.window.registerTreeDataProvider("sidebar_test_id1",sidebarView);
	vscode.commands.registerCommand("sidebar_test_id1.openChild",args => {
		console.log('click!!');

		// const mmark = mark.match(undefined,<sidebar.EntryItem>args);
		// console.log('click22!!');
		// if(mmark !== undefined)
		// {console.log('click33!!');
		// 	vscode.window.showInformationMessage(mmark.textEditor.document.fileName);
		// 	console.log(mmark.textEditor.document.fileName);
		// }else{
		// 	console.log('click44!!');
		// }

        
    });
	// const str:string[] = ['a','b','c']; 
	// console.log('dump...');
	// console.log(context.workspaceState.get('test'));
	// context.workspaceState.update('test',str);
	// console.log('dump...');
	// console.log(context.workspaceState.get('test'));
	// str.push('d');
	// context.workspaceState.update('test',str);
	// console.log('dump...');
	// console.log(context.workspaceState.get('test'));
		//context.workspaceState.get(this.value)


	context.subscriptions.push(vscode.commands.registerCommand('hello-code.openWebview', function (uri) {
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
		panel.webview.html = getWebViewContent(context,'src/view/index.html');
		}));


		// vscode.workspace.openTextDocument(vscode.Uri.file("文件路径)).then(
		// 	document => vscode.window.showTextDocument(document)
		// )
		// console.log(context.storageUri?.path);
		// console.log(context.globalStorageUri.path);	

}

/**
 * 从某个HTML文件读取能被Webview加载的HTML内容
 * @param {*} context 上下文
 * @param {*} templatePath 相对于插件根目录的html文件相对路径
 */
 function getWebViewContent(context: vscode.ExtensionContext, templatePath: string) {
    const resourcePath = path.join(context.extensionPath, templatePath);
    const dirPath = path.dirname(resourcePath);
    let html = fs.readFileSync(resourcePath, 'utf-8');
    // vscode不支持直接加载本地资源，须要替换成其专有路径格式，这里只是简单的将样式和JS的路径替换
    html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
        return $1 + vscode.Uri.file(path.resolve(dirPath, $2)).with({ scheme: 'vscode-resource' }).toString() + '"';
    });
    return html;
}

// this method is called when your extension is deactivated
export function deactivate() {}

