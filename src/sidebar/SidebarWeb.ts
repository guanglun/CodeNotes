import * as vscode from "vscode";
import * as path from 'path';
import * as fs from 'fs';
import * as markmanager from './../MarkManager';
import * as database from './../DataBase';

//请参考https://github.com/trylaarsdam/vscode-todo/tree/ab1c86353db83dc70acd3771fd84b29fac72b19a

export class SidebarWeb implements vscode.WebviewViewProvider {
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
      }else if (data.type === "SWEBStart") {
        if(this.db.isDBInit === true)
        {
          this.webShowMenu();
        }else{
          this.webShowInit();
        }

        if(vscode.workspace.getConfiguration().get('CodeNotes.disableColor') === true)
        {
          this._view?.webview.postMessage({ command: "CodeNotes.disableColor",value:"true" });
        }else{
          this._view?.webview.postMessage({ command: "CodeNotes.disableColor",value:"false" });
        }



      }else  if (data.type === "DisableColor") {

        if(data.value === 'true')
        {
          vscode.workspace.getConfiguration().update('CodeNotes.disableColor',true);
        }else{
          vscode.workspace.getConfiguration().update('CodeNotes.disableColor',false);
        }
        //this.mm.reloadAllDocColor();
      }
    });
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  public webShowInit() {
    this._view?.webview.postMessage({ command: "ShowInit" });
  }

  public webShowMenu() {
    this._view?.webview.postMessage({ command: "ShowMenu" });
  }

  public static getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  

  private _getHtmlForWebview(webview: vscode.Webview) {
    //return getWebViewContent(this.context, 'src/view/sidebar.html');
    const nonce = SidebarWeb.getNonce();

    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'main.js'));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'main.css'));


    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">

      <!--
        Use a content security policy to only allow loading images from https or from our extension directory,
        and only allow scripts that have a specific nonce.
      -->
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

      <meta name="viewport" content="width=device-width, initial-scale=1.0">

      <link href="${styleResetUri}" rel="stylesheet">
      <link href="${styleVSCodeUri}" rel="stylesheet">
      <link href="${styleMainUri}" rel="stylesheet">
      
      <title>Cat Colors</title>

    </head>
    
    <body>
    
      <h3 style="width:100%;">CodeNotes</h3>
      <button onclick="InitCodeNotes()" type="button" id="btInitCodeNotes" style="cursor: pointer;width:100%;height:30px;" hidden="true">Initialize CodeNotes</button>
      <button onclick="HelloCodeNotes()" type="button" id="btHelloCodeNotes" style="cursor: pointer;width:100%;height:30px;" hidden="true">Hello CodeNotes</button>
      <h2 id="textInitCodeNotes" style="cursor: pointer;width:100%;color:red" hidden="true">Please Initialize CodeNotes</h2>
    
      <input onclick="cbDisableColorOnClick()" type="checkbox" id="cbDisableColor" style="vertical-align:middle;margin: 10px;">Disable Color</input><br>
    
      <script nonce="${nonce}" src="${scriptUri}">
        const tsvscode = acquireVsCodeApi();
        var btInitCodeNotes = document.getElementById("btInitCodeNotes");
        var btHelloCodeNotes = document.getElementById("btHelloCodeNotes");
        var textInitCodeNotes = document.getElementById("textInitCodeNotes");
        var cbDisableColor = document.getElementById("cbDisableColor");
    
        tsvscode.postMessage({ type: "SWEBStart"});
    
        function InitCodeNotes()
        {
          tsvscode.postMessage({ type: "InitCodeNotes"});
        }
    
        function HelloCodeNotes()
        {
          tsvscode.postMessage({ type: "InitCodeNotes"});
        }
    
        function cbDisableColorOnClick()
        {
          if(cbDisableColor.checked){
            tsvscode.postMessage({ type: "DisableColor",value:"true"});
          }else{
            tsvscode.postMessage({ type: "DisableColor",value:"false"});
          }
        }
    
        window.addEventListener('message', event => {
    
    
          const message = event.data;
          switch(message.command)
          {
              case 'ShowInit':
              textInitCodeNotes.hidden = false;
              btInitCodeNotes.hidden = false;
              btHelloCodeNotes.hidden = true;
              break;
              case 'ShowMenu':
              textInitCodeNotes.hidden = true;
              btInitCodeNotes.hidden = true;
              //btHelloCodeNotes.hidden = false;
              break;  
              case 'CodeNotes.disableColor':
                if(message.value === "true")
                {
                  cbDisableColor.checked = true;
                }else{
                  cbDisableColor.checked = false;
                }
    
                break;        
              default:
                break;
          }
      });
    
    
      </script>
    </body>
    
    </html>    
    
    
    
    `;
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