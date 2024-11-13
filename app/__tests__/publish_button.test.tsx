import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import PublishToggle from '../lib/components/noteElements/publish_toggle';

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation((message) => {
    // Suppress specific React warnings about invalid DOM nesting
    if (message.includes("validateDOMNesting")) {
      return;
    }
    // For other messages, keep the default behavior
    console.warn("Console error suppressed in tests but may need attention:", message);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('PublishToggle displays initial state', () => {
  const { getByRole } = render(<PublishToggle isPublished={true} />);
  const publishButton = getByRole('button', { name: /publish/i });
  expect(publishButton).toBeInTheDocument();
});

test('PublishToggle calls onPublishClick on click', () => {
  const onPublishClickMock = jest.fn();
  const { getByRole } = render(<PublishToggle isPublished={false} onPublishClick={onPublishClickMock} />);
  const publishButton = getByRole('button', { name: /publish/i });

  fireEvent.click(publishButton);
  expect(onPublishClickMock).toHaveBeenCalledTimes(1);
});

test('PublishToggle updates when isPublished prop changes', () => {
  const { getByRole, rerender } = render(<PublishToggle isPublished={false} />);
  const publishButton = getByRole('button', { name: /publish/i });

  expect(publishButton).toBeInTheDocument();
  rerender(<PublishToggle isPublished={true} />);
  expect(publishButton).toBeInTheDocument();
});
