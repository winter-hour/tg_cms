import React, { useEffect, useState } from "react";
import {
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";

function TemplateList() {
  const [templates, setTemplates] = useState([]);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.on("templates", (data) => setTemplates(data));
      window.electronAPI.send("get-templates");
    }
  }, []);

  const handleSave = () => {
    const template = { name, text, description };
    if (window.electronAPI) {
      window.electronAPI.send("save-template", template);
    } else {
      console.log("Сохранение шаблона (в браузере):", template);
      setTemplates([...templates, { id: Date.now(), ...template }]);
    }
    setName("");
    setText("");
    setDescription("");
  };

  return (
    <div>
      <Typography variant="h6">Создать шаблон</Typography>
      <TextField
        label="Название шаблона"
        value={name}
        onChange={(e) => setName(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Текст шаблона"
        value={text}
        onChange={(e) => setText(e.target.value)}
        fullWidth
        multiline
        rows={4}
        margin="normal"
      />
      <TextField
        label="Описание"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button variant="contained" onClick={handleSave}>
        Сохранить шаблон
      </Button>

      <Typography variant="h6" style={{ marginTop: "20px" }}>
        Список шаблонов
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Название</TableCell>
            <TableCell>Текст</TableCell>
            <TableCell>Описание</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell>{template.template_name}</TableCell>
              <TableCell>{template.template_text}</TableCell>
              <TableCell>{template.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default TemplateList;