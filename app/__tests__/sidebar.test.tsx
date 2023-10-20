import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/router';
import Sidebar from '../lib/components/Sidebar'; 

jest.mock('next/router', () => ({
  useRouter: jest.fn()
}));

describe('Sidebar Component', () => {
  let mockPush;

  beforeEach(() => {
    mockPush = jest.fn();
    useRouter.mockImplementation(() => ({
      push: mockPush,
    }));
  });

  it('renders the sidebar correctly', () => {
    render(<Sidebar />);
    const sidebarElement = screen.getByRole('complementary'); // assuming the sidebar has role="complementary"
    expect(sidebarElement).toBeInTheDocument();
  });

  it('displays the "Add Note" link', () => {
    render(<Sidebar />);
    const linkElement = screen.getByText('Add Note');
    expect(linkElement).toBeInTheDocument();
  });

  it('navigates to "/add-note" when "Add Note" link is clicked', () => {
    render(<Sidebar />);
    const linkElement = screen.getByText('Add Note');
    fireEvent.click(linkElement);
    expect(mockPush).toHaveBeenCalledWith('/add-note');
  });
});
