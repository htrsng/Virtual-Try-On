// No provider is connected. Never simulate payment success in the browser.
export default function OnlinePaymentModal({ isOpen, onClose }) {
    if (!isOpen) return null;
    return (
        <div role="dialog" aria-modal="true" aria-labelledby="payment-unavailable-title">
            <h3 id="payment-unavailable-title">Thanh toán trực tuyến chưa khả dụng</h3>
            <p>Vui lòng chọn thanh toán khi nhận hàng hoặc chuyển khoản ngân hàng.</p>
            <button type="button" onClick={onClose}>Đóng</button>
        </div>
    );
}
