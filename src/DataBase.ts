import * as vscode from 'vscode';
import * as sqlite3 from 'sqlite3';
import * as fs from 'fs';
import * as mark from './Mark';
import * as Sidebar from './sidebar/Sidebar';
import * as markmanager from './MarkManager';
import * as path from 'path';
import * as util from 'util';
export class DataBase {

    public static databasePath = ".codenotes";
    private static tableName = "marks";
    private static creatTable =
        "CREATE TABLE " + DataBase.tableName + " (\
        id   INTEGER PRIMARY KEY\
                     UNIQUE,\
        name VARCHAR,\
        flag INTEGER,\
        relativePath VARCHAR,\
        anchor_line INTEGER,\
        anchor_character INTEGER,\
        active_line INTEGER,\
        active_character INTEGER,\
        start_line INTEGER,\
        start_character INTEGER,\
        end_line INTEGER,\
        end_character INTEGER, \
        color VARCHAR, \
        jumpLink VARCHAR, \
        description VARCHAR\
        );";

    public mkmap: Map<number, mark.Mark> = new Map<number, mark.Mark>();

    public mkmapDefault: Map<number, mark.Mark> = new Map<number, mark.Mark>();
    public mkmapLine: Map<number, mark.Mark> = new Map<number, mark.Mark>();
    public mkmapFunction: Map<number, mark.Mark> = new Map<number, mark.Mark>();


    public context: vscode.ExtensionContext;
    private sidebar: Sidebar.Sidebar | undefined;

    public isDBInit = false;
    private db: sqlite3.Database | undefined;
    private mm: markmanager.MarkManager | undefined;
    public lastId = 0;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public init(sidebar: Sidebar.Sidebar, mm: markmanager.MarkManager) {
        this.sidebar = sidebar;
        this.mm = mm;
    }

    /**
    * 读取路径信息
    * @param {string} filepath 路径
    */
    public static creatPromise(path: string) {
        return new Promise((resolve, reject) => {
            fs.stat(path, function (err, result) {
                if (err) {
                    fs.mkdir(path, function (err) {
                        if (err) { resolve(false); }
                        else { resolve(true); }
                    });
                } else {
                    resolve(true);
                }
            });
        });
    }

    public static existPromise(path: string) {

        return new Promise((resolve, reject) => {
            fs.stat(path, function (err, result) {
                if (err) { resolve(false); }
                else { resolve(true); }
            });
        });
    }

    public mkmapSet(mk: mark.Mark) {
        this.mkmap.set(mk.id, mk);
        if (mk.flag === mark.Mark.FLAG_DEFAULT) {
            this.mkmapDefault.set(mk.id, mk);
        } else if (mk.flag === mark.Mark.FLAG_LINE) {
            this.mkmapLine.set(mk.id, mk);
        } else if (mk.flag === mark.Mark.FLAG_FUNCTION) {
            this.mkmapFunction.set(mk.id, mk);
        }
    }

    public mkmapClear() {
        this.mkmap.clear();
        this.mkmapDefault.clear();
        this.mkmapLine.clear();
        this.mkmapFunction.clear();
    }

    public mkmapDelete(id: number) {
        this.mkmap.delete(id);
        this.mkmapDefault.delete(id);
        this.mkmapLine.delete(id);
        this.mkmapFunction.delete(id);
    }

    /**
     * 加载数据库内容
     */
    public loadDB() {
        const promise = this.loadDBIntoMemPromise();
        promise.then((res: any) => {
            //console.log(res);
            if (res.length) {
                this.mkmapClear();
                for (let i = 0; i < res.length; i++) {
                    const mk = new mark.Mark(
                        res[i].id,
                        res[i].name,
                        res[i].flag,
                        res[i].relativePath,
                        res[i].anchor_line,
                        res[i].anchor_character,
                        res[i].active_line,
                        res[i].active_character,

                        res[i].start_line,
                        res[i].start_character,
                        res[i].end_line,
                        res[i].end_character,
                        res[i].color,
                        res[i].jumpLink,
                        res[i].description,
                    );
                    this.mkmapSet(mk);

                    this.sidebar?.elAll?.insert(mk);
                }
                this.lastId = res[res.length - 1].id;

                this.sidebar?.elAll?.refresh();

                this.mm?.reloadNowItem();
                this.mm?.teColorManager(markmanager.TEColorManagerType.tecmtInit);
            }
        });
    }


    /**
     * 创建数据库
     */
    public createTable() {

        new Promise((resolve, reject) => {
            this.db?.run(DataBase.creatTable, function (err) {
                if (err) {
                    vscode.window.showErrorMessage(err.toString());
                    console.error(err);
                }
                else {
                    resolve(true);
                }

            });
        }).then((res: any) => {
            this.sidebar?.sweb?.webShowMenu();
        });
    }

    /**
     * debug 显示数据库内容
     */
    public showDB() {
        if (this.db) {
            this.db.all("select * from " + DataBase.tableName, function (err, rows) {
                if (err) {
                    vscode.window.showErrorMessage(err.toString());
                    console.error(err);
                }
                else {
                    console.log(rows);
                    rows[0].id;
                }
            });
        }

    }

    /**
     * 更新Name
     * @param id 
     * @param name 
     */
    public updateName(id: number, name: string) {

        this.db?.run("update " + DataBase.tableName + " set name = '" + name + "' WHERE id = " + id, function (err) {
            if (err) {
                vscode.window.showErrorMessage(err.toString());
                console.error(err);
            }
        });
    }

    public updateJumpLink(id: number, jb: string) {

        this.db?.run("update " + DataBase.tableName + " set jumpLink = '" + jb + "' WHERE id = " + id, function (err) {
            if (err) {
                vscode.window.showErrorMessage(err.toString());
                console.error(err);
            }
        });
    }

    /**
     * 更新颜色
     * @param id 
     * @param color 
     */
    public updateColor(id: number, color: string) {

        this.db?.run("update " + DataBase.tableName + " set color = '" + color + "' WHERE id = " + id, function (err) {
            if (err) {
                vscode.window.showErrorMessage(err.toString());
                console.error(err);
            }
        });
    }

    /**
     * 更新描述
     * @param id 
     * @param description 
     */
    public updateDescription(id: number, description: string) {

        this.db?.run("update " + DataBase.tableName + " set description = '" + description + "' WHERE id = " + id, function (err) {
            if (err) {
                vscode.window.showErrorMessage(err.toString());
                console.error(err);
            }
        });
    }

    /**
     * 更新mark数据的range至数据库
     * @param mk 
     */
    public async updateRange(mk: mark.Mark) {

        await this.db?.run("update " + DataBase.tableName +
            " set start_line = " + mk.startLine +
            ", start_character = " + mk.startCharacter +
            ", end_line = " + mk.endLine +
            ", end_character = " + mk.endCharacter +
            " WHERE id = " + mk.id, function (err) {
                if (err) {
                    vscode.window.showErrorMessage(err.toString());
                    console.error(err);
                }
            });
    }



    /**
     * 检查数据库状态
     */
    public async checkLoadDB() {
        
        if (vscode.workspace.workspaceFolders) {

            const codenotesPath = <string>vscode.workspace.getConfiguration().get('CodeNotes.codenotesPath');
            if(codenotesPath)
            {
                DataBase.databasePath = codenotesPath;
            }

            var rootUri = vscode.workspace.workspaceFolders[0].uri;
            const pathDB =path.join(rootUri.fsPath,DataBase.databasePath,"notes.db");
            vscode.window.setStatusBarMessage("database path: " + pathDB);
            const ret = await util.promisify(fs.exists)(pathDB); 

            if(ret)
            {
                this.db = await new sqlite3.Database(pathDB);
                if(this.db)
                {
                    this.loadDB();
                    this.isDBInit = true;
                    this.sidebar?.sweb?.webShowMenu();
                }else{
                    vscode.window.showErrorMessage("database load error");
                }
            }
        }
    }

    /**
     * 创建初始化数据库
     */
    public creatCodeNotes() {
        if (vscode.workspace.workspaceFolders && this.isDBInit === false) {

            var rootUri = vscode.workspace.workspaceFolders[0].uri;
            var folderUri = vscode.Uri.file(rootUri.fsPath + "/" + DataBase.databasePath);

            const promise = DataBase.creatPromise(folderUri.fsPath);
            promise.then((res: any) => {

                new Promise((resolve, reject) => {
                    this.db = new sqlite3.Database(folderUri.fsPath + "/notes.db", function (err) {
                        if (err) {
                            vscode.window.showErrorMessage(err.toString());
                            console.error(err);
                        }
                        else { resolve(true); }
                    });
                }).then((res: any) => {
                    this.createTable();
                    this.isDBInit = true;
                });
            });
        }
    }

    public async insertDB(mk: mark.Mark): Promise<boolean> {

        if (this.db) {
            const dbexc = "insert into " + DataBase.tableName + " values ( " +
                mk.id + " , " +
                "\"" + mk.name + "\" , " +
                mk.flag + " , " +
                "\"" + mk.relativePath + "\" , " +

                mk.anchorLine + " , " +
                mk.anchorCharacter + " , " +
                mk.activeLine + " , " +
                mk.activeCharacter + " , " +

                mk.startLine + " , " +
                mk.startCharacter + " , " +
                mk.endLine + " , " +
                mk.endCharacter + " , " +
                "\"" + mk.color + "\" , " +
                "\"" + mk.jumpLink + "\" , " +
                "\"" + mk.description + "\"" +
                ")";

            await this.db.run(dbexc, function (err) {
                if (err) {
                    vscode.window.showErrorMessage(err.toString());
                    console.error(err);
                    return false;
                }
            });
            return true;
        }
        return false;

    }

    /**
     * 插入一行Promise
     * @param mk 
     * @returns 
     */
    public loadInsertDBPromise(mk: mark.Mark) {
        return new Promise((resolve, reject) => {
            if (this.db) {
                const dbexc = "insert into " + DataBase.tableName + " values ( " +
                    mk.id + " , " +
                    "\"" + mk.name + "\" , " +
                    mk.flag + " , " +
                    "\"" + mk.relativePath + "\" , " +

                    mk.anchorLine + " , " +
                    mk.anchorCharacter + " , " +
                    mk.activeLine + " , " +
                    mk.activeCharacter + " , " +

                    mk.startLine + " , " +
                    mk.startCharacter + " , " +
                    mk.endLine + " , " +
                    mk.endCharacter + " , " +
                    "\"" + mk.color + "\" , " +
                    "\"" + mk.jumpLink + "\" , " +
                    "\"" + mk.description + "\"" +
                    ")";

                this.db.run(dbexc, function (err) {
                    if (err) {
                        vscode.window.showErrorMessage(err.toString());
                        console.error(err);
                    }
                    else { resolve(undefined); }
                });
            }
        });
    }

    /**
     * 删除一组数据
     * @param id 
     * @returns 
     */
    public loadDeleteDBPromise(id: number) {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.run("delete from " + DataBase.tableName + " WHERE id = " + id, function (err) {
                    if (err) {
                        vscode.window.showErrorMessage(err.toString());
                        console.error(err);
                    }
                    else { resolve(undefined); }
                });
            }
        });
    }

    /**
     * 加载数据库内容
     * @returns 
     */
    loadDBIntoMemPromise() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.all("select * from " + DataBase.tableName, function (err, rows) {
                    if (err) {
                        vscode.window.showErrorMessage(err.toString());
                        console.error(err);
                    }
                    else { resolve(rows); }
                });
            }
        });
    }

}

