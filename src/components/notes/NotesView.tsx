import React from 'react';
import { NotesListPanel } from './NotesListPanel';
import { NoteEditor } from './NoteEditor';

export const NotesView: React.FC<{ expanded: boolean; setExpanded: (value: boolean) => void }> = ({ expanded, setExpanded }) => {
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
      {!expanded && <NotesListPanel />}
      <NoteEditor isFullscreen={expanded} setIsFullscreen={setExpanded} />
    </div>
  );
};
