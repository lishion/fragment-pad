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


class LevelDb {

    constructor(levelDb) {
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
    put(item, func) {

        if (!item.key) { //如果key不存在，则表示这是一个新增的数据
            this.autoIncrementKey((key) => {
                this.levelDb.put(key, item.value, func) //存入数据库 
            })
            return
        }
        this.levelDb.put(item.key, item.value, func) //存入数据库 
    }

    deleteById(id, func) {
        this.levelDb.del(id, func)
    }

    getLatest(batchNum, maxKey = null, func) {
        var option = { "reverse": true, "limit": batchNum }
        if (maxKey) {
            option["lt"] = maxKey
        }
        this.levelDb.createReadStream(option).on('data', (data) => {
            func(data)
        })
    }
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

LevelDb.instance = null

class MessageBox {
    constructor(context) {
        this.context = context
    }

    failed(msg) {
        this.context.$message({
            message: msg,
            type: 'warning',
        })
    }

    success(msg) {
        this.context.$message({
            message: msg,
            type: 'success',
        })
    }

    showMessage(isSuccess) {
        isSuccess ? this.failed("失败了orz") : this.success("成功啦^^")
    }
}

class UserSetting {
    constructor(store) {
        this.store = store
    }
    getOr(key, value) {
        var storedValue = this.store.get(key)
        return storedValue ? storedValue : value
    }
    getAlphaOr(value) {
        return parseFloat(this.getOr("alpha", value))
    }
    setAlpha(value) {
        this.store.set("alpha", value)
    }
    getBackgroundImageOr(value) {
        return this.getOr("bgImage", value)
    }
    setBackgroundImage(value) {
        this.store.set("bgImage", value)
    }
    setUserBackGroundImage(value) {
        this.store.set("userBg", value)
    }
    getUserBackGroundImage() {
        return this.getOr("userBg", "__user__.jpg")
    }
    static getInstance() {
        if (UserSetting.instance === null) {
            const Store = require('electron-store')
            const store = new Store();
            UserSetting.instance = new UserSetting(store)
        }
        return UserSetting.instance
    }
}

function setLinkRule(mdInstance) {
    var defaultRender = mdInstance.renderer.rules.link_open || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options))
    mdInstance.renderer.rules.link_open = function (tokens, idx, options, env, self) {
        // If you are sure other plugins can't add `target` - drop check below
        var aIndex = tokens[idx].attrIndex('class');
        let url = tokens[idx].attrs[0][1]
        if (aIndex < 0) {
            tokens[idx].attrPush(['class', 'content-url']); // add new attribute
        } else {
            tokens[idx].attrs[aIndex][1] = 'content-url';    // replace value of existing attr
        }
        tokens[idx].attrPush(['my-target',url])
        // pass token to default renderer.
        return defaultRender(tokens, idx, options, env, self);
    };
}
class SmoothPosition{
    constructor(offset,max_acceleration){
        this.position = offset
        this.acceleration = 7
        this.max_acceleration = max_acceleration
    }
    add_acc(value){
        if(this.acceleration <= this.max_acceleration){
            this.acceleration += value
        }   
    }
    up(){
        this.position += this.acceleration
        this.add_acc(2)
        return this.position
    }
    down(){
        this.position -= this.acceleration
        this.add_acc(2)
        return this.position
    }
}

UserSetting.instance = null
export { LevelDb, MessageBox, UserSetting,setLinkRule,SmoothPosition }


