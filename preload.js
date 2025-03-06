// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  send: (channel, data) => {
    const validChannels = [
      "get-posts",
      "get-groups",
      "get-templates",
      "save-post",
      "open-file-dialog",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  on: (channel, func) => {
    const validChannels = [
      "posts",
      "groups",
      "templates",
      "attached-files",
      "selected-files",
      "post-saved",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  removeAllListeners: (channel) => {
    const validChannels = [
      "posts",
      "groups",
      "templates",
      "attached-files",
      "selected-files",
      "post-saved",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  },
});