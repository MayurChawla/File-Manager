import React, {useEffect} from 'react';
import { useDrag } from 'react-dnd';
import { InsertDriveFile as FileIcon } from '@mui/icons-material';
import { Typography, Card, CardContent } from '@mui/material';
// import { DraggableItem } from '../types';

const ItemComponent = ({ item, onDrop, onDragStart, onDragEnd  }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'ITEM',
    item: { ...item },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      if (item && dropResult) {
        onDrop(item, dropResult.parentId);
      }
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));


  useEffect(() => {
    if (isDragging) {
      onDragStart?.();
    } else {
      onDragEnd?.();
    }
  }, [isDragging, onDragStart, onDragEnd]);

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <Card variant="outlined" style={{ margin: '8px', width: 150 }}>
        <CardContent style={{ textAlign: 'center' }}>
          <FileIcon style={{ fontSize: 40 }} />
          <Typography noWrap>{item.title}</Typography>
          <Typography noWrap>{item.id.substring(item.id.length-7)}</Typography>
        </CardContent>
      </Card>
    </div>
  );
};

export default ItemComponent;