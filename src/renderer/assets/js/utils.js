import { normalize } from 'path';

class LevelDb{
    
    constructor(levelDb){
        this.levelDb = levelDb
    }

    static getInstance(){
        if(LevelDb.instance == null){
            var levelup = require('levelup')
            var leveldown = require('leveldown')
            var encode = require('encoding-down')
            var db = levelup(encode(leveldown('./mydb'),{ valueEncoding: 'json' }))
            LevelDb.instance = new LevelDb(db)
        }
        return LevelDb.instance
    }
    
    put(item,func){
        this.levelDb.put(item.key,item.value,func)
    }

    deleteById(id,func){
        this.levelDb.del(id,func)
    }
    
    getLatest(batchNum,latestKey=null,func){
     
        var option = {"reverse":true,"limit":batchNum}
        if(latestKey){
            option["lt"] = latestKey
        }
        this.levelDb.createReadStream(option).on('data',(data)=>{
            func(data)
        })
    }
    replaceMany(string,keywords,replaceFunc){
        var pattern
        if(keywords.indexOf(" ")!=-1){
            var eachKeyword = keywords.split(" ")
            eachKeyword = eachKeyword.map((item,index,input)=>{
                return `(${item})`
            })
            pattern = RegExp(eachKeyword.join("|"),'ig')
        }else{
            pattern = RegExp(keywords,'ig')
        }
    
        return string.replace(pattern,replaceFunc)
    }
    search(keywords,func){
        var option = {"reverse":true,"limit":-1}
        const renderHighlight = word => `<span style='background:yellow'>${word}</span>`
        this.levelDb.createReadStream(option).on('data',(data)=>{
            var title = data.value.title
            var marked_content = data.value.marked_content
            var replacedTitle = this.replaceMany(title,keywords,renderHighlight)
            var replacedContent = this.replaceMany(marked_content,keywords,renderHighlight)
            if(replacedContent!==marked_content||replacedTitle!==title){
                data.value.rendered_title = replacedTitle
                data.value.marked_content = replacedContent
                func(data)
            } 
             
        })
    }
}

LevelDb.instance = null

class MessageBox{
    constructor(context){
        this.context = context
    }

    failed(msg){
        this.context.$message({
            message:msg,
            type:'warning',
        })
    }
    
    success(msg){
        this.context.$message({
            message:msg,
            type:'success',
        })
    }

    showMessage(isSuccess){
        isSuccess ? this.failed("失败了orz") : this.success("成功啦^^")
    }
}

class UserSetting{
    constructor(store){
        this.store = store
    }
    getOr(key,value){
        var storedValue = this.store.get(key)
        return storedValue?storedValue:value
    }
    getAlphaOr(value){
        return parseFloat(this.getOr("alpha",value))
    }
    setAlpha(value){
        this.store.set("alpha",value)
    }
    getBackgroundImageOr(value){
        return this.getOr("bgImage",value)
    }
    setBackgroundImage(value){
        this.store.set("bgImage",value)
    }
    static getInstance(){
        if(UserSetting.instance===null){
            const Store = require('electron-store')
            const store = new Store();
            UserSetting.instance = new UserSetting(store)
        }
        return UserSetting.instance
    }
}   
UserSetting.instance = null
export { LevelDb,MessageBox,UserSetting}


