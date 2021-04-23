import * as vscode from "vscode";
import * as path from 'path';
import * as fs from 'fs';
import * as markmanager from '../MarkManager';
import * as database from '../DataBase';
import * as SidebarWeb from './SidebarWeb';
import * as Mark from './../Mark';

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
      if (data.type === "setColor") {
        this.mm.setColor(data.id,data.color);
      }else if (data.type === "setName") {
        //console.log(data.id+ " "+data.name);
        this.mm.setName(data.id,data.name);
      }else if (data.type === "setDescription") {
        //console.log(data.id+ " "+data.description);
        this.mm.setDescription(data.id,data.description);
      }
    });
  }


  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  public updateMarkEdit(mk:Mark.Mark) {
    this._view?.webview.postMessage({ mark: {id:mk.id,name:mk.name,filePath:mk.filePath,color:mk.color,description:mk.description} });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    //return SidebarWeb.getWebViewContent(this.context,'src/view/sidebar_mark.html');

    return `
    
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    
    <body>

      <div> <input id="textMarkName" type="text" onchange="nameOnChange()"
          style="margin-top:10px;margin-bottom:10px;font-size:24px;color: white;background-color:transparent;border:0;" name="t2" value=CodeNotes /> </div>
    
    
      <input type="color" id="colorSelect" onchange="colorChange()" />
    
      <div style="margin-top:6px;">notes(support markdown):</div>
    
      <textarea id="taDescription" onchange="taOnChange()" cols="80" rows="10"
        style="margin-top:6px;resize: none;width:100%;color: white; background-color: #2E2E2E;"></textarea>
    
      <div id="textId" style="margin-top:6px;">Id:</div>
      <div id="textFilePath" style="margin-top:6px;">Path:</div>
    
    
    
    
      <script type="text/javascript">
        const tsvscode = acquireVsCodeApi();
    
        var textMarkName = document.getElementById("textMarkName");
        var textFilePath = document.getElementById("textFilePath");
        var colorSelect = document.getElementById("colorSelect");
        var taDescription = document.getElementById("taDescription");
        var textId = document.getElementById("textId");
        var markId;
    
        window.addEventListener('message', event => {
    
          const message = event.data;
          if (message.mark) {
            textMarkName.value = message.mark.name;
            textFilePath.innerText = "Path: " + message.mark.filePath;
            textId.innerText = "Id: " + message.mark.id;
            markId = message.mark.id;
            colorSelect.value = message.mark.color;
            taDescription.value = message.mark.description;
          }
        });
    
        function colorChange() {
          tsvscode.postMessage({ type: "setColor", id: markId, color: colorSelect.value });
        }
        function nameOnChange() {
          tsvscode.postMessage({ type: "setName", id: markId, name: textMarkName.value });
        }
        function taOnChange() {
          tsvscode.postMessage({ type: "setDescription", id: markId, description: taDescription.value });
        }
      </script>
    </body>
    
    </html>    
    
    
    
    
    
    
    
    
    
    `;
  }
}