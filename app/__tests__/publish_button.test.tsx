import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import PublishToggle from '../lib/components/noteElements/publish_toggle';

test('PublishToggle reflects initial isPublished state', () => {
  const { getByRole } = render(<PublishToggle isPublished={true} />);
  const switchButton = getByRole('switch'); 
  expect(switchButton).toBeChecked();
});

test('PublishToggle changes state and calls onPublishChange on click', () => {
  const onPublishChangeMock = jest.fn();
  const { getByRole } = render(<PublishToggle isPublished={false} onPublishChange={onPublishChangeMock} />);
  const switchButton = getByRole('switch');

  expect(switchButton).not.toBeChecked();
  fireEvent.click(switchButton);
  expect(switchButton).toBeChecked();
  expect(onPublishChangeMock).toHaveBeenCalledWith(true);
});

test('PublishToggle updates when isPublished prop changes', () => {
  const { getByRole, rerender } = render(<PublishToggle isPublished={false} />);
  const switchButton = getByRole('switch');

  expect(switchButton).not.toBeChecked();
  rerender(<PublishToggle isPublished={true} />);
  expect(switchButton).toBeChecked();
});
