// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as sidebar from './sidebar';
import * as path from 'path';
import * as fs from 'fs';
import * as markmanager from './markmanager';
import * as mark from './mark';
import * as database from './database';
import { TextEncoder } from 'node:util';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const el = new sidebar.EntryList();
	const db = new database.database(context);
	const mm = new markmanager.markmanager(context);

	db.init(el,mm);
	mm.init(el,db);
	el.init(db);
	
	vscode.commands.registerCommand
	vscode.commands.registerCommand('codenotes.deleteItem', (res: sidebar.EntryItem) => {
		if(res.command && res.command.arguments)
		{
			mm.delete(res.command.arguments[0]);
			//console.log(res.command.arguments);
		}
			
	});

	let command = vscode.commands.registerTextEditorCommand('codenotes.helloWorld', function (textEditor, edit) {
		// const text = textEditor.document.getText(textEditor.selection);
		// console.log(textEditor.document.fileName);
		// console.log(textEditor.selection.start.line + " : " + textEditor.selection.start.character);
		// console.log(textEditor.selection.end.line + " : " + textEditor.selection.end.character);
		// console.log('选中的文本是:', text);
		// console.log(textEditor.selection.anchor.line +" " +textEditor.selection.anchor.character);
		// console.log(textEditor.selection.active.line +" " +textEditor.selection.active.character);


		//console.log(textEditor.document. +" " +textEditor.selection.active.character);


		mm.insert(textEditor);
	});

	vscode.window.registerTreeDataProvider("sidebar_test_id1", el);
	vscode.commands.registerCommand("sidebar_test_id1.openChild", (args: number) => {
		//console.log('click id : '+args);
		mm.click(args);
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
		panel.webview.html = getWebViewContent(context, 'src/view/index.html');
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
                if(value.file_path === editor.document.fileName)
				{
					
					mm.showColor(editor,value,markmanager.ShowColorType.SCT_SHOW);
				}
            });
		}  
	});

	
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
export function deactivate() { }

