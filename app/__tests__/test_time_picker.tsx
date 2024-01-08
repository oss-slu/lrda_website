import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import TagManager from '../lib/components/tag_manager';

describe('TagManager', () => {
  it('renders without crashing', () => {
    render(<TagManager onTagsChange={function (tags: string[]): void {
      throw new Error('Function not implemented.');
    } } />);
  });

  it('adds a new tag when a valid tag is entered', () => {
    const mockOnTagsChange = jest.fn();
    render(<TagManager onTagsChange={mockOnTagsChange} />);

    const input = screen.getByPlaceholderText('Add tags...');
    fireEvent.change(input, { target: { value: 'NewTag' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 13 });

    expect(screen.getByText('NewTag')).toBeInTheDocument();
    expect(mockOnTagsChange).toHaveBeenCalledWith(['NewTag']);
  });

  it('does not add a new tag when an invalid tag is entered', () => {
    const mockOnTagsChange = jest.fn();
    render(<TagManager onTagsChange={mockOnTagsChange} />);

    const input = screen.getByPlaceholderText('Add tags...');
    fireEvent.change(input, { target: { value: 'InvalidTag' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 13 });

    expect(screen.queryByText('InvalidTag')).not.toBeInTheDocument();
    expect(mockOnTagsChange).not.toHaveBeenCalled();
  });
});