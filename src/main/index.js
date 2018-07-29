import { app, BrowserWindow } from 'electron'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
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
    resizable:false
  })
  mainWindow.webContents.closeDevTools() //取消自动显示工具栏
  mainWindow.setMenu(null) //取消菜单栏
  mainWindow.loadURL(winURL)
  console.info(app.getPath("userData"))
  mainWindow.on('closed', () => {
    mainWindow = null
  })
   
}

app.on('ready', createWindow)

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
