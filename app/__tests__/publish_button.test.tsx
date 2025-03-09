import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PublishToggle from '../lib/components/noteElements/publish_toggle';

describe('PublishToggle Component', () => {
  
  it('renders the publish button with correct initial state', () => {
    render(<PublishToggle isPublished={false} />);
    const publishButton = screen.getByText(/Publish/i);
    expect(publishButton).toBeInTheDocument();
    expect(publishButton).toHaveClass('text-black'); // Ensure default text color
  });

  it('renders as published when isPublished is true', () => {
    render(<PublishToggle isPublished={true} />);
    const publishButton = screen.getByText(/Publish/i);
    expect(publishButton).toBeInTheDocument();
    expect(publishButton).toHaveClass('text-blue-500'); // Ensure text is blue when published
  });

  it('calls onPublishClick when clicked', () => {
    const onPublishClickMock = jest.fn();
    render(<PublishToggle isPublished={false} onPublishClick={onPublishClickMock} />);
    const publishButton = screen.getByText(/Publish/i);

    fireEvent.click(publishButton);
    expect(onPublishClickMock).toHaveBeenCalledTimes(1);
  });

  it('displays publish notification on click and hides after timeout', async () => {
    render(<PublishToggle isPublished={false} />);
    const publishButton = screen.getByText(/Publish/i);

    fireEvent.click(publishButton);

    const notification = await screen.findByText(/Note published successfully!/i);
    expect(notification).toBeInTheDocument();

    // Ensure notification disappears after 3 seconds
    await waitFor(() => {
      expect(notification).not.toBeInTheDocument();
    }, { timeout: 3500 });
  });

  it('updates correctly when isPublished prop changes', () => {
    const { rerender } = render(<PublishToggle isPublished={false} />);
    const publishButton = screen.getByText(/Publish/i);
    
    expect(publishButton).toHaveClass('text-black');

    // Re-render with new prop value
    rerender(<PublishToggle isPublished={true} />);
    expect(publishButton).toHaveClass('text-blue-500');
  });

  
});
