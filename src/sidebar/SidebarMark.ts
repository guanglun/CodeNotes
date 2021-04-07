import * as vscode from "vscode";
import * as path from 'path';
import * as fs from 'fs';
import * as markmanager from '../MarkManager';
import * as database from '../DataBase';
import * as SidebarWeb from './SidebarWeb';

//请参考https://github.com/trylaarsdam/vscode-todo/tree/ab1c86353db83dc70acd3771fd84b29fac72b19a

export class SidebarMark implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;


  constructor(private readonly context: vscode.ExtensionContext, private readonly mm: markmanager.MarkManager,
    private readonly db: database.DataBase) { }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    webviewView.webview.onDidReceiveMessage(async (data): Promise<void> => {
      if (data.type === "InitCodeNotes") {
        this.db.creatCodeNotes();
      }
    });
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    console.log('_getHtmlForWebview');

    return SidebarWeb.getWebViewContent(this.context, 'src/view/sidebar_mark.html');
  }
}