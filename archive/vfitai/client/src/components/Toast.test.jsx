import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Toast from './Toast';
import React from 'react';

describe('Toast Component', () => {
  it('renders nothing when message is empty', () => {
    const { container } = render(<Toast message="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders message and correct title based on type', () => {
    render(<Toast message="Test Message" type="success" onClose={() => {}} />);
    expect(screen.getByText('Test Message')).toBeInTheDocument();
    expect(screen.getByText('Hoàn tất')).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('calls onClose after timeout', () => {
    vi.useFakeTimers();
    const onCloseMock = vi.fn();
    render(<Toast message="Test" type="info" onClose={onCloseMock} />);
    
    act(() => {
      vi.advanceTimersByTime(2600);
    });
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
