const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  send: (channel, data) => {
    console.log(`[Preload] Отправка через канал: ${channel}, данные: ${JSON.stringify(data)}`);
    const validChannels = [
      "open-file-dialog",
      "get-groups",
      "save-group",
      "get-posts",
      "save-post",
      "get-attached-files",
      "get-templates",
      "save-template",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    } else {
      console.error(`[Preload] Канал ${channel} не разрешен`);
    }
  },
  on: (channel, func) => {
    console.log(`[Preload] Регистрация слушателя для канала: ${channel}`);
    const validChannels = [
      "selected-files",
      "groups",
      "posts",
      "attached-files",
      "templates",
      "post-saved",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    } else {
      console.error(`[Preload] Канал ${channel} не разрешен для слушателя`);
    }
  },
  removeAllListeners: (channel) => {
    console.log(`[Preload] Удаление слушателей для канала: ${channel}`);
    const validChannels = [
      "selected-files",
      "groups",
      "posts",
      "attached-files",
      "templates",
      "post-saved",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    } else {
      console.error(`[Preload] Канал ${channel} не разрешен для удаления слушателей`);
    }
  },
});

console.log("[Preload] preload.js загружен, electronAPI доступен");