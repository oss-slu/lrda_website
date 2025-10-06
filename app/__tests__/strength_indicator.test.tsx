import React from 'react';
import { render, screen } from '@testing-library/react';
import StrengthIndicator from '../../components/ui/strength-indicator';

describe('StrengthIndicator', () => {
  test('shows unmet requirements for a weak password and calls onUnmet', () => {
    const mockOnUnmet = jest.fn();
    render(<StrengthIndicator password="abc" onUnmet={mockOnUnmet} />);

    // weak password should show the requirements in the DOM
    expect(screen.getByText(/At least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/Uppercase letter/i)).toBeInTheDocument();

    // callback should be called with an array of unmet error labels
    expect(mockOnUnmet).toHaveBeenCalled();
    const calledWith = mockOnUnmet.mock.calls[0][0];
    expect(Array.isArray(calledWith)).toBe(true);
    expect(calledWith.length).toBeGreaterThan(0);
  });

  test('shows all met for a strong password', () => {
    render(<StrengthIndicator password="Abcdef1!" />);

    // all requirement labels should be visible and at least one should be green (met)
    expect(screen.getByText(/At least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/Uppercase letter/i)).toBeInTheDocument();
    // visual checks are limited in JSDOM; assert that met labels have the green text class
    const special = screen.getByText(/Special character/i);
    const atLeast8 = screen.getByText(/At least 8 characters/i);
    expect(special).toHaveClass('text-green-500');
    expect(atLeast8).toHaveClass('text-green-500');
  });
});
