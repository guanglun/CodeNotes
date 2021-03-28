
export class mark {

    public id: number = 0;
    public name: string | undefined;
    public flag: number = 0;
    public file_path: string | undefined;
    public start_line: number = 0;
    public start: number = 0;
    public end_line: number = 0;
    public end: number = 0;

    public static FLAG_SELECT = 0;
    public static FLAG_CURSOR = 1;



    constructor(id?: number, name?: string, flag?: number, file_path?: string, start_line?: number, start?: number, end_line?: number, end?: number) {
        if (id)
            this.id = id;
        if (name)
            this.name = name;
        if (flag)
            this.flag = flag;
        if (file_path)
            this.file_path = file_path;
        if (start_line)
            this.start_line = start_line;
        if (start)
            this.start = start;
        if (start)
            this.start = start;
        if (end_line)
            this.end_line = end_line;
        if (end)
            this.end = end;
    }
}