import React, { useState } from 'react';
import ApiService from '../../utils/api_service'; // Assuming the correct path
import PropTypes from 'prop-types';

const NoteEditor = ({ note, isNewNote }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isArchived, setIsArchived] = useState(false);

  const handleDeleteClick = () => {
    setShowConfirmation(true);
  };

  const handleCancelClick = () => {
    setShowConfirmation(false);
  };

  const handleConfirmClick = async () => {
    try {
      const response = await ApiService.archiveNote(note.id);
      if (response.success) {
        setIsArchived(true); // Hide note in the frontend
      }
    } catch (error) {
      setErrorMessage('Failed to archive note. Try again later.');
    } finally {
      setShowConfirmation(false);
    }
  };

  if (isArchived) {
    return null; // Note is archived, so don't render anything.
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Title"
        defaultValue={note.title}
      />
      {/* Render the rest of the note elements like text, media, tags, etc. */}
      <button onClick={handleDeleteClick}>Delete</button>
      {showConfirmation && (
        <div>
          <p>Are you absolutely sure?</p>
          <p>This action cannot be undone.</p>
          <button onClick={handleCancelClick}>Cancel</button>
          <button onClick={handleConfirmClick}>Continue</button>
        </div>
      )}
      {errorMessage && <p>{errorMessage}</p>}
      <button>Save</button>
    </div>
  );
};

NoteEditor.propTypes = {
  note: PropTypes.object.isRequired,
  isNewNote: PropTypes.bool.isRequired,
};

export default NoteEditor;
