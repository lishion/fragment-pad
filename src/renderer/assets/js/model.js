export class Note {
    constructor(id, title, raw_content, rendered_content) {
        this.id = null;
        this.title = title;
        this.rendered_title = "";
        this.raw_content = raw_content;
        this.rendered_content = rendered_content;
        this.editing = true;
    }
    static emptyNote(){
        return new Note(null, "", "", "");
    }
    static fromLevelDBRecord(levelDBRecord){
        const note = {...levelDBRecord.value};
        note.editing = false;
        return note;
    }
    static fromMySQLRecord(mySQLRecord){
        mySQLRecord.editing = false;
        return mySQLRecord;
    }
    static clean(note){
        const copyOfThis = {...note};
        delete copyOfThis.rendered_title;
        delete copyOfThis.editing;
        return copyOfThis;
    }

}