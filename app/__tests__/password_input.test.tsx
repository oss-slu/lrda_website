import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import PasswordInput from '../../components/ui/password-input'

describe('PasswordInput', () => {
  test('toggles visibility when button is clicked', () => {
    const handleChange = jest.fn()
    render(<PasswordInput id="pw" password="secret" onPasswordChange={handleChange} />)

  const input = screen.getByDisplayValue('secret')
  // initial type should be password
  expect(input).toHaveAttribute('type', 'password')

  const btn = screen.getByRole('button', { name: /show password/i })
    fireEvent.click(btn)

    // after click, type should be text
    expect(input).toHaveAttribute('type', 'text')

    fireEvent.click(btn)
    expect(input).toHaveAttribute('type', 'password')
  })
})
