// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as sidebar from './test';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "hello-code" is now active!');

	let disposable = vscode.commands.registerCommand('hello-code.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from hello-code!');
		
	});

	//vscode.window.registerTreeDataProvider("sidebar_test", new DataProvider());

	// require('./sidebar.ts')(context);
	// context.subscriptions.push(disposable);

	const sidebar_test = new sidebar.EntryList();
	vscode.window.registerTreeDataProvider("sidebar_test_id1",sidebar_test);
	vscode.commands.registerCommand("sidebar_test_id1.openChild",args => {
        vscode.window.showInformationMessage(args);
    });
}

// this method is called when your extension is deactivated
export function deactivate() {}
