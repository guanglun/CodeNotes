import * as vscode from 'vscode';
import * as sqlite3 from 'sqlite3';
import * as fs from 'fs';
import * as mark from './mark';
import * as Sidebar from './sidebar/Sidebar';
import * as markmanager from './MarkManager';

export class DataBase {

    private static databasePath = ".codenotes";
    private static tableName = "marks";
    private static creatTable =
        "CREATE TABLE " + DataBase.tableName + " (\
        id   INTEGER PRIMARY KEY\
                     UNIQUE,\
        name VARCHAR,\
        flag INTEGER,\
        file_name VARCHAR,\
        anchor_line INTEGER,\
        anchor_character INTEGER,\
        active_line INTEGER,\
        active_character INTEGER,\
        start_line INTEGER,\
        start_character INTEGER,\
        end_line INTEGER,\
        end_character INTEGER \
        );";


    public mkmap: Map<number, mark.Mark> = new Map<number, mark.Mark>();
    private context: vscode.ExtensionContext;
    private sidebar: Sidebar.Sidebar | undefined;


    private db: sqlite3.Database | undefined;
    private mm: markmanager.MarkManager | undefined;
    public lastId = 0;

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

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public init(sidebar: Sidebar.Sidebar, mm: markmanager.MarkManager) {
        this.sidebar = sidebar;
        this.mm = mm;
    }

    loadDB() {
        const promise = this.loadDBIntoMemPromise();
        promise.then((res: any) => {
            console.log(res);
            if (res.length) {
                this.mkmap.clear();
                for (let i = 0; i < res.length; i++) {
                    const mk = new mark.Mark(
                        res[i].id,
                        res[i].name,
                        res[i].flag,
                        res[i].file_name,
                        res[i].anchor_line,
                        res[i].anchor_character,
                        res[i].active_line,
                        res[i].active_character,

                        res[i].start_line,
                        res[i].start_character,
                        res[i].end_line,
                        res[i].end_character,

                    );
                    this.mkmap.set(mk.id, mk);
                    this.sidebar?.elAll?.insert(mk);
                }
                this.lastId = res[res.length - 1].id;

                this.sidebar?.elAll?.refresh();

                this.mm?.reloadNowItem();
                this.mm?.teColorManager(markmanager.TEColorManagerType.tecmtInit);
            }
            //console.log(this.mkmap);
        }, err => {
            console.error(err);
        });


    }

    createTable() {
        if (this.db) {
            this.db.run(DataBase.creatTable, function (err) {
                if (err) { throw err; }
                console.log("Create Table Success!");
                return true;
            });
        }
    }

    showDB() {
        if (this.db) {
            this.db.all("select * from " + DataBase.tableName, function (err, rows) {
                if (err) { throw err; }
                console.log(rows);
                rows[0].id;
            });
        }

    }

    updateName(id: number,name: string)
    {
        this.db?.run("update " + DataBase.tableName + " set name = " + name.toString() + " WHERE id = " + id, function(err) {
            if (err) {throw err;}
            console.log("Update Data Success!");
          });
    }

    insertDB(mk: mark.Mark) {
        if (this.db) {
            const dbexc = "insert into " + DataBase.tableName + " values ( " +
                mk.id + " , " +
                "\"" + mk.name + "\" , " +
                mk.flag + " , " +
                "\"" + mk.filePath + "\" , " +

                mk.anchorLine + " , " +
                mk.anchorCharacter + " , " +
                mk.activeLine + " , " +
                mk.activeCharacter + " , " +

                mk.startLine + " , " +
                mk.startCharacter + " , " +
                mk.endLine + " , " +
                mk.endCharacter +
                ")";
            console.log(dbexc);
            this.db.run(dbexc, function (err) {
                if (err) { throw err; }
                console.log("Insert Data Success!");
            });

            this.mkmap.set(mk.id, mk);
        }
    }


    public checkLoadDB() {
        if (vscode.workspace.workspaceFolders) {
            var rootUri = vscode.workspace.workspaceFolders[0].uri;
            var folderUri = vscode.Uri.file(rootUri.fsPath + "\\" + DataBase.databasePath);

            this.exist(folderUri.fsPath);

            this.db = new sqlite3.Database(folderUri.fsPath + "\\notes.db", function (err) {
                if (err) {
                    console.log("load database error,", err.message);
                } else {
                    console.log("load database success");
                }
            });
            this.createTable();
        }
    }

    deleteDB(id: number) {
        if (this.db) {
            this.db.run("delete from " + DataBase.tableName + " WHERE id = " + id, function (err) {
                if (err) { throw err; }
                console.log("Delete Data Success!");
            });
        }
    }

    loadDBIntoMemPromise() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.all("select * from " + DataBase.tableName, function (err, rows) {
                    if (err) { reject(new Error("array length invalid")); }
                    else { resolve(rows); }
                }
                );
            }
        });
    }
}

