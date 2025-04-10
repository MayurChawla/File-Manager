const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// Database types (not enforced in JS)
// Item: { id, type: 'item', title, icon, parentId }
// Folder: { id, type: 'folder', name, isOpen, parentId }

// Database setup
const dbPath = path.join(__dirname, 'db.json');

const readDatabase = () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return { items: [] };
  }
};

const writeDatabase = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// Initialize database
let db = readDatabase();
if (!db.items) {
  db = { items: [] };
  writeDatabase(db);
}

// Server setup
const app = express();
app.use(cors({
  origin: '*',
}));
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());

// API endpoints
app.get('/api/items', (req, res) => {
  res.json(db.items);
});

// Socket.io events
io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('addItem', (item) => {
    const newItem = { ...item, id: uuidv4(), type: 'item' };
    db.items.push(newItem);
    writeDatabase(db);
    io.emit('itemAdded', newItem);
  });

  socket.on('addFolder', (folder) => {
    const newFolder = { ...folder, id: uuidv4(), type: 'folder' };
    db.items.push(newFolder);
    writeDatabase(db);
    io.emit('folderAdded', newFolder);
  });

  socket.on('updateItems', (updatedItem) => {
    // db.items = updatedItems;
    
    for(const it in db.items) {
      if(db.items[it].id === updatedItem.id) {
        db.items[it] = { ...db.items[it], ...updatedItem};
        break;
      }
    }
    writeDatabase(db);
    io.emit('itemsUpdated', db.items);
      
  });

  // socket.on('updateItems', (updatedItem) => {
  //   // 1. Find the item being updated in the database
  //   const itemIndex = db.items.findIndex(item => item.id === updatedItem.id);
  //   if (itemIndex === -1) return; // Item not found
    
  //   // 2. Get the original item and proposed changes
  //   const originalItem = db.items[itemIndex];
  //   const newParentId = updatedItem.parentId;
    
  //   // 3. Validate the move
  //   if (!isValidMove(originalItem, newParentId, db.items)) {
  //     console.warn(`Invalid move attempted: ${originalItem.name || originalItem.title}`);
  //     return; // Reject invalid moves
  //   }
    
  //   // 4. Apply the update
  //   db.items[itemIndex] = { ...originalItem, ...updatedItem };
  //   writeDatabase(db);
  //   io.emit('itemsUpdated', db.items);
  // });
  
  // // Validation helper functions
  // function isValidMove(item, newParentId, allItems) {
  //   // Case 1: Moving to same parent (no-op)
  //   if (item.parentId === newParentId) return false;
    
  //   // Case 2: Moving to self
  //   if (item.id === newParentId) return false;
    
  //   // Case 3: For folders, check for circular references
  //   if (item.type === 'folder') {
  //     if (wouldCreateCycle(item.id, newParentId, allItems)) {
  //       return false;
  //     }
  //   }
    
  //   // Case 4: Check if new parent exists (unless moving to root)
  //   if (newParentId && !allItems.some(i => i.id === newParentId)) {
  //     return false;
  //   }
    
  //   return true;
  // }
  
  // function wouldCreateCycle(itemId, newParentId, allItems) {
  //   let currentId = newParentId;
    
  //   while (currentId) {
  //     // Found the item in the parent chain - would create cycle
  //     if (currentId === itemId) return true;
      
  //     // Move up the hierarchy
  //     const parent = allItems.find(i => i.id === currentId);
  //     currentId = parent?.parentId;
  //   }
    
  //   return false;
  // }

  socket.on('toggleFolder', (folderId, isOpen) => {
    const folder = db.items.find(item => item.id === folderId && item.type === 'folder');
    if (folder) {
      folder.isOpen = isOpen;
      writeDatabase(db);
      io.emit('folderToggled', folderId, isOpen);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = 4001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});