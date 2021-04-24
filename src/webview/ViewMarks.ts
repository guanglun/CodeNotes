import * as vscode from 'vscode';
import * as markmanager from '../MarkManager';
import * as database from '../DataBase';
import { Mark } from '../Mark';

export class ViewMarksPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: ViewMarksPanel | undefined;

	public static readonly viewType = 'viewMarks';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri,
		mm: markmanager.MarkManager,
		db: database.DataBase) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (ViewMarksPanel.currentPanel) {
			ViewMarksPanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			ViewMarksPanel.viewType,
			'View Marks',
			column || vscode.ViewColumn.One,
			ViewMarksPanel.getWebviewOptions(extensionUri),
		);

		ViewMarksPanel.currentPanel = new ViewMarksPanel(panel, extensionUri,mm,db);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, 
		private readonly mm: markmanager.MarkManager,
		private readonly db: database.DataBase) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set the webview's initial html content
		this._panel.title = "View Marks";
		this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'log':
						console.log(message.text);
						break;
					case 'state':
						if(message.state == 'startup')
						{
							this.sendMarks();
						}
						break;						
				}
			},
			null,
			this._disposables
		);
	}

	public sendMarks()
	{
		let marks  = Array.from(this.db.mkmap.values());
		// console.log(marks);
		// console.log(JSON.stringify(marks));
		this._panel.webview.postMessage({ command: 'marks' , 'marks': marks});
	}

	public doRefactor() {
		// Send a message to the webview webview.
		// You can send any JSON serializable data.
		this._panel.webview.postMessage({ command: 'refactor' });
	}

	public dispose() {
		ViewMarksPanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {

		const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media/viewmarks', 'main.js');
		const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

		const jsplumbPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media/viewmarks', 'jsplumb.min.js');
		const jsplumbUri = webview.asWebviewUri(jsplumbPathOnDisk);
		
		// Local path to css styles
		const styleResetPath = vscode.Uri.joinPath(this._extensionUri, 'media/viewmarks', 'reset.css');
		const stylesPathMainPath = vscode.Uri.joinPath(this._extensionUri, 'media/viewmarks', 'vscode.css');

		// Uri to load styles into webview
		const stylesResetUri = webview.asWebviewUri(styleResetPath);
		const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);

		
		const bodyPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media/viewmarks', 'jsplumb.min.js');
		const bodyUri = webview.asWebviewUri(bodyPathOnDisk);

		const mainPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media/viewmarks', 'main.css');
		const mainUri = webview.asWebviewUri(mainPathOnDisk);

		// Use a nonce to only allow specific scripts to be run
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="X-UA-Compatible" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
		
				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${stylesResetUri}" rel="stylesheet">
				<link href="${stylesMainUri}" rel="stylesheet">
				<link href="${mainUri}" rel="stylesheet">
				
				<title>MarkView</title>
			</head>

			<div id="container"></div>

			<script nonce="${nonce}" src="${jsplumbUri}"></script>
			<script nonce="${nonce}" src="${scriptUri}"></script>
			
			</html>`;
	}
	public static getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
		return {
			// Enable javascript in the webview
			enableScripts: true,
			// And restrict the webview to only loading content from our extension's `media` directory.
			localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media/viewmarks')]
		};
	}
	
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
