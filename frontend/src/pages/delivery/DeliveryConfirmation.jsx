import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';

const DeliveryConfirmation = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  useEffect(() => {
    if (!token) {
      console.warn('No auth token available');
      setLoading(false);
      return;
    }

    fetch('/api/deliveries/pending-delivery', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch delivery orders', err);
        setLoading(false);
      });
  }, [token]);

  const confirmDelivery = (id) => {
    fetch(`/api/deliveries/${id}/deliver`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        if (res.ok) {
          alert('Delivery confirmed!');
          setOrders(orders.filter(order => order._id !== id));
        } else {
          alert('Failed to confirm delivery.');
        }
      })
      .catch(err => {
        console.error('Error confirming delivery:', err);
      });
  };

  if (loading) return <p>Loading delivery confirmations...</p>;

  if (!Array.isArray(orders)) return <p>Unexpected data format received.</p>;

  if (orders.length === 0) return <p>No deliveries to confirm.</p>;

  return (
    <div>
      <h1>Delivery Confirmation</h1>
      <ul>
        {orders.map(order => (
          <li key={order._id}>
            Order: {order._id} - Client: {order.client?.name || order.client}
            <button onClick={() => confirmDelivery(order._id)}>Confirm Delivery</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DeliveryConfirmation;
