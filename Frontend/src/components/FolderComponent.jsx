import React, {useEffect} from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Folder as FolderIcon, InsertDriveFile as FileIcon, 
         KeyboardArrowDown, KeyboardArrowRight } from '@mui/icons-material';
import { Typography, Card, CardContent, CardActionArea, Grid } from '@mui/material';
import ItemComponent from './ItemComponent';
// import { DraggableItem, Folder } from '../types';

const FolderComponent = ({ folder, items, onDrop, onToggle, onDragStart, onDragEnd  }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'FOLDER',
    item: { ...folder },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  // const [{ isDragging }, drag] = useDrag(() => ({
  //   type: item.type === 'folder' ? 'FOLDER' : 'ITEM',
  //   item: { ...item },
  //   collect: (monitor) => ({
  //     isDragging: !!monitor.isDragging(),
  //   }),
  // }));
  
  useEffect(() => {
    if (isDragging) {
      onDragStart?.();
    } else {
      onDragEnd?.();
    }
  }, [isDragging, onDragStart, onDragEnd]);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['ITEM', 'FOLDER'],
    drop: (draggedItem) => {
      if (draggedItem.id !== folder.id) {
        onDrop(draggedItem, folder.id);
      }
      return { parentId: folder.id };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div ref={node => drag(drop(node))} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <Card 
        variant="outlined" 
        style={{ 
          margin: '8px', 
          border: isOver ? '2px dashed #1976d2' : '1px solid #e0e0e0',
          width: 150
        }}
      >
        <CardActionArea onClick={() => onToggle(folder.id, !folder.isOpen)}>
          <CardContent style={{ textAlign: 'center' }}>
            <FolderIcon color="primary" style={{ fontSize: 40 }} />
            <Typography noWrap>{folder.name}</Typography>
            <Typography noWrap>{folder.id.substring(folder.id.length-7)}</Typography>
            {folder.isOpen ? (
              <KeyboardArrowDown color="action" />
            ) : (
              <KeyboardArrowRight color="action" />
            )}
          </CardContent>
        </CardActionArea>
      </Card>

      {folder.isOpen && (
        <Grid container spacing={1} style={{ marginLeft: '32px', marginTop: '8px', padding: '5px', border: '2px solid #000' }}>
          {items
            .filter(item => item.parentId === folder.id)
            .map((item) => (
              <Grid item key={item.id}>
                {item.type === 'folder' ? (
                  <FolderComponent
                    folder={item}
                    items={items}
                    onDrop={onDrop}
                    onToggle={onToggle}
                  />
                ) : (
                  <ItemComponent
                    item={item}
                    onDrop={(draggedItem) => onDrop(draggedItem, folder.id)}
                  />
                )}
              </Grid>
            ))}
        </Grid>
      )}
    </div>
  );
};

export default FolderComponent;