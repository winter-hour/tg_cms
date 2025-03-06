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

function GroupList() {
  const [groups, setGroups] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.on("groups", (data) => setGroups(data));
      window.electronAPI.send("get-groups");
    }
  }, []);

  const handleSave = () => {
    const group = { title, description };
    if (window.electronAPI) {
      window.electronAPI.send("save-group", group);
    } else {
      console.log("Сохранение группы (в браузере):", group);
      setGroups([...groups, { id: Date.now(), ...group }]);
    }
    setTitle("");
    setDescription("");
  };

  return (
    <div>
      <Typography variant="h6">Создать группу</Typography>
      <TextField
        label="Название группы"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        fullWidth
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
        Сохранить группу
      </Button>

      <Typography variant="h6" style={{ marginTop: "20px" }}>
        Список групп
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Название</TableCell>
            <TableCell>Описание</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {groups.map((group) => (
            <TableRow key={group.id}>
              <TableCell>{group.title}</TableCell>
              <TableCell>{group.group_description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default GroupList;