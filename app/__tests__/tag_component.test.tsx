import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import TagManager from '../lib/components/noteElements/tag_manager';

describe('TagManager', () => {
  const initialTags = ['ExampleTag'];

  it('renders without crashing', () => {
    render(<TagManager onTagsChange={jest.fn()} />);
  });

  it('adds a new valid tag', () => {
    const mockOnTagsChange = jest.fn();
    render(<TagManager inputTags={initialTags} onTagsChange={mockOnTagsChange} />);

    const input = screen.getByPlaceholderText('Add tags...');
    fireEvent.change(input, { target: { value: 'NewTag' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByText('NewTag')).toBeInTheDocument();
    expect(mockOnTagsChange).toHaveBeenCalledWith([...initialTags, 'NewTag']);
  });

  it('does not add a tag with spaces', () => {
    const mockOnTagsChange = jest.fn();
    render(<TagManager onTagsChange={mockOnTagsChange} />);

    const input = screen.getByPlaceholderText('Add tags...');
    fireEvent.change(input, { target: { value: 'Invalid Tag' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.queryByText('Invalid Tag')).not.toBeInTheDocument();
    expect(mockOnTagsChange).not.toHaveBeenCalled();
  });

  it('does not add a tag with less than 3 characters', () => {
    const mockOnTagsChange = jest.fn();
    render(<TagManager onTagsChange={mockOnTagsChange} />);

    const input = screen.getByPlaceholderText('Add tags...');
    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.queryByText('ab')).not.toBeInTheDocument();
    expect(mockOnTagsChange).not.toHaveBeenCalled();
  });

  it('does not add duplicate tags', () => {
    const mockOnTagsChange = jest.fn();
    render(<TagManager inputTags={initialTags} onTagsChange={mockOnTagsChange} />);

    const input = screen.getByPlaceholderText('Add tags...');
    fireEvent.change(input, { target: { value: 'ExampleTag' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnTagsChange).not.toHaveBeenCalledWith(['ExampleTag', 'ExampleTag']);
  });


});
