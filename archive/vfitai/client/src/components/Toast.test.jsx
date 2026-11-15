import { cleanup, render, screen, act } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import Toast from './Toast';
import React from 'react';

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('Toast Component', () => {
  it('COMP-TOAST-01: empty message renders no status', () => {
    const { container } = render(<Toast message="" onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('COMP-TOAST-02: success content is announced through a live status', () => {
    render(<Toast message="Test Message" type="success" onClose={() => {}} />);
    expect(screen.getByText('Test Message')).toBeInTheDocument();
    expect(screen.getByText('Hoàn tất')).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('COMP-TOAST-03: closes at the deadline, not before', () => {
    vi.useFakeTimers();
    const onCloseMock = vi.fn();
    render(<Toast message="Test" type="info" onClose={onCloseMock} />);
    
    act(() => {
      vi.advanceTimersByTime(2549);
    });
    expect(onCloseMock).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(onCloseMock).toHaveBeenCalledExactlyOnceWith();
  });
  it('COMP-TOAST-04: unmount cancels the pending callback', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const { unmount } = render(<Toast message="pending" onClose={onClose} />);
    unmount();
    act(() => { vi.advanceTimersByTime(5000); });
    expect(onClose).not.toHaveBeenCalled();
  });
  it('COMP-TOAST-05: unknown type uses the info title and icon', () => {
    render(<Toast message="Info" type="unknown" onClose={vi.fn()} />);
    expect(screen.getByText('Thông báo')).toBeInTheDocument();
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
  });
  it('COMP-TOAST-06: replacing onClose cancels the previous callback', () => {
    vi.useFakeTimers();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<Toast message="first" onClose={first} />);
    act(() => { vi.advanceTimersByTime(1000); });
    rerender(<Toast message="second" onClose={second} />);
    act(() => { vi.advanceTimersByTime(2550); });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledExactlyOnceWith();
  });
});
