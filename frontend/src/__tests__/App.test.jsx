import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import App from '../App';

// Mock the API module
vi.mock('../api', () => ({
  api: {
    getPages: vi.fn().mockResolvedValue([]),
    getPage: vi.fn().mockResolvedValue({ id: '1', title: 'Test', content: '', updated_at: new Date().toISOString() }),
    createPage: vi.fn().mockResolvedValue({ id: '2', title: 'Untitled' }),
    updatePage: vi.fn().mockResolvedValue({}),
    deletePage: vi.fn().mockResolvedValue({ success: true }),
    searchPages: vi.fn().mockResolvedValue([]),
    getVersions: vi.fn().mockResolvedValue([]),
  },
}));

afterEach(() => {
  cleanup();
});

describe('App', () => {
  it('renders the sidebar', () => {
    const { getByTestId } = render(<App />);
    expect(getByTestId('sidebar')).toBeInTheDocument();
  });

  it('shows empty state when no page is selected', () => {
    const { getByText } = render(<App />);
    expect(getByText('Select a page or create a new one')).toBeInTheDocument();
  });

  it('renders the new page button', () => {
    const { getByTestId } = render(<App />);
    expect(getByTestId('new-page-btn')).toBeInTheDocument();
  });
});
