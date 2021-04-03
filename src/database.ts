import * as vscode from 'vscode';
import * as sqlite3 from 'sqlite3';
import * as fs from 'fs';
import * as mark from './mark';
import * as sidebar_all from './sidebar_all';
import * as markmanager from './markmanager';

export class database {
    private static DATABASE_PATH = ".codenotes";
    private static TABLE_NAME = "marks";
    private static CREATE_TABLE =
        "CREATE TABLE " + database.TABLE_NAME + " (\
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


    public mkmap: Map<number, mark.mark> = new Map<number, mark.mark>();
    private context: vscode.ExtensionContext;
    private el_all: sidebar_all.EntryList | undefined;
    private db: sqlite3.Database | undefined;
    private mm: markmanager.markmanager | undefined;
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

    public init(el_all: sidebar_all.EntryList, mm: markmanager.markmanager) {
        this.el_all = el_all;
        this.mm = mm;
    }

    loadDB() {
        const promise = this.loadDBIntoMemPromise();


        promise.then((res: any) => {
            console.log(res);
            if (res.length) {
                this.mkmap.clear();
                for (let i = 0; i < res.length; i++) {
                    const mk = new mark.mark(
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
                        
                        
                        )
                    this.mkmap.set(mk.id, mk);
                    this.el_all?.insert(mk);
                }
                this.lastId = res[res.length - 1].id;
                
                this.el_all?.refresh();

                this.mm?.TEColorManager(markmanager.TEColorManagerType.TECMT_INIT);
            }
            //console.log(this.mkmap);
        }, err => {
            console.error(err)
        })


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

    insertDB(mk: mark.mark) {
        if (this.db) {
            const dbexc = "insert into " + database.TABLE_NAME + " values ( " + 
            mk.id + " , "  +
            "\"" + mk.name + "\" , "  +
            mk.flag + " , "  +
            "\"" + mk.file_path + "\" , "  +

            mk.anchor_line + " , "  +
            mk.anchor_character + " , "  +
            mk.active_line + " , "  +
            mk.active_character + " , "  +

            mk.start_line + " , "  +
            mk.start_character + " , "  +
            mk.end_line + " , "  +
            mk.end_character  +            
            ")";
            console.log(dbexc);
                this.db.run(dbexc, function (err) {
                    if (err) throw err;
                    console.log("Insert Data Success!");
                });

            this.mkmap.set(mk.id, mk);
        }
    }


    public checkLoadDB() {
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
        }
    }

    deleteDB(id: number) {
        if (this.db)
            this.db.run("delete from " + database.TABLE_NAME + " WHERE id = " + id, function (err) {
                if (err) throw err;
                console.log("Delete Data Success!");
            });
    }

    loadDBIntoMemPromise() {
        return new Promise((resolve, reject) => {
            if (this.db)
                this.db.all("select * from " + database.TABLE_NAME, function (err, rows) {
                    if (err)
                        reject(new Error("array length invalid"));
                    else
                        resolve(rows);
                }
                );
        });
    }
}

