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
      "get-attached-files",
    ];
    console.log("[Preload] Отправка через канал:", channel, "данные:", data);
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    } else {
      console.warn("[Preload] Канал не разрешён для отправки:", channel);
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
    console.log("[Preload] Регистрация слушателя для канала:", channel);
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
      ipcRenderer.on(channel, (event, ...args) => {
        console.log("[Preload] Получено сообщение через канал:", channel, "данные:", args);
        func(...args);
      });
    } else {
      console.warn("[Preload] Канал не разрешён для слушателя:", channel);
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
    console.log("[Preload] Удаление слушателей для канала:", channel);
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    } else {
      console.warn("[Preload] Канал не разрешён для удаления слушателей:", channel);
    }
  },
});