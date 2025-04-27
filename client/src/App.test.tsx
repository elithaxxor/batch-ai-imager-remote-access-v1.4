import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./components/Navigation', () => () => <nav>Mocked Navigation</nav>);

test('renders tendies tracker title', () => {
  render(<App />);
  const linkElement = screen.getByText(/tendies tracker™/i);
  expect(linkElement).toBeInTheDocument();
});
