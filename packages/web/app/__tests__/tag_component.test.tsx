import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TagManager from '../lib/components/NoteEditor/NoteElements/TagManager';

// Define Tag type to match the component
type Tag = {
  label: string;
  origin: 'user' | 'ai';
};

describe('TagManager', () => {
  // Initial tags array is updated to include the correct object format
  const initialTags: Tag[] = [{ label: 'ExampleTag', origin: 'user' }];

  /** Helper: clicks the "+ Add tag" button then returns the revealed input */
  const openAddTag = () => {
    const addButton = screen.getByText('Add tag');
    fireEvent.click(addButton);
    return screen.getByPlaceholderText('Type tag...');
  };

  it('renders without crashing', () => {
    // Test to ensure the TagManager component renders without throwing an error
    render(<TagManager onTagsChange={vi.fn()} fetchSuggestedTags={vi.fn()} />);
  });

  it('adds a new valid tag', () => {
    const mockOnTagsChange = vi.fn();
    render(
      <TagManager
        inputTags={initialTags}
        onTagsChange={mockOnTagsChange}
        fetchSuggestedTags={vi.fn()}
      />,
    );

    const input = openAddTag();
    fireEvent.change(input, { target: { value: 'NewTag' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByText('NewTag')).toBeInTheDocument();
    expect(mockOnTagsChange).toHaveBeenCalledWith([
      ...initialTags,
      { label: 'NewTag', origin: 'user' },
    ]);
  });

  it('does not add a tag with spaces', () => {
    const mockOnTagsChange = vi.fn();
    render(<TagManager onTagsChange={mockOnTagsChange} fetchSuggestedTags={vi.fn()} />);

    const input = openAddTag();
    fireEvent.change(input, { target: { value: 'Invalid Tag' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.queryByText('Invalid Tag')).not.toBeInTheDocument();
    expect(mockOnTagsChange).not.toHaveBeenCalled();
  });

  it('adds a tag with exactly 1 character (minimum)', () => {
    const mockOnTagsChange = vi.fn();
    render(<TagManager onTagsChange={mockOnTagsChange} fetchSuggestedTags={vi.fn()} />);

    const input = openAddTag();
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnTagsChange).toHaveBeenCalledWith([{ label: 'a', origin: 'user' }]);
  });

  it('does not add duplicate tags', () => {
    const mockOnTagsChange = vi.fn();
    render(
      <TagManager
        inputTags={initialTags}
        onTagsChange={mockOnTagsChange}
        fetchSuggestedTags={vi.fn()}
      />,
    );

    const input = openAddTag();
    fireEvent.change(input, { target: { value: 'ExampleTag' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnTagsChange).not.toHaveBeenCalled();
  });

  it('does not add a tag with more than 28 characters', () => {
    const mockOnTagsChange = vi.fn();
    render(<TagManager onTagsChange={mockOnTagsChange} fetchSuggestedTags={vi.fn()} />);

    const input = openAddTag();
    fireEvent.change(input, { target: { value: 'ThisIsWayTooLongTagNameForTesting' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.queryByText('ThisIsWayTooLongTagNameForTesting')).not.toBeInTheDocument();
    expect(mockOnTagsChange).not.toHaveBeenCalled();
  });

  it('adds a tag with exactly 28 characters (maximum)', () => {
    const mockOnTagsChange = vi.fn();
    render(<TagManager onTagsChange={mockOnTagsChange} fetchSuggestedTags={vi.fn()} />);

    const tag28 = 'a'.repeat(28); // exactly 28 characters
    const input = openAddTag();
    fireEvent.change(input, { target: { value: tag28 } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnTagsChange).toHaveBeenCalledWith([
      { label: tag28, origin: 'user' },
    ]);
  });

  it('hides input and buttons when disabled prop is true', () => {
    const mockOnTagsChange = vi.fn();
    const mockFetchSuggestedTags = vi.fn();
    render(
      <TagManager
        inputTags={initialTags}
        onTagsChange={mockOnTagsChange}
        fetchSuggestedTags={mockFetchSuggestedTags}
        disabled={true}
      />,
    );

    // When disabled, the "Add tag" button and AI suggest button are not rendered
    expect(screen.queryByText('Add tag')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Suggest tags with AI')).not.toBeInTheDocument();

    // Existing tags should still be displayed
    expect(screen.getByText('ExampleTag')).toBeInTheDocument();

    // Remove buttons on tags should not be rendered
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('allows editing when disabled prop is false', () => {
    const mockOnTagsChange = vi.fn();
    render(
      <TagManager
        inputTags={initialTags}
        onTagsChange={mockOnTagsChange}
        fetchSuggestedTags={vi.fn()}
        disabled={false}
      />,
    );

    const input = openAddTag();
    expect(input).not.toBeDisabled();

    fireEvent.change(input, { target: { value: 'NewTag' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnTagsChange).toHaveBeenCalled();
  });
});
