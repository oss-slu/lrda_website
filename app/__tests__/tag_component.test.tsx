import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import TagManager from '../lib/components/noteElements/tag_manager';

describe('TagManager', () => {
  // Initial tags array is updated to include the correct object format
  const initialTags = [{ label: 'ExampleTag', origin: 'user' }];

  it('renders without crashing', () => {
    // Test to ensure the TagManager component renders without throwing an error
    render(<TagManager onTagsChange={jest.fn()} />);
  });

  it('adds a new valid tag', () => {
    const mockOnTagsChange = jest.fn(); // Mock function to capture tag changes
    // Render the TagManager with initial tags and the mock function
    render(<TagManager inputTags={initialTags} onTagsChange={mockOnTagsChange} />);

    // Get the input field for adding tags
    const input = screen.getByPlaceholderText('Add tags...');
    // Simulate user typing a new tag and pressing Enter
    fireEvent.change(input, { target: { value: 'NewTag' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Assert that the new tag is now displayed in the document
    expect(screen.getByText('NewTag')).toBeInTheDocument();
    // Assert that the mock function was called with the expected updated tags array
    expect(mockOnTagsChange).toHaveBeenCalledWith([
      ...initialTags,
      { label: 'NewTag', origin: 'user' } // Updated expected format to match TagManager's structure
    ]);
  });

  it('does not add a tag with spaces', () => {
    const mockOnTagsChange = jest.fn();
    render(<TagManager onTagsChange={mockOnTagsChange} />);

    const input = screen.getByPlaceholderText('Add tags...');
    // Simulate user trying to add a tag with spaces
    fireEvent.change(input, { target: { value: 'Invalid Tag' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Assert that the tag is not added
    expect(screen.queryByText('Invalid Tag')).not.toBeInTheDocument();
    expect(mockOnTagsChange).not.toHaveBeenCalled(); // Assert that the callback was not called
  });

  it('does not add a tag with less than 3 characters', () => {
    const mockOnTagsChange = jest.fn();
    render(<TagManager onTagsChange={mockOnTagsChange} />);

    const input = screen.getByPlaceholderText('Add tags...');
    // Simulate user trying to add a short tag
    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Assert that the tag is not added
    expect(screen.queryByText('ab')).not.toBeInTheDocument();
    expect(mockOnTagsChange).not.toHaveBeenCalled();
  });

  it('does not add duplicate tags', () => {
    const mockOnTagsChange = jest.fn();
    render(<TagManager inputTags={initialTags} onTagsChange={mockOnTagsChange} />);

    const input = screen.getByPlaceholderText('Add tags...');
    // Simulate user trying to add an existing tag
    fireEvent.change(input, { target: { value: 'ExampleTag' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Assert that the callback was not called with duplicate tags
    expect(mockOnTagsChange).not.toHaveBeenCalledWith([
      { label: 'ExampleTag', origin: 'user' },
      { label: 'ExampleTag', origin: 'user' }
    ]);
  });
});