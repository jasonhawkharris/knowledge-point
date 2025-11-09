const { contextBridge, ipcRenderer } = require('electron')

console.log('Preload script loaded!')

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
    on: (channel: string, listener: (event: any, ...args: any[]) => void) =>
      ipcRenderer.on(channel, listener),
    once: (channel: string, listener: (event: any, ...args: any[]) => void) =>
      ipcRenderer.once(channel, listener),
    removeListener: (channel: string, listener: (event: any, ...args: any[]) => void) =>
      ipcRenderer.removeListener(channel, listener),
  },
})

console.log('Electron API exposed')
