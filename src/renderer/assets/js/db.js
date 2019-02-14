
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
        var strLength = str.length
        for (var i = 0; i < (length - strLength); i++) {
            str = char + str
        }
        return str
    }
    gen(maxKey) {
        var maybeIntKey = parseInt(maxKey)
        return isNaN(maybeIntKey) ? maxKey : this.leftPad(String(maybeIntKey + 1), this.length, '0')
    }
    firstKey() {
        return this.leftPad("0", this.length, "0")
    }
    
}


class Db{
    put(item, success, error){}
    deleteById(id,func){}
    getLatest(batchNum, maxKey = null, func,err){}
    search(keyword, func){}
    static getInstance(){}
    replaceMany(string, keywords, replaceFunc) {
        var pattern
        if (keywords.indexOf(" ") != -1) {
            var eachKeyword = keywords.split(" ")
            eachKeyword = eachKeyword.map((item, index, input) => {
                return `(${item})`
            })
            pattern = RegExp(eachKeyword.join("|"), 'ig')
        } else {
            pattern = RegExp(keywords, 'ig')
        }
        return string.replace(pattern, replaceFunc)
    }
} 

class LevelDb extends Db {

    constructor(levelDb) {
        super()
        this.levelDb = levelDb
        this.ID = new AutoIncrementID(32)
    }

    static getInstance() {
        if (LevelDb.instance == null) {
            var levelup = require('levelup')
            var leveldown = require('leveldown')
            var encode = require('encoding-down')
            var path = require('path')
            var dbPath = path.join(__dirname, '../../../../mydb')
            var db = levelup(encode(leveldown(dbPath), { valueEncoding: 'json' }))
            console.info(LevelDb.instance)
            LevelDb.instance = new LevelDb(db)
           
        }
        return LevelDb.instance
    }

    autoIncrementKey(func) {
        var maxKey = null
        this.levelDb.createKeyStream({ "reverse": true, "limit": 1 })   //如果是按照自定义顺序，那么reverse之后第一个一定是最大的key
            .on('data', (data) => {
                maxKey = data
            }).on('end', () => {
                if (maxKey === null) { //如果数据库为空，则需要放入第一个key作为初始化
                    func(this.ID.firstKey())
                } else {
                    func(this.ID.gen(maxKey)) // 否则对现在最大的key进行自增
                }
            })
    }

    put(item, success, error) {
        const callback = (key, value, err) => err ?  error("同步失败") : success({key:key, value:value})
        if (!item.key) { //如果key不存在，则表示这是一个新增的数据
            this.autoIncrementKey((key) => {
                this.levelDb.put(key, item.value, err => callback(key, item.value, err)) //存入数据库 
            })
            return
        }
        this.levelDb.put(item.key, item.value, err => callback(item.key, item.value, err)) //存入数据库 
    }

    deleteById(id, func) {
        this.levelDb.del(id, func)
    }

    getLatest(batchNum, maxKey = null, func,err) {
        var option = { "reverse": true, "limit": batchNum }
        if (maxKey) {
            option["lt"] = maxKey
        }
        this.levelDb.createReadStream(option).on('data', (data) => {
            func(data)
        })
    }
    
    search(keywords, func) {
        var option = { "reverse": true, "limit": -1 }
        const renderHighlight = word => `<span style='background:yellow'>${word}</span>`
        this.levelDb.createReadStream(option).on('data', (data) => {
            var title = data.value.title
            var marked_content = data.value.marked_content
            var replacedTitle = this.replaceMany(title, keywords, renderHighlight)
            var replacedContent = this.replaceMany(marked_content, keywords, renderHighlight)
            if (replacedContent !== marked_content || replacedTitle !== title) {
                data.value.rendered_title = replacedTitle
                data.value.marked_content = replacedContent
                func(data)
            }

        })
    }
}

LevelDb.instance = LevelDb.instance || null

import Sender from "./sender"

class MySQLDb extends Db {
    constructor(){
        super()
        this.sender = Sender.getInstance()
    }
    getLatest(batchNum, maxKey = null, success,err) {
        const latestKey = maxKey || 0
        this.sender.get(`note?latest=${latestKey}`)
        .then((data)=>{
            for(const item of data){
                success({key:item.key,value:item})
            }
        })
        .catch(err)
    }
    searchMatch(keyword,func){
        this.sender.get(`note?keyword=${keyword}`)
        .then((data)=>{
            for(const item of data){
                func({key:item.key,value:item})
            }
        })
    }
    put(item, success, err) {
        const data = item.value
        const key = item.key
        if(key){
            data["key"] = key
        }
        this.sender.post("note",data)
        .then(response => success(response && {key:response["key"],value:response}))
        .catch(err)
    }

    deleteById(id, func) {
        this.sender.delete("note",{"key":id})
        .then(()=>func(null))
        .catch(func)
    }

    search(keywords, func) {
        const renderHighlight = word => `<span style='background:yellow'>${word}</span>`
        this.searchMatch(keywords,(data)=>{
            var title = data.value.title
            var marked_content = data.value.marked_content
            var replacedTitle = this.replaceMany(title, keywords, renderHighlight)
            var replacedContent = this.replaceMany(marked_content, keywords, renderHighlight)
            if (replacedContent !== marked_content || replacedTitle !== title) {
                data.value.rendered_title = replacedTitle
                data.value.marked_content = replacedContent
                func(data)
            }
        })
    }
    
    static getInstance(){
        if(!MySQLDb.instance){
            MySQLDb.instance = new MySQLDb()
        }
        return MySQLDb.instance
    }
}

MySQLDb.instance = MySQLDb.instance || null

import {UserSetting} from "./utils"

class DBTool{
    getDbInstance(){
        const dbType = this.getDbType()
        return this.dbFactory(dbType)
    }
    dbFactory(dbType){
        if(dbType === "local"){
            return LevelDb.getInstance()
        }else if(dbType === "remote"){
            return MySQLDb.getInstance()
        }
        return LevelDb.getInstance()
    }
    get remoteDb(){
        return MySQLDb.getInstance()
    }
    get localDb(){
        return LevelDb.getInstance()
    }
    getDbType(){
        return UserSetting.getInstance().getDbType()
    }
    get instance(){
        return this.getDbInstance()
    }
}

const db = new DBTool()
export default db