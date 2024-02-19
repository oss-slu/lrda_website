"use client"
import React from 'react';
// Import your components here

import NoteComponent from "../../components/noteElements/note_component";




// Add other imports as needed

const CreateNotePage = () => {
  // You can manage state and any logic here

  return (
    <div>
      <NoteComponent isNewNote={false} />
     
      
      {/* Add other components as needed */}
      {/* You can also pass props to these components if they require any */}
    </div>
  );
};

export default CreateNotePage;
