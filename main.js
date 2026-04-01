import { app, BrowserWindow } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isDev = process.env.NODE_ENV === 'development'

// === 加载环境变量（必须指明路径才能在打包后的 asar 中正常读取） ===
import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, '.env') })

// === 核心数据隔离：设置安全写入路径 ===
// 让 server.js 知道自己是在被打包后的安全环境里启动的
process.env.STORAGE_PATH = app.getPath('userData')

// === 唤起原有的后端 Express ===
import('./server.js')
  .then(() => console.log('✅ 底层系统 [server.js] 挂载成功。'))
  .catch(err => console.error('❌ 底层系统挂载失败:', err))

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    titleBarStyle: 'hiddenInset', // 类似原生 Mac 软件一样的体验
    backgroundColor: '#0B0F19', // 全局防闪烁底色
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  if (isDev) {
    // 调试模式下直接读外部 Vite
    win.loadURL('http://localhost:5173')
  } else {
    // 生产模式下读构建出来的精简体
    win.loadFile(path.join(__dirname, 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
