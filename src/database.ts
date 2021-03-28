import * as vscode from 'vscode';
import * as sqlite3 from 'sqlite3';
import * as fs from 'fs';

export class database {
    private static DATABASE_PATH=".codenotes"
    private const db: any;
    /**
   * 读取路径信息
   * @param {string} filepath 路径
   */
    private exist(path: string) {
        fs.stat(path,function (err,result) {
            if(err) {
                fs.mkdir(path,function (err) {
                    console.log(err);
                    return false;
                });
            }else{
                return true;
            }
            return true;
        });
    }


    constructor() {
        if(vscode.workspace.workspaceFolders)
        {
            var rootUri = vscode.workspace.workspaceFolders[0].uri;
            var folderUri = vscode.Uri.file(rootUri.fsPath + "\\" + database.DATABASE_PATH);

            this.exist(folderUri.fsPath);

            this.db = new sqlite3.Database(folderUri.fsPath + "\\notes.db", function (err) {
                if (err) {
                    console.log("new database error,", err.message);
                } else {
                    console.log("new database success");
                }
            });
        }
    }





}

