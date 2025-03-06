// src/db/initDB.cjs
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(path.join(__dirname, "../../database.db"), (err) => {
  if (err) {
    console.error("Ошибка подключения к SQLite:", err);
  } else {
    console.log("[initDB.cjs] Подключено к SQLite");
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS Post_Groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Post_Templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_name TEXT NOT NULL,
      template_text TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Post_Posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER,
      channel_id INTEGER,
      user_id INTEGER,
      title TEXT,
      text TEXT,
      is_published INTEGER DEFAULT 0,
      published_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT,
      FOREIGN KEY (group_id) REFERENCES Post_Groups(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Post_Attached_Files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      file_path TEXT NOT NULL,
      file_type TEXT,
      FOREIGN KEY (post_id) REFERENCES Post_Posts(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Post_Post_Template (
      post_id INTEGER,
      template_id INTEGER,
      FOREIGN KEY (post_id) REFERENCES Post_Posts(id),
      FOREIGN KEY (template_id) REFERENCES Post_Templates(id),
      PRIMARY KEY (post_id, template_id)
    )
  `);
});

function getGroups(callback) {
  db.all("SELECT * FROM Post_Groups", callback);
}

function saveGroup(title, description, callback) {
  db.run("INSERT INTO Post_Groups (title, description) VALUES (?, ?)", [title, description], function (err) {
    callback(err, this.lastID);
  });
}

function getPosts(callback) {
  db.all(
    `SELECT p.*, g.title as group_title 
     FROM Post_Posts p 
     LEFT JOIN Post_Groups g ON p.group_id = g.id`,
    callback
  );
}

function savePost(post, callback) {
  db.run(
    `INSERT INTO Post_Posts (group_id, channel_id, user_id, title, text, is_published, published_at, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      post.group_id || null,
      post.channel_id || null,
      post.user_id || null,
      post.title || "",
      post.text || "",
      post.is_published ? 1 : 0,
      post.published_at || null,
      post.created_at || new Date().toISOString(),
      post.updated_at || null,
    ],
    function (err) {
      callback(err, this.lastID);
    }
  );
}

function saveAttachedFile(postId, filePath, fileType, callback) {
  db.run(
    "INSERT INTO Post_Attached_Files (post_id, file_path, file_type) VALUES (?, ?, ?)",
    [postId, filePath, fileType],
    callback
  );
}

function getAttachedFiles(postId, callback) {
  db.all("SELECT * FROM Post_Attached_Files WHERE post_id = ?", [postId], callback);
}

function getTemplates(callback) {
  db.all("SELECT * FROM Post_Templates", callback);
}

function saveTemplate(template, callback) {
  db.run(
    "INSERT INTO Post_Templates (template_name, template_text) VALUES (?, ?)",
    [template.template_name, template.template_text],
    function (err) {
      callback(err, this.lastID);
    }
  );
}

function savePostTemplateLink(postId, templateId, callback) {
  db.run(
    "INSERT INTO Post_Post_Template (post_id, template_id) VALUES (?, ?)",
    [postId, templateId],
    callback
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