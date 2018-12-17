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
const dialog = require('electron').dialog
var fs = require('fs');

const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080/#/index`
  : `file://${__dirname}/index.html`

function copyFile(src, dist) {
  fs.createReadStream(src).pipe(fs.createWriteStream(dist));
}

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
  shell.openExternal(target.startsWith("http://")||target.startsWith("https://") ? target : `http://${target}`)
})

ipcMain.on('open-file-dialog', function (event) {
  dialog.showOpenDialog({
    properties: ['openFile']
  }, function (files) {
    let file = files[0]
    let ext = path.extname(file)
    copyFile(files[0],path.join(__dirname, `../renderer/assets/bg/__user__${ext}`))
    if (files) event.sender.send('selected-directory', `../renderer/assets/bg/__user__${ext}`)
  })
})