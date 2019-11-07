import { app, BrowserWindow } from 'electron'
import { APOLLO_DEVELOPER_TOOLS } from 'electron-devtools-installer';

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
var path = require('path')
const {dialog, ipcMain} = require('electron')
let fs = require('fs');

const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080/#/index`
  : `file://${__dirname}/index.html`

function copyFile(src, dst,callback) {
  if(fs.existsSync(dst)){
    fs.unlink(dst,(err)=>{
      fs.writeFileSync(dst,fs.readFileSync(src))
      callback(err)
    })
  }else{
    fs.writeFileSync(dst,fs.readFileSync(src))
    callback()
  }
}

function createWindow () {
  /**
   * Initial window options
   */
  var ratio = 1920/1080.0
  var height = 600
  var width = parseInt(height * ratio)
  require('../renderer/assets/icons/icon.png');
  let iconPath = process.env.NODE_ENV === 'development' ? "../renderer/assets/icons/icon.png" : "imgs/icon--icons.png" 
  mainWindow = new BrowserWindow({
    height: 600,
    useContentSize: true,
    width: width,
    minWidth:width,
    minHeight:height,
    frame: false,
    resizable:false,
    icon:path.join(__dirname,iconPath),
    webPreferences: {webSecurity: false}
  })
  mainWindow.webContents.closeDevTools() //取消自动显示工具栏
  mainWindow.setMenu(null) //取消菜单栏
  mainWindow.loadURL(winURL)
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault()
    // const win = new BrowserWindow({show: false})
    // win.once('ready-to-show', () => win.show())
    // win.loadURL(url)
    // event.newGuest = win
  })
   
}

app.on('ready', ()=>{
  createWindow()
  try{
    var globalShortcut = require('electron').globalShortcut
    globalShortcut.register('Esc', () => {
       if(mainWindow.isFocused()){
        let contents = mainWindow.webContents
        contents.send('cancel')
       }
    })
  }catch(e){
    
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})


app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

const isSecondInstance = app.makeSingleInstance((commandLine, workingDirectory) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

if (isSecondInstance) {
  app.quit()
}

//接收到最小化事件
ipcMain.on('minimize',()=>{
  mainWindow.minimize()
})

try{
  const {shell} = require('electron')
  //当用户点击了内容的中的连接，需要主动调用浏览器，否则会自动打开一个electron窗口
  //事件来自于 `info-card.vue`
  ipcMain.on('click-content-url',(event,target)=>{
    shell.openExternal(target.startsWith("http://")||target.startsWith("https://") ? target : `http://${target}`)
  })
}catch(e){
  app.quit()
}


ipcMain.on('open-file-dialog', function (event) {
  dialog.showOpenDialog({
    properties: ['openFile']
  }, function (files) {
    if(!files){
      event.sender.send('selected-directory', "$cancel-by-user$")
      return
    }
    let file = files[0]
    /**
     * 目前动态替换 pack 后的文件有一个缺点
     * 所有被替换的文件之前必须被pack 
     * 即在 build 之前如果该文件不存在，就算之后被拷贝到项目下，使用 require() 也无法获得
     * 因此所有图片拷贝到项目下之后都将改名为 user.jpg
    */
    let filePath = process.env.NODE_ENV === "development" ? `../renderer/assets/bg/user.jpg` : `imgs/user--bg.jpg`
    copyFile(files[0],path.join(__dirname, filePath),()=>{
      event.sender.send('selected-directory', ".jpg")
    })
  })
})

ipcMain.on('on-bg-set',()=>{
  if(process.env.NODE_ENV !== "development"){
    app.relaunch()
    app.exit(0)
  }
})

ipcMain.on('open-console',()=>{
  mainWindow.webContents.openDevTools()
})

ipcMain.on('get-copy-text', (event, target)=>{
    const { clipboard } = require("electron")
    event.returnValue = clipboard.readText()
})