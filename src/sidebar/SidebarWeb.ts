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

        if(vscode.workspace.getConfiguration().get('CodeNotes.enableColor') === true)
        {
          this._view?.webview.postMessage({ command: "CodeNotes.enableColor",value:"true" });
        }else{
          this._view?.webview.postMessage({ command: "CodeNotes.enableColor",value:"false" });
        }



      }else  if (data.type === "EnableColor") {

        if(data.value === 'true')
        {
          vscode.workspace.getConfiguration().update('CodeNotes.enableColor',true);
        }else{
          vscode.workspace.getConfiguration().update('CodeNotes.enableColor',false);
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

  private _getHtmlForWebview(webview: vscode.Webview) {
    //return getWebViewContent(this.context, 'src/view/sidebar.html');
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    
    <body>
    
      <h3 style="width:100%;">CodeNotes</h3>
      <button onclick="InitCodeNotes()" type="button" id="btInitCodeNotes" style="cursor: pointer;width:100%;height:30px;" hidden="true">Initialize CodeNotes</button>
      <button onclick="HelloCodeNotes()" type="button" id="btHelloCodeNotes" style="cursor: pointer;width:100%;height:30px;" hidden="true">Hello CodeNotes</button>
      <h2 id="textInitCodeNotes" style="cursor: pointer;width:100%;color:red" hidden="true">Please Initialize CodeNotes</h2>
    
      <input onclick="cbEnableColorOnClick()" type="checkbox" id="cbEnableColor" hidden="true" style="vertical-align:middle;margin: 10px;">Enable Color<br>
    
      <script type="text/javascript">
        const tsvscode = acquireVsCodeApi();
        var btInitCodeNotes = document.getElementById("btInitCodeNotes");
        var btHelloCodeNotes = document.getElementById("btHelloCodeNotes");
        var textInitCodeNotes = document.getElementById("textInitCodeNotes");
        var cbEnableColor = document.getElementById("cbEnableColor");
    
        tsvscode.postMessage({ type: "SWEBStart"});
    
        function InitCodeNotes()
        {
          tsvscode.postMessage({ type: "InitCodeNotes"});
        }
    
        function HelloCodeNotes()
        {
          tsvscode.postMessage({ type: "InitCodeNotes"});
        }
    
        function cbEnableColorOnClick()
        {
          if(cbEnableColor.checked){
            tsvscode.postMessage({ type: "EnableColor",value:"true"});
          }else{
            tsvscode.postMessage({ type: "EnableColor",value:"false"});
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
              cbEnableColor.hidden = true;
              break;
              case 'ShowMenu':
              textInitCodeNotes.hidden = true;
              btInitCodeNotes.hidden = true;
              //btHelloCodeNotes.hidden = false;
              cbEnableColor.hidden = false;
              break;  
              case 'CodeNotes.enableColor':
                if(message.value === "true")
                {
                  cbEnableColor.checked = true;
                }else{
                  cbEnableColor.checked = false;
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