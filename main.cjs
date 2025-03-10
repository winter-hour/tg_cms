// main.cjs
const { app, BrowserWindow, ipcMain, session, dialog } = require("electron");
const path = require("path");
const {
  db,
  initDB,
  getGroups,
  saveGroup,
  getPosts,
  savePost,
  saveAttachedFile,
  getAttachedFiles,
  getTemplates,
  saveTemplate,
  savePostTemplateLink,
} = require("./src/db/initDB.cjs");

// Функция для вывода только ID постов
const logPostIds = (posts) => {
  if (!posts || posts.length === 0) return "[]";
  return `[${posts.map((post) => post.id).join(", ")}]`;
};

// Регистрация IPC-обработчиков
const handleIPC = (channel, handler) => {
  console.log(`[main.cjs] Регистрация обработчика для канала: ${channel}`);
  ipcMain.on(channel, (event, ...args) => {
    console.log(`[main.cjs] Получено сообщение через канал ${channel}, аргументы:`, args);
    handler(event, ...args).catch((err) => {
      console.error(`[main.cjs] Ошибка в канале ${channel}:`, err);
      event.sender.send(`${channel}-error`, err.message);
    });
  });
};

// Обработчики
handleIPC("open-file-dialog", async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile", "multiSelections"],
  });
  if (!result.canceled) {
    const files = result.filePaths.map((filePath) => ({
      path: filePath,
      name: path.basename(filePath),
      type: "unknown",
    }));
    console.log("[main.cjs] Выбранные файлы:", files.map((file) => file.name));
    event.sender.send("selected-files", files);
  }
});

handleIPC("get-groups", async (event) => {
  const rows = await new Promise((resolve, reject) =>
    getGroups((err, rows) => (err ? reject(err) : resolve(rows)))
  );
  console.log("[main.cjs] Отправлены группы на фронтенд, количество:", rows.length);
  event.sender.send("groups", rows);
});

handleIPC("save-group", async (event, { title, description }) => {
  const groupId = await new Promise((resolve, reject) =>
    saveGroup(title, description, (err, id) => (err ? reject(err) : resolve(id)))
  );
  const rows = await new Promise((resolve, reject) =>
    getGroups((err, rows) => (err ? reject(err) : resolve(rows)))
  );
  console.log("[main.cjs] Группы обновлены после сохранения, количество:", rows.length);
  event.sender.send("groups", rows);
});

handleIPC("get-posts", async (event) => {
  const rows = await new Promise((resolve, reject) =>
    getPosts((err, rows) => {
      console.log("[main.cjs] Получены строки из базы для постов, ID:", logPostIds(rows));
      err ? reject(err) : resolve(rows);
    })
  );
  console.log("[main.cjs] Отправлены посты на фронтенд, ID:", logPostIds(rows));
  event.sender.send("posts", rows || []);
});

handleIPC("save-post", async (event, post) => {
  console.log("[main.cjs] Получен пост для сохранения, title:", post.title);

  const postId = await new Promise((resolve, reject) =>
    savePost(post, (err, id) => (err ? reject(err) : resolve(id)))
  );

  console.log("[main.cjs] Сохранён пост с ID:", postId);
  event.sender.send("post-saved", postId);

  if (post.files && post.files.length > 0) {
    console.log(`[main.cjs] Сохранение ${post.files.length} файлов для поста ${postId}`);
    await Promise.all(
      post.files.map((file) =>
        new Promise((resolve, reject) => {
          console.log("[main.cjs] Сохранение файла:", file.name);
          saveAttachedFile(postId, file.path, file.type || "unknown", (err) => {
            if (err) {
              console.error("[main.cjs] Ошибка сохранения файла:", err);
              reject(err);
            } else {
              console.log(
                `[main.cjs] Файл сохранён: post_id=${postId}, path=${file.path}, type=${file.type || "unknown"}`
              );
              resolve();
            }
          });
        })
      )
    );
  } else {
    console.log("[main.cjs] Файлы для сохранения отсутствуют");
  }

  const rows = await new Promise((resolve, reject) =>
    getPosts((err, rows) => {
      console.log("[main.cjs] Обновлённые посты после сохранения, ID:", logPostIds(rows));
      err ? reject(err) : resolve(rows);
    })
  );
  console.log("[main.cjs] Отправлены обновлённые посты на фронтенд, ID:", logPostIds(rows));
  event.sender.send("posts", rows || []);
});

handleIPC("get-attached-files", async (event, postId) => {
  console.log(`[main.cjs] Запрос прикреплённых файлов для postId=${postId}, тип: ${typeof postId}`);
  const rows = await new Promise((resolve, reject) =>
    getAttachedFiles(postId, (err, rows) => (err ? reject(err) : resolve(rows)))
  );
  console.log("[main.cjs] Прикреплённые файлы, количество:", rows.length);
  event.sender.send("attached-files", rows);
});

handleIPC("get-all-attached-files", async (event) => {
  console.log("[main.cjs] Запрос всех прикреплённых файлов");
  const rows = await new Promise((resolve, reject) =>
    db.all("SELECT * FROM Post_Attached_Files", (err, rows) => (err ? reject(err) : resolve(rows)))
  );
  console.log("[main.cjs] Все прикреплённые файлы, количество:", rows.length);
  event.sender.send("all-attached-files", rows);
});

handleIPC("get-templates", async (event) => {
  const rows = await new Promise((resolve, reject) =>
    getTemplates((err, rows) => (err ? reject(err) : resolve(rows)))
  );
  console.log("[main.cjs] Отправлены шаблоны на фронтенд, количество:", rows.length);
  event.sender.send("templates", rows);
});

handleIPC("save-template", async (event, template) => {
  const templateId = await new Promise((resolve, reject) =>
    saveTemplate(template, (err, id) => (err ? reject(err) : resolve(id)))
  );
  const rows = await new Promise((resolve, reject) =>
    getTemplates((err, rows) => (err ? reject(err) : resolve(rows)))
  );
  console.log("[main.cjs] Шаблоны обновлены после сохранения, количество:", rows.length);
  event.sender.send("templates", rows);
});

// Создание окна с адаптацией к порту Vite
function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self'; script-src 'self' 'unsafe-eval'; connect-src 'self' http://localhost:5173 ws://localhost:5174; style-src 'self' 'unsafe-inline';",
        ],
      },
    });
  });

  console.log("[main.cjs] Попытка загрузки фронтенда...");
  win.loadURL("http://localhost:5174").catch((err) => {
    console.error("[main.cjs] Ошибка загрузки фронтенда:", err.message);
    win.loadFile("error.html");
  });

  win.webContents.openDevTools();
}

app.whenReady().then(() => {
  console.log("[main.cjs] Приложение запущено");
  initDB();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  console.log("[main.cjs] Закрытие приложения");
  db.close();
  if (process.platform !== "darwin") app.quit();
});