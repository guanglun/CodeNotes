
export class mark {

    public id: number = 0;
    public name: string | undefined;
    public flag: number = 0;
    public file_path: string | undefined;
    public anchor_line: number = 0;
    public anchor_character: number = 0;
    public active_line: number = 0;
    public active_character: number = 0;

    //public static FLAG_SELECT = 0;
    //public static FLAG_CURSOR = 1;

    constructor(id?: number, name?: string, flag?: number, file_path?: string, anchor_line?: number, anchor_character?: number, active_line?: number, active_character?: number) {
        if (id)
            this.id = id;
        if (name)
            this.name = name;
        if (flag)
            this.flag = flag;
        if (file_path)
            this.file_path = file_path;
        if (anchor_line)
            this.anchor_line = anchor_line;
        if (anchor_character)
            this.anchor_character = anchor_character;
        if (active_line)
            this.active_line = active_line;
        if (active_character)
            this.active_character = active_character;

    }
}