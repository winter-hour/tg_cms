import React, { useEffect, useState } from "react";
import { Container, Tabs, Tab, Box } from "@mui/material";
import PostList from "./components/PostList";
import TemplateList from "./components/TemplateList";
import GroupList from "./components/GroupList";

function App() {
  const [tab, setTab] = useState(0);

  return (
    <Container>
      <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
        <Tab label="Посты" />
        <Tab label="Шаблоны" />
        <Tab label="Группы" />
      </Tabs>
      <Box mt={2}>
        <div style={{ display: tab === 0 ? "block" : "none" }}>
          <PostList />
        </div>
        <div style={{ display: tab === 1 ? "block" : "none" }}>
          <TemplateList />
        </div>
        <div style={{ display: tab === 2 ? "block" : "none" }}>
          <GroupList />
        </div>
      </Box>
    </Container>
  );
}

export default App;