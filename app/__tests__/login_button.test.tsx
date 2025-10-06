import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock the User module before importing components that import it. This prevents
// the real module from initializing Firebase during test module evaluation.
jest.mock('../../app/lib/models/user_class', () => ({
  User: {
    getInstance: jest.fn(),
  },
}));

import LoginButton from '../../app/lib/components/login_button';
import { User } from '../../app/lib/models/user_class';

describe('LoginButton', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('shows loading state and prevents duplicate submits', async () => {
    const mockLogin = jest.fn(() => new Promise((res) => setTimeout(() => res('success'), 50)));
    // @ts-ignore - mock getInstance to return an object with login
    User.getInstance = jest.fn(() => ({ login: mockLogin }));

    render(<LoginButton username="me@example.com" password="password123" />);

    const button = screen.getByRole('button', { name: /login/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');

    // click again while loading
    fireEvent.click(button);

    // wait for mockLogin to be called once
    await waitFor(() => expect(mockLogin).toHaveBeenCalledTimes(1));

    // after promise resolves the button should be re-enabled (depending on implementation)
    await waitFor(() => expect(button).not.toBeDisabled());
  });
});
