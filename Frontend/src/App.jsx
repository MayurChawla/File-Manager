import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ItemManager from './components/ItemManager';

function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <ItemManager />
    </DndProvider>
  );
}

export default App;