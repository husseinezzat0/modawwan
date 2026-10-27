import React from 'react';
import { NotesListPanel } from './NotesListPanel';
import { NoteEditor } from './NoteEditor';

export const NotesView: React.FC = () => {
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
      <NotesListPanel />
      <NoteEditor />
    </div>
  );
};
