import * as vscode from 'vscode';
import * as sqlite3 from 'sqlite3';
import * as fs from 'fs';
import * as mark from './mark';

export class database {
    private static DATABASE_PATH = ".codenotes";
    private static TABLE_NAME = "marks";
    private static CREATE_TABLE =
        "CREATE TABLE " + database.TABLE_NAME + " (\
        id   INTEGER PRIMARY KEY\
                     UNIQUE,\
        name VARCHAR\
    );";

    private db: sqlite3.Database | undefined;


    /**
   * 读取路径信息
   * @param {string} filepath 路径
   */
    private exist(path: string) {
        fs.stat(path, function (err, result) {
            if (err) {
                fs.mkdir(path, function (err) {
                    console.log(err);
                    return false;
                });
            } else {
                return true;
            }
            return true;
        });
    }


    constructor() {
        this.checkLoadDB();
        this.loadDBIntoMem();
    }

    createTable() {
        if (this.db) {
            this.db.run(database.CREATE_TABLE, function (err) {
                if (err) throw err;
                console.log("Create Table Success!");
                return true;
            });
        }
    }

    showDB() {
        if (this.db) {
            this.db.all("select * from " + database.TABLE_NAME, function (err, rows) {
                if (err) throw err;
                console.log(rows);
                rows[0].id;
            });
        }

    }

    insertDB(mark: mark.mark) {
        if (this.db) {
            console.log("insert into " + database.TABLE_NAME + " values ( NULL , \"" + mark.name + "\" )");

            this.db.run("insert into " + database.TABLE_NAME + " values ( NULL , \"" + mark.name + "\" )", function (err) {
                if (err) throw err;
                console.log("Insert Data Success!");
            });

            this.loadDBIntoMem();
        }
    }


    checkLoadDB() {
        if (vscode.workspace.workspaceFolders) {
            var rootUri = vscode.workspace.workspaceFolders[0].uri;
            var folderUri = vscode.Uri.file(rootUri.fsPath + "\\" + database.DATABASE_PATH);

            this.exist(folderUri.fsPath);

            this.db = new sqlite3.Database(folderUri.fsPath + "\\notes.db", function (err) {
                if (err) {
                    console.log("load database error,", err.message);
                } else {
                    console.log("load database success");
                }
            });
            this.createTable();
            //this.showDB();
        }
    }


    private mkmap: Map<number, mark.mark> = new Map<number, mark.mark>();






    loadDBIntoMem() {

        console.log("start...1");

        let promise = new Promise( (resolve, reject) => {
            if(this.db)
            this.db.all("select * from " + database.TABLE_NAME, function (err, rows) {
                if(err)
                    reject(new Error("array length invalid"));
                else
                    resolve(rows);
                }
            );
        });

        console.log("start...2");

        promise.then((res: any)=> {
            console.log(res);
            if(res.length)
            for(let i = 0;i<res.length;i++)
                this.mkmap.set((res)[i].id, new mark.mark((res)[i].id, (res)[i].name));
            console.log(this.mkmap);
        }, err => {
            console.error(err)
        })

        console.log("start...3");

        // if (this.db) {

        //     let mk = new mark.mark(undefined, undefined);
        //     this.db.each(
        //         "select * from " + database.TABLE_NAME,
        //         function (err, row) {
        //             if (err) throw err;
        //             console.log(row);
        //             //mkmap.set(row.id, new mark.mark(row.id, row.name));

        //         }
        //     );
        // }
    }

}

