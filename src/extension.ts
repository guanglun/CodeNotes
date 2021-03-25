// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as sidebar from './test';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const sidebar_test = new sidebar.EntryList();

	console.log('Congratulations, your extension "hello-code" is now active!');

	// let disposable = vscode.commands.registerCommand('hello-code.helloWorld', () => {
	// 	vscode.window.showInformationMessage('Hello World from hello-code!'); 
		
	// });

	let command = vscode.commands.registerTextEditorCommand('hello-code.helloWorld', function(textEditor, edit) {
		const text = textEditor.document.getText(textEditor.selection);
		console.log(textEditor.document.fileName);
		console.log(textEditor.selection.start.line + " : " + textEditor.selection.start.character);
		console.log(textEditor.selection.end.line + " : " + textEditor.selection.end.character);
		console.log('选中的文本是:', text);
		sidebar_test.insert(textEditor.document.fileName);
	  });

	

	vscode.window.registerTreeDataProvider("sidebar_test_id1",sidebar_test);
	vscode.commands.registerCommand("sidebar_test_id1.openChild",args => {
		sidebar_test.refresh2();
        vscode.window.showInformationMessage(args);
    });
}

// this method is called when your extension is deactivated
export function deactivate() {}
