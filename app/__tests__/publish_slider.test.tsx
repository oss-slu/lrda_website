import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../lib/components/side_bar';

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: {
      uid: 'mockUserId',
      email: 'mock@example.com',
    },
  })),
}));

describe('Publish and Unpublish Notes Slider', () => {
  it('renders the toggle switch correctly', () => {
    render(<Sidebar onNoteSelect={jest.fn()} />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeInTheDocument();
  });

  it('toggles between published and unpublished notes', () => {
    render(<Sidebar onNoteSelect={jest.fn()} />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeChecked(); // default state should be published

    fireEvent.click(switchElement);
    expect(switchElement).not.toBeChecked(); // switch to unpublished

    fireEvent.click(switchElement);
    expect(switchElement).toBeChecked(); // switch back to published
  });
});
