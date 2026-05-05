import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersAPI, paymentsAPI } from '../api';
import { useToast } from '../context/ToastContext';
import './Cart.css';

function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [order, setOrder] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentChoice, setPaymentChoice] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await ordersAPI.getOrder(id);
        const nextOrder = res.data.order || res.data;
        setOrder(nextOrder);
      } catch (err) {
        showError('Failed to load order');
      }
    };
    fetchOrder();
  }, [id, showError]);

  const handlePay = async () => {
    if (!order) return;

    if (!paymentChoice) {
      showError('Please choose cash or card first');
      return;
    }

    if (paymentChoice === 'card') {
      if (!cardName.trim() || !cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim()) {
        showError('Please enter your card details');
        return;
      }

      const digitsOnlyCard = cardNumber.replace(/\D/g, '');
      const digitsOnlyCvv = cardCvv.replace(/\D/g, '');

      if (digitsOnlyCard.length < 12) {
        showError('Please enter a valid card number');
        return;
      }

      if (digitsOnlyCvv.length < 3) {
        showError('Please enter a valid CVV');
        return;
      }
    }

    if (paymentChoice === 'card' && cardNumber.trim().length < 4) {
      showError('Please enter a valid card number');
      return;
    }

    setProcessing(true);
    try {
      const last4 = paymentChoice === 'card' ? cardNumber.replace(/\D/g, '').slice(-4) : null;
      const res = await paymentsAPI.pay({
        orderId: order._id,
        paymentMethod: paymentChoice,
        cardLast4: last4,
      });

      const updatedOrder = res.data.order || res.data;
      setOrder(updatedOrder);

      if (paymentChoice === 'card') {
        showSuccess('Card payment successful');
      } else {
        showSuccess('Cash on delivery selected. Order sent to seller successfully.');
      }

      setTimeout(() => navigate(`/orders/${updatedOrder._id}`), 1000);
    } catch (err) {
      showError(err.response?.data?.error || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (!order) return <div className="loading">Loading order...</div>;

  return (
    <div className="container">
      <div className="page-title">Checkout</div>
      <div className="card">
        <h3>Order Summary</h3>
        <p><strong>Order ID:</strong> {order._id}</p>
        <p><strong>Total:</strong> ${Number(order.totalPrice || 0).toFixed(2)}</p>
        <p><strong>Payment Status:</strong> {order.paymentStatus}</p>
        <p><strong>Payment Method:</strong> {order.paymentMethod || 'Not selected yet'}</p>

        <h4>Items</h4>
        <ul>
          {order.items?.map((item) => (
            <li key={item._id || item.product?._id}>
              {item.product?.name || 'Item'} x{item.quantity} - ${Number(item.price || 0).toFixed(2)}
            </li>
          ))}
        </ul>

        <h4>Choose payment method</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => setPaymentChoice('cash')}
            disabled={processing}
            style={{
              padding: '16px 18px',
              borderRadius: '12px',
              border: paymentChoice === 'cash' ? '2px solid #1d4ed8' : '1px solid #cbd5e1',
              background: paymentChoice === 'cash' ? '#dbeafe' : '#ffffff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Pay by Cash
          </button>
          <button
            type="button"
            onClick={() => setPaymentChoice('card')}
            disabled={processing}
            style={{
              padding: '16px 18px',
              borderRadius: '12px',
              border: paymentChoice === 'card' ? '2px solid #1d4ed8' : '1px solid #cbd5e1',
              background: paymentChoice === 'card' ? '#dbeafe' : '#ffffff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Pay by Card
          </button>
        </div>

        {!paymentChoice && <p>Please pick a payment method to continue.</p>}

        {paymentChoice === 'cash' && order.paymentStatus !== 'completed' && (
          <div>
            <p>You chose cash. Your order will be sent to the seller and payment will be collected on delivery.</p>
            <button className="btn-primary" onClick={handlePay} disabled={processing}>
              {processing ? 'Processing...' : 'Confirm Cash Order'}
            </button>
          </div>
        )}

        {paymentChoice === 'card' && order.paymentStatus !== 'completed' && (
          <div>
            <div className="form-group">
              <label>Name on card</label>
              <input type="text" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="form-group">
              <label>Card Number</label>
              <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4111 1111 1111 1111" />
            </div>
            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label>Expiry</label>
                <input type="text" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="12/28" />
              </div>
              <div>
                <label>CVV</label>
                <input type="password" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="123" />
              </div>
            </div>
            <button className="btn-primary" onClick={handlePay} disabled={processing}>
              {processing ? 'Processing...' : 'Pay by Card'}
            </button>
          </div>
        )}

        {order.paymentStatus === 'completed' && (
          <div>
            <p>Payment completed successfully. Transaction: {order.paymentResult?.transactionId}</p>
            <button className="btn-primary" onClick={() => navigate(`/orders/${order._id}`)}>View Order</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Checkout;
