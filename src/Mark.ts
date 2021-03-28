
export class mark {

    public id:number = 0;
    public name:string | undefined;

    constructor(id?: number,name?: string) {
        if(id)
            this.id = id;
        if(name)
            this.name = name;
    }
}