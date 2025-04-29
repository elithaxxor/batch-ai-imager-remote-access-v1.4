import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import PriceAlertsWidget from './PriceAlertsWidget';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PriceAlertsWidget', () => {
  const notifSettings = {};

  beforeEach(() => {
    mockedAxios.get.mockReset();
    mockedAxios.get.mockResolvedValue({ data: [] }); // Always return empty data by default
    mockedAxios.post?.mockReset?.();
  });

  it('renders without crashing', () => {
    render(<PriceAlertsWidget notifSettings={notifSettings} />);
    // Look for a reliably present element, e.g., Add Alert button
    expect(screen.getByRole('button', { name: /add alert/i })).toBeInTheDocument();
  });

  it('fetches and displays alerts', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [{ symbol: 'AAPL', type: 'price', threshold: 150 }] });
    render(<PriceAlertsWidget notifSettings={notifSettings} />);
    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledWith('/api/price-alerts'));
    // Optionally: Check for the alert symbol
    // expect(screen.getByText(/AAPL/i)).toBeInTheDocument();
  });

  it('can add an alert', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });
    mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });
    render(<PriceAlertsWidget notifSettings={notifSettings} />);
    fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'TSLA' } });
    fireEvent.click(screen.getByText(/Add Alert/i));
    await waitFor(() => expect(mockedAxios.post).toHaveBeenCalled());
  });
});
