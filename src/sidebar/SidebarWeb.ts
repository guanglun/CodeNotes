import * as vscode from "vscode";
import * as path from 'path';
import * as fs from 'fs';
import * as markmanager from './../MarkManager';
import * as database from './../DataBase';

//请参考https://github.com/trylaarsdam/vscode-todo/tree/ab1c86353db83dc70acd3771fd84b29fac72b19a

export class SidebarWeb implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;

  
  constructor(private readonly context: vscode.ExtensionContext,private readonly mm: markmanager.MarkManager,
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
      if(data.type === "InitCodeNotes")
      {
        this.db.creatCodeNotes();
      }
    });
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  public initSuccess(){
    console.log('this._view?.webview.postMessage({ command: "InitSuccess" });');
    this._view?.webview.postMessage({ command: "InitSuccess" });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {

  return getWebViewContent(this.context,'src/view/sidebar.html');
  }
}

/**
* 从某个HTML文件读取能被Webview加载的HTML内容
* @param {*} context 上下文
* @param {*} templatePath 相对于插件根目录的html文件相对路径
*/
export function getWebViewContent(context: vscode.ExtensionContext, templatePath: string) {
  const resourcePath = path.join(context.extensionPath, templatePath);
  const dirPath = path.dirname(resourcePath);
  let html = fs.readFileSync(resourcePath, 'utf-8');
  // vscode不支持直接加载本地资源，须要替换成其专有路径格式，这里只是简单的将样式和JS的路径替换
  html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
    return $1 + vscode.Uri.file(path.resolve(dirPath, $2)).with({ scheme: 'vscode-resource' }).toString() + '"';
  });
  return html;
}