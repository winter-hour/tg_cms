// src/components/PostList.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  TextField,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

// Глобальное хранилище для слушателей
const listeners = {
  posts: [],
  groups: [],
  templates: [],
  attachedFiles: [],
  selectedFiles: [],
  postSaved: [],
};

// Регистрация слушателей один раз
if (window.electronAPI) {
  Object.keys(listeners).forEach((channel) => {
    window.electronAPI.on(channel, (data) => {
      listeners[channel].forEach((callback) => callback(data));
    });
  });
}

function PostList() {
  const [posts, setPosts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [files, setFiles] = useState([]);
  const [lastPostId, setLastPostId] = useState(null);

  const handleAttachedFiles = useCallback(
    (data) => {
      console.log("[PostList.jsx] Получены прикреплённые файлы для postId:", lastPostId, "Данные:", data);
      const newFiles = data.filter(
        (newFile) => !attachedFiles.some((existingFile) => existingFile.id === newFile.id)
      );
      if (newFiles.length > 0) {
        setAttachedFiles((prev) => [...prev, ...newFiles]);
      }
    },
    [attachedFiles, lastPostId]
  );

  useEffect(() => {
    if (window.electronAPI) {
      console.log("[PostList.jsx] Инициализация PostList");

      // Добавление слушателей
      const postsCallback = (data) => {
        console.log("[PostList.jsx] Получены посты:", data.map((p) => p.id));
        setPosts(
          data.map((post) => ({
            ...post,
            is_published: !!post.is_published,
          }))
        );
      };
      const groupsCallback = (data) => {
        console.log("[PostList.jsx] Получены группы:", data.length);
        setGroups(data);
      };
      const templatesCallback = (data) => {
        console.log("[PostList.jsx] Получены шаблоны:", data.length);
        setTemplates(data);
      };
      const attachedFilesCallback = handleAttachedFiles;
      const selectedFilesCallback = (data) => {
        console.log("[PostList.jsx] Получены файлы через dialog:", data.length);
        setFiles(data);
      };
      const postSavedCallback = (postId) => {
        console.log("[PostList.jsx] Получен ID сохранённого поста:", postId);
        setLastPostId(postId);
        if (postId) window.electronAPI.send("get-attached-files", Number(postId));
      };

      listeners.posts.push(postsCallback);
      listeners.groups.push(groupsCallback);
      listeners.templates.push(templatesCallback);
      listeners.attachedFiles.push(attachedFilesCallback);
      listeners.selectedFiles.push(selectedFilesCallback);
      listeners.postSaved.push(postSavedCallback);

      console.log("[PostList.jsx] Отправка начальных запросов");
      window.electronAPI.send("get-posts");
      window.electronAPI.send("get-groups");
      window.electronAPI.send("get-templates");

      return () => {
        console.log("[PostList.jsx] Очистка слушателей");
        listeners.posts = listeners.posts.filter((cb) => cb !== postsCallback);
        listeners.groups = listeners.groups.filter((cb) => cb !== groupsCallback);
        listeners.templates = listeners.templates.filter((cb) => cb !== templatesCallback);
        listeners.attachedFiles = listeners.attachedFiles.filter((cb) => cb !== attachedFilesCallback);
        listeners.selectedFiles = listeners.selectedFiles.filter((cb) => cb !== selectedFilesCallback);
        listeners.postSaved = listeners.postSaved.filter((cb) => cb !== postSavedCallback);
      };
    } else {
      console.error("[PostList.jsx] window.electronAPI недоступен!");
    }
  }, [handleAttachedFiles]);

  useEffect(() => {
    console.log("[PostList.jsx] Текущее состояние posts:", posts.map((p) => p.id));
  }, [posts]);

  const handleSave = () => {
    const post = {
      group_id: selectedGroup || null,
      title,
      text,
      templateId: selectedTemplate || null,
      files,
    };
    console.log("[PostList.jsx] Отправка поста на сохранение:", JSON.stringify(post, null, 2));

    if (window.electronAPI) {
      window.electronAPI.send("save-post", post);
    } else {
      console.log("[PostList.jsx] Сохранение поста (в браузере):", post);
      setPosts([...posts, { id: Date.now(), ...post, is_published: false }]);
    }
    setTitle("");
    setText("");
    setSelectedGroup("");
    setSelectedTemplate("");
    setFiles([]);
  };

  const handleFileSelect = () => {
    if (window.electronAPI) {
      window.electronAPI.send("open-file-dialog");
    } else {
      console.error("[PostList.jsx] window.electronAPI недоступен для выбора файлов!");
    }
  };

  const handleTemplateChange = (event) => {
    const templateId = event.target.value;
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setText(template.template_text);
    }
  };

  return (
    <div>
      <FormControl fullWidth margin="normal">
        <InputLabel>Группа</InputLabel>
        <Select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          label="Группа"
        >
          <MenuItem value="">Без группы</MenuItem>
          {groups.map((group) => (
            <MenuItem key={group.id} value={group.id}>
              {group.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label="Заголовок"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        fullWidth
        margin="normal"
      />

      <FormControl fullWidth margin="normal">
        <InputLabel>Шаблон</InputLabel>
        <Select value={selectedTemplate} onChange={handleTemplateChange} label="Шаблон">
          <MenuItem value="">Без шаблона</MenuItem>
          {templates.map((template) => (
            <MenuItem key={template.id} value={template.id}>
              {template.template_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label="Текст"
        value={text}
        onChange={(e) => setText(e.target.value)}
        fullWidth
        multiline
        rows={4}
        margin="normal"
      />

      <Button variant="outlined" onClick={handleFileSelect} style={{ margin: "10px 0" }}>
        Выбрать файлы
      </Button>
      {files.length > 0 && (
        <List>
          {files.map((file, index) => (
            <ListItem key={index}>
              <ListItemText primary={file.name} />
            </ListItem>
          ))}
        </List>
      )}

      <Button variant="contained" onClick={handleSave}>
        Сохранить
      </Button>

      {posts.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Группа</TableCell>
              <TableCell>Заголовок</TableCell>
              <TableCell>Текст</TableCell>
              <TableCell>Опубликован</TableCell>
              <TableCell>Прикреплённые файлы</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell>{post.group_title || "Без группы"}</TableCell>
                <TableCell>{post.title}</TableCell>
                <TableCell>{post.text}</TableCell>
                <TableCell>
                  <Switch checked={post.is_published} disabled />
                </TableCell>
                <TableCell>
                  {attachedFiles
                    .filter((file) => Number(file.post_id) === Number(post.id))
                    .map((file) => (
                      <div key={file.id}>{file.file_path}</div>
                    ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p>Нет постов для отображения</p>
      )}
    </div>
  );
}

export default PostList;