// src/App.jsx
import React, { useState } from "react";
import { Container, Tabs, Tab, Box } from "@mui/material";
import PostList from "./components/PostList";
import GroupList from "./components/GroupList";
import TemplateList from "./components/TemplateList";

function App() {
  const [tab, setTab] = useState(0);

  return (
    <Container>
      <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
        <Tab label="Посты" />
        <Tab label="Группы" />
        <Tab label="Шаблоны" />
      </Tabs>
      <Box sx={{ display: tab === 0 ? "block" : "none" }}>
        <PostList />
      </Box>
      <Box sx={{ display: tab === 1 ? "block" : "none" }}>
        <GroupList />
      </Box>
      <Box sx={{ display: tab === 2 ? "block" : "none" }}>
        <TemplateList />
      </Box>
    </Container>
  );
}

export default App;