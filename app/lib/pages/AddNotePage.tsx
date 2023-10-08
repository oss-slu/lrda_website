'use client'
import { useState } from "react";
import { Editor, EditorState } from "draft-js";
import 'draft-js/dist/Draft.css';

export default function AddNotePage() {
  const [text, textUpdate] = useState(EditorState.createEmpty());

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="">
        <h1 className="text-blue-500 text-xl">Draft.js Testing Environment</h1>
        <div style={editorStyles}>
          <Editor editorState={text} onChange={textUpdate} />
        </div>
      </div>
    </main>
  );
}

const editorStyles = {
  border: '1px solid black',
  padding: '10px',
  borderRadius: '4px',
  minHeight: '200px',
  width: '800px',
  color: 'black',
  backgroundColor: 'white',
};