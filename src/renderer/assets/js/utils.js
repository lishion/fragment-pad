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
    info(msg){
        this.context.$message({"message": msg});
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
    setDbType(type){
        this.store.set("dbType",type)
    }
    getDbType(){
        return this.getOr("dbType","local")
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
export {MessageBox, UserSetting,setLinkRule,SmoothPosition }


