import { app, BrowserWindow } from 'electron'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
var path = require('path')
var ipcMain = require('electron').ipcMain

const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080/#/index`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  var ratio = 1920/1080.0
  var height = 600
  var width = parseInt(height * ratio)
  mainWindow = new BrowserWindow({
    height: 600,
    useContentSize: true,
    width: width,
    minWidth:width,
    minHeight:height,
    frame: false,
    resizable:false,
    icon:path.join(__dirname, '../renderer/assets/icons/32X32.png')
    
  })
  mainWindow.webContents.closeDevTools() //取消自动显示工具栏
  mainWindow.setMenu(null) //取消菜单栏
  mainWindow.loadURL(winURL)
  console.info(app.getPath("userData"))
  mainWindow.on('closed', () => {
    mainWindow = null
  })
   
}

app.on('ready', ()=>{
  createWindow()
  var globalShortcut = require('electron').globalShortcut
  globalShortcut.register('Esc', () => {
     if(mainWindow.isFocused()){
      let contents = mainWindow.webContents
      contents.send('cancel')
     }
  })
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

const {shell} = require('electron')

//当用户点击了内容的中的连接，需要主动调用浏览器，否则会自动打开一个electron窗口
//事件来自于 `info-card.vue`
ipcMain.on('click-content-url',(event,target)=>{
  shell.openExternal(target.startsWith("http://") ? target : `http://${target}`)
})