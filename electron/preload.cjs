const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('scribNative', {
    saveFile: (bytes, opts) => ipcRenderer.invoke('scrib:save', bytes, opts),
    openFile: (opts) => ipcRenderer.invoke('scrib:open', opts),
});
