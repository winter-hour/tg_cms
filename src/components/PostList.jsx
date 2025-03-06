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
  const [isInitialized, setIsInitialized] = useState(false);

  const handleAttachedFiles = useCallback((data) => {
    console.log("[PostList.jsx] Получены прикреплённые файлы для postId:", lastPostId, "Данные:", data);
    const newFiles = data.filter(
      (newFile) => !attachedFiles.some((existingFile) => existingFile.id === newFile.id)
    );
    if (newFiles.length > 0) {
      setAttachedFiles((prev) => [...prev, ...newFiles]);
    }
  }, [attachedFiles, lastPostId]);

  useEffect(() => {
    if (window.electronAPI && !isInitialized) {
      console.log("[PostList.jsx] Инициализация PostList");
      window.electronAPI.on("posts", (data) => {
        console.log("[PostList.jsx] Получены посты:", data);
        setPosts(
          data.map((post) => ({
            ...post,
            is_published: !!post.is_published,
          }))
        );
      });
      window.electronAPI.on("groups", (data) => {
        console.log("[PostList.jsx] Получены группы:", data);
        setGroups(data);
      });
      window.electronAPI.on("templates", (data) => {
        console.log("[PostList.jsx] Получены шаблоны:", data);
        setTemplates(data);
      });
      window.electronAPI.on("attached-files", handleAttachedFiles);
      window.electronAPI.on("selected-files", (data) => {
        console.log("[PostList.jsx] Получены файлы через dialog:", data);
        setFiles(data);
      });
      window.electronAPI.on("post-saved", (postId) => {
        console.log("[PostList.jsx] Получен ID сохранённого поста:", postId);
        setLastPostId(postId);
        if (postId) window.electronAPI.send("get-attached-files", Number(postId));
      });

      console.log("[PostList.jsx] Отправка начальных запросов");
      window.electronAPI.send("get-posts");
      window.electronAPI.send("get-groups");
      window.electronAPI.send("get-templates");

      setIsInitialized(true);
    } else if (!window.electronAPI) {
      console.error("[PostList.jsx] window.electronAPI недоступен!");
    }

    return () => {
      if (window.electronAPI) {
        ["posts", "groups", "templates", "attached-files", "selected-files", "post-saved"].forEach(
          (channel) => window.electronAPI.removeAllListeners(channel)
        );
        console.log("[PostList.jsx] Слушатели очищены в PostList");
      }
    };
  }, [handleAttachedFiles, isInitialized]);

  useEffect(() => {
    console.log("[PostList.jsx] Текущее состояние posts:", posts);
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
        <Select
          value={selectedTemplate}
          onChange={handleTemplateChange}
          label="Шаблон"
        >
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

      <Button
        variant="outlined"
        onClick={handleFileSelect}
        style={{ margin: "10px 0" }}
      >
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