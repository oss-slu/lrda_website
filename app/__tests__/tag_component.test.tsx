import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import TagManager from '../lib/components/tag_manager';

describe('TagManager', () => {
  it('renders without crashing', () => {
    render(<TagManager />);
  });

  it('allows the user to add a tag', () => {
    render(<TagManager />);
    const input = screen.getByPlaceholderText('Add tags...');
    fireEvent.change(input, { target: { value: 'newTag' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByText('newTag')).toBeInTheDocument();
  });

  it('does not allow adding tags with spaces', () => {
    render(<TagManager />);
    const input = screen.getByPlaceholderText('Add tags...');
    fireEvent.change(input, { target: { value: 'invalid tag' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.queryByText('invalid tag')).not.toBeInTheDocument();
  });

  it('allows the user to remove a tag', () => {
    const initialTags = ['tag1', 'tag2'];
    render(<TagManager inputTags={initialTags} />);
  
    const firstTagRemoveButton = screen?.getAllByText('tag1')[0]?.parentNode?.querySelector('button');
    if (firstTagRemoveButton) {
      fireEvent.click(firstTagRemoveButton);
      expect(screen.queryByText('tag1')).not.toBeInTheDocument();
    } else {
      throw new Error('Button not found');
    }
    expect(screen.getByText('tag2')).toBeInTheDocument();
  });

  it('allows user to see all passed tags', () => {
    const initialTags = ['Test', 'Find', 'Word'];
    render(<TagManager inputTags={initialTags} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Find')).toBeInTheDocument();
    expect(screen.getByText('Word')).toBeInTheDocument();
  });
  

});
