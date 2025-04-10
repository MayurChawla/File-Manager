import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { TextField, Button, Box, Typography, Grid } from '@mui/material';
import FolderComponent from './FolderComponent';
import ItemComponent from './ItemComponent';
// import { DraggableItem, Folder, Item } from '../types';

const SERVER_URL = 'https://backend0012.duckdns.org';
let isUpdating = false;

const ItemManager = () => {
  const [items, setItems] = useState([]);
  const [socket, setSocket] = useState(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    // Fetch initial data
    fetch(`${SERVER_URL}/api/items`)
      .then(res => res.json())
      .then(data => setItems(data));

    // Setup socket listeners
    newSocket.on('itemAdded', (item) => {
      setItems(prev => [...prev, item]);
    });

    newSocket.on('folderAdded', (folder) => {
      setItems(prev => [...prev, folder]);
    });

    newSocket.on('itemsUpdated', (updatedItems) => {
      console.log("got updated items ::: ", updatedItems);
      setItems(updatedItems);
    });

    newSocket.on('folderToggled', (folderId, isOpen) => {
      setItems(prev => prev.map(item => 
        item.type === 'folder' && item.id === folderId ? { ...item, isOpen } : item
      ));
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);


  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const toggleFolder = (folderId, isOpen) => {
    if (socket) {
      socket.emit('toggleFolder', folderId, isOpen);
    }
  };

  const handleAddItem = () => {
    if (newItemTitle.trim() && socket) {
      socket.emit('addItem', {
        title: newItemTitle,
        icon: '📄',
        parentId: null
      });
      setNewItemTitle('');
    }
  };

  const handleAddFolder = () => {
    if (newFolderName.trim() && socket) {
      socket.emit('addFolder', {
        name: newFolderName,
        isOpen: true,
        parentId: null
      });
      setNewFolderName('');
    }
  };

  const handleDrop = (item, newParentId) => {
    if (!socket) return;

    console.log("drop ", item, newParentId);
    
    if (item.id === newParentId) {
      alert("Cannot drop an item onto itself");
      return; 
    }
    if (isUpdating) return;
    
    if (item.type === 'folder' && isNestedChild(item.id, newParentId, items)) {
      alert("Cannot move a folder into its own subfolder");
      return;
    }
    
    isUpdating = true;

    for(const it in items) {
      if (items[it].id === item.id) {
        socket.emit('updateItems', { ...items[it], parentId: newParentId});
        break;
      }
    }

    setTimeout(() => {
      isUpdating = false
    }, 1000);

    return;

  };
  
  const isNestedChild = (targetId, potentialParentId, allItems) => {
    if (!potentialParentId) return false;
    
    let currentId = potentialParentId;

    while (currentId) {
      const parentItem = allItems.find(item => item.id === currentId);
      if (!parentItem) break;

      if (parentItem.id === targetId) {
        return true; 
      }

      currentId = parentItem.parentId;
    }
    
    return false;
};


  return (
    <Box style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h4" style={{ marginBottom: '16px' }}>Item Manager</Typography>
      
      <Box style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <TextField
          label="New Item Title"
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          size="small"
          style={{ width: 200 }}
        />
        <Button variant="contained" onClick={handleAddItem}>Add Item</Button>
        
        <TextField
          label="New Folder Name"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          size="small"
          style={{ width: 200, marginLeft: '16px' }}
        />
        <Button variant="contained" onClick={handleAddFolder}>Add Folder</Button>
      </Box>
      
      <Grid container spacing={2}>
        {items
          .filter(item => item.parentId === null)
          .map((item) => (
            <Grid item key={item.id}>
              {item.type === 'folder' ? (
                <FolderComponent folder={item} items={items} onDrop={handleDrop} onToggle={toggleFolder} 
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                />
              ) : (
                <ItemComponent item={item} onDrop={handleDrop}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                />
              )}
            </Grid>
          ))}
      </Grid>
    </Box>
  );
};

export default ItemManager;