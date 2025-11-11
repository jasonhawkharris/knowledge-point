import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { isDev } from './utils.js'
import { getDirectoryTree, type FileNode } from './file-system.js'
import { setApiKey, hasApiKey, sendMessage, readFiles } from './ai-client.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null
let importedFilePaths = new Set<string>()
let importedRootPaths: string[] = []

function normalizeFilePath(filePath: string): string {
  return path.resolve(filePath)
}

function collectFilePaths(node: FileNode | null, acc: Set<string>) {
  if (!node) return

  if (node.isDirectory) {
    node.children?.forEach((child) => collectFilePaths(child, acc))
    return
  }

  acc.add(normalizeFilePath(node.path))
}

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js')
  console.log('Creating window...')
  console.log('__dirname:', __dirname)
  console.log('Preload path:', preloadPath)
  console.log('Preload exists:', fs.existsSync(preloadPath))
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })

  const startUrl = isDev()
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../renderer/index.html')}`

  mainWindow.loadURL(startUrl)

  if (isDev()) {
    mainWindow.webContents.openDevTools()
  }

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

// IPC handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  })
  
  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  const dirPath = result.filePaths[0]
  const tree = await getDirectoryTree(dirPath)
  importedFilePaths = new Set<string>()
  importedRootPaths = [normalizeFilePath(dirPath)]
  collectFilePaths(tree, importedFilePaths)
  return tree
})

ipcMain.handle('set-api-key', (_, apiKey: string) => {
  try {
    setApiKey(apiKey)
    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('has-api-key', () => {
  return hasApiKey()
})

ipcMain.handle('send-message', async (_, params: {
  message: string
  selectedFiles: string[]
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
}) => {
  try {
    if (!hasApiKey()) {
      throw new Error('API key not configured')
    }

    const authorizedSelection = params.selectedFiles
      .map((filePath) => normalizeFilePath(filePath))
      .filter((filePath) => importedFilePaths.has(filePath))

    if (authorizedSelection.length !== params.selectedFiles.length) {
      console.warn('Filtered unauthorized file paths from selection')
    }

    const files = await readFiles(authorizedSelection)
    const result = await sendMessage(
      params.message,
      files,
      params.conversationHistory,
      {
        allowedFilePaths: Array.from(importedFilePaths),
        importedRootPaths,
      }
    )
    return { success: true, response: result.text, toolCalls: result.toolCalls }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})
