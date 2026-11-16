import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import OnlinePaymentModal from './OnlinePaymentModal';
import PaymentMethod from '../pages/checkout/PaymentMethod';
afterEach(() => { cleanup(); vi.useRealTimers(); });
test('unavailable payment never signals success even after timers advance', () => {
    vi.useFakeTimers(); const success = vi.fn(); const close = vi.fn();
    render(<OnlinePaymentModal isOpen onClose={close} onPaymentSuccess={success} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    vi.advanceTimersByTime(60000); expect(success).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' })); expect(close).toHaveBeenCalledTimes(1);
});
test('checkout offers supported COD/bank choices and sends canonical method', () => {
    const changed = vi.fn();
    render(<PaymentMethod paymentMethod="COD" setPaymentMethod={changed} t={key => key} />);
    const radios = screen.getAllByRole('radio'); expect(radios.map(radio => radio.value)).toEqual(['COD', 'banking']);
    fireEvent.click(radios[1]); expect(changed).toHaveBeenCalledWith('banking');
});
