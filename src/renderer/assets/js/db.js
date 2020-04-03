//自增key
//由于leveDB是按照key排序的，所以为了保证显示是按照添加的顺序，所以需要自定义增长策略
//策略为0000000000xxx,xxx是顺序增长的数字，如果数字位数不够，则会填充到length长度
class AutoIncrementID {
    constructor(length = 32) {
        this.length = length
    }

    leftPad(str, length, char) {
        if (length <= str.length) {
            return str
        }
        const strLength = str.length;
        for (let i = 0; i < (length - strLength); i++) {
            str = char + str
        }
        return str
    }

    increase(id) {
        const maybeIntKey = parseInt(id);
        return isNaN(maybeIntKey) ? id : this.leftPad(String(maybeIntKey + 1), this.length, '0')
    }

    firstKey() {
        return this.leftPad("0", this.length, "0")
    }

}

import {Note} from "./model"

class Db {
    put(item, success, error) {
    }

    deleteById(id, func) {
    }

    getLatest(batchNum, maxKey = null, func, err) {
    }

    search(keyword, func) {
    }

    static getInstance() {
    }

    replaceMany(string, keywords, replaceFunc) {
        let pattern;
        if (keywords.indexOf(" ") !== -1) {
            let eachKeyword = keywords.split(" ");
            eachKeyword = eachKeyword.map((item, index, input) => {
                return `(${item})`
            });
            pattern = RegExp(eachKeyword.join("|"), 'ig')
        } else {
            pattern = RegExp(keywords, 'ig')
        }
        return string.replace(pattern, replaceFunc)
    }

    highlightText(text) {
        return `<span style='background:yellow'>${text}</span>`;
    }

    highlightNote(note, keywords) {
        note.rendered_title = this.replaceMany(note.title, keywords, this.highlightText);
        note.rendered_content = this.replaceMany(note.rendered_content, keywords, this.highlightText);
        return note;
    }

}

class LevelDb extends Db {

    constructor(levelDb) {
        super();
        this.levelDb = levelDb;
        this.ID = new AutoIncrementID(32)
    }

    static getInstance() {
        if (LevelDb.instance == null) {
            const levelup = require('levelup');
            const leveldown = require('leveldown');
            const encode = require('encoding-down');
            const path = require('path');
            const dbPath = path.join(__dirname, '../../../../mydb');
            const db = levelup(encode(leveldown(dbPath), {valueEncoding: 'json'}));
            LevelDb.instance = new LevelDb(db)

        }
        return LevelDb.instance
    }

    autoIncrementId(func) {
        let latestId = null;
        this.levelDb.createKeyStream({"reverse": true, "limit": 1})   //如果是按照自定义顺序，那么reverse之后第一个一定是最大的key
            .on('data', (id) => {
                latestId = id
            }).on('end', () => {
            if (latestId === null) { //如果数据库为空，则需要放入第一个key作为初始化
                func(this.ID.firstKey())
            } else {
                func(this.ID.increase(latestId)) // 否则对现在最大的key进行自增
            }
        })
    }

    put(note, success, error) {
        const callback = (note, err) => {
            err ? error("保存失败") : success(note)
        };
        if (!note.id) { //如果 id 不存在，则表示这是一个新增的数据
            this.autoIncrementId((id) => {
                note.id = id;
                this.levelDb.put(note.id, note, err => callback(note, err)) //存入数据库
            });
        } else {
            this.levelDb.put(note.id, note, err => callback(note, err)) //存入数据库
        }
    }

    deleteById(id, func) {
        this.levelDb.del(id, func)
    }

    getLatest(batchNum, latestId = null, func, err) {
        const queryOption = {"reverse": true, "limit": batchNum};
        if (latestId) {
            queryOption["lt"] = latestId
        }
        this.levelDb.createReadStream(queryOption).on('data', (note) => {
            func(Note.fromLevelDBRecord(note))
        })
    }

    search(keywords, func) {
        const queryOption = {"reverse": true, "limit": -1};
        this.levelDb.createReadStream(queryOption).on('data', (note) => {
            const highlightedNote = this.highlightNote(Note.fromLevelDBRecord(note), keywords)
            func(highlightedNote)
        })
    }
}

LevelDb.instance = LevelDb.instance || null;

import Client from "./client"

class MySQLDb extends Db {
    constructor() {
        super();
        this.client = Client.getInstance()
    }

    getLatest(batchNum, maxKey = null, success, err) {
        const latestKey = maxKey || 0;
        this.client.get(`note?latest=${latestKey}`)
            .then((notes) => {
                Array.from(notes).forEach(note => success(Note.fromMySQLRecord(note)))
            })
            .catch(err)
    }

    searchMatch(keyword, func) {
        this.client.get(`note?keyword=${keyword}`)
            .then((notes) => {
                for (const note of notes) {
                    Array.from(notes).forEach(note => func(Note.fromMySQLRecord(note)))
                }
            }).catch(message => console.error(`搜索时出现${message}`))
    }

    put(note, success, err) {
        if (!note.id) {
            note = {...note}
            delete note.id
        }
        this.client.post("note", note)
            .then(success)
            .catch(err)
    }

    deleteById(id, func) {
        this.client.delete("note", {"id": id})
            .then(() => func(null))
            .catch(func)
    }

    search(keywords, func) {
        this.searchMatch(keywords, (note) => {
            const highlightNote = this.highlightNote(note, keywords)
            func(highlightNote)
        })
    }

    static getInstance() {
        if (!MySQLDb.instance) {
            MySQLDb.instance = new MySQLDb()
        }
        return MySQLDb.instance
    }
}

MySQLDb.instance = MySQLDb.instance || null;

import {UserSetting} from "./utils"

class DBTool {
    getDbInstance() {
        const dbType = this.getDbType();
        return this.dbFactory(dbType)
    }

    dbFactory(dbType) {
        if (dbType === "local") {
            return LevelDb.getInstance()
        } else if (dbType === "remote") {
            return MySQLDb.getInstance()
        }
        return LevelDb.getInstance()
    }

    get remoteDb() {
        return MySQLDb.getInstance()
    }

    get localDb() {
        return LevelDb.getInstance()
    }

    getDbType() {
        return UserSetting.getInstance().getDbType()
    }

    get instance() {
        return this.getDbInstance()
    }
}

const db = new DBTool();
export default db