import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import PublishToggle from '../lib/components/noteElements/publish_toggle';

test('PublishToggle displays initial state', () => {
  const { getByText } = render(<PublishToggle isPublished={true} />);
  const publishButton = getByText(/publish/i);
  expect(publishButton).toBeInTheDocument();
});

test('PublishToggle calls onPublishClick on click', () => {
  const onPublishClickMock = jest.fn();
  const { getByText } = render(<PublishToggle isPublished={false} onPublishClick={onPublishClickMock} />);
  const publishButton = getByText(/publish/i);

  fireEvent.click(publishButton);
  expect(onPublishClickMock).toHaveBeenCalledTimes(1);
});

test('PublishToggle updates when isPublished prop changes', () => {
  const { getByText, rerender } = render(<PublishToggle isPublished={false} />);
  const publishButton = getByText(/publish/i);

  expect(publishButton).toBeInTheDocument();
  rerender(<PublishToggle isPublished={true} />);
  expect(publishButton).toBeInTheDocument();
});
//change or rewrite this