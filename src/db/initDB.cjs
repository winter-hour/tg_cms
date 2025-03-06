const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "../../database.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Ошибка подключения к БД:", err.message);
  } else {
    console.log("Подключено к SQLite");
  }
});

function initDB() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS Post_Groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        group_description TEXT,
        created_at DATETIME NOT NULL,
        updated_at DATETIME
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS Post_Posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER,
        channel_id INTEGER,
        user_id INTEGER,
        title TEXT NOT NULL,
        text TEXT NOT NULL,
        is_published BOOLEAN NOT NULL DEFAULT 0,
        published_at DATETIME,
        created_at DATETIME NOT NULL,
        updated_at DATETIME,
        FOREIGN KEY (group_id) REFERENCES Post_Groups(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS Post_Property_Groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_name TEXT NOT NULL,
        group_description TEXT,
        created_at DATETIME NOT NULL,
        updated_at DATETIME
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS Post_Property_Values (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER,
        property_name TEXT NOT NULL,
        value_type TEXT NOT NULL,
        property_value TEXT NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME,
        FOREIGN KEY (group_id) REFERENCES Post_Property_Groups(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS Post_Properties (
        post_id INTEGER,
        value_id INTEGER,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (post_id, value_id),
        FOREIGN KEY (post_id) REFERENCES Post_Posts(id),
        FOREIGN KEY (value_id) REFERENCES Post_Property_Values(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS Post_Attached_Files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER,
        file_path TEXT NOT NULL,
        file_type TEXT NOT NULL,
        created_at DATETIME NOT NULL,
        FOREIGN KEY (post_id) REFERENCES Post_Posts(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS Post_Templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_name TEXT NOT NULL,
        template_text TEXT NOT NULL,
        description TEXT,
        created_at DATETIME NOT NULL,
        updated_at DATETIME
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS Post_Template_Links (
        post_id INTEGER,
        template_id INTEGER,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (post_id, template_id),
        FOREIGN KEY (post_id) REFERENCES Post_Posts(id),
        FOREIGN KEY (template_id) REFERENCES Post_Templates(id)
      )
    `);
  });
}

// Функции для работы с группами
function getGroups(callback) {
  db.all("SELECT * FROM Post_Groups", (err, rows) => {
    callback(err, rows);
  });
}

function saveGroup(title, description, callback) {
  const createdAt = new Date().toISOString();
  db.run(
    `INSERT INTO Post_Groups (title, group_description, created_at) VALUES (?, ?, ?)`,
    [title, description, createdAt],
    function (err) {
      callback(err, this.lastID);
    }
  );
}

// Функции для работы с постами
function getPosts(callback) {
  db.all(
    `SELECT p.*, g.title as group_title 
     FROM Post_Posts p 
     LEFT JOIN Post_Groups g ON p.group_id = g.id`,
    (err, rows) => {
      console.log("Получены строки из базы для постов:", rows);
      callback(err, rows);
    }
  );
}

function savePost(post, callback) {
  const createdAt = new Date().toISOString();
  db.run(
    `INSERT INTO Post_Posts (group_id, title, text, created_at) VALUES (?, ?, ?, ?)`,
    [post.group_id, post.title, post.text, createdAt],
    function (err) {
      callback(err, this.lastID);
    }
  );
}

// Функции для работы с файлами
function saveAttachedFile(postId, filePath, fileType, callback) {
  const createdAt = new Date().toISOString();
  db.run(
    `INSERT INTO Post_Attached_Files (post_id, file_path, file_type, created_at) VALUES (?, ?, ?, ?)`,
    [postId, filePath, fileType, createdAt],
    function (err) {
      callback(err, this.lastID);
    }
  );
}

function getAttachedFiles(postId, callback) {
  db.all(
    `SELECT * FROM Post_Attached_Files WHERE post_id = ?`,
    [postId],
    (err, rows) => {
      callback(err, rows);
    }
  );
}

// Функции для работы с шаблонами
function getTemplates(callback) {
  db.all("SELECT * FROM Post_Templates", (err, rows) => {
    callback(err, rows);
  });
}

function saveTemplate(template, callback) {
  const createdAt = new Date().toISOString();
  db.run(
    `INSERT INTO Post_Templates (template_name, template_text, description, created_at) VALUES (?, ?, ?, ?)`,
    [template.name, template.text, template.description, createdAt],
    function (err) {
      callback(err, this.lastID);
    }
  );
}

function savePostTemplateLink(postId, templateId, callback) {
  const createdAt = new Date().toISOString();
  db.run(
    `INSERT INTO Post_Template_Links (post_id, template_id, created_at) VALUES (?, ?, ?)`,
    [postId, templateId, createdAt],
    function (err) {
      callback(err);
    }
  );
}

module.exports = {
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
};