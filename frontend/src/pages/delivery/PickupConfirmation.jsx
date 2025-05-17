import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';

const PickupConfirmation = () => {
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

    fetch('/api/deliveries/pending-pickup', {
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
        console.error('Failed to fetch pickup orders', err);
        setLoading(false);
      });
  }, [token]);

  const confirmPickup = (id) => {
    fetch(`/api/deliveries/${id}/pickup`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        if (res.ok) {
          alert('Pickup confirmed!');
          setOrders(orders.filter(order => order._id !== id));
        } else {
          alert('Failed to confirm pickup.');
        }
      })
      .catch(err => {
        console.error('Error confirming pickup:', err);
      });
  };

  if (loading) return <p>Loading pickup orders...</p>;
  if (!Array.isArray(orders)) return <p>Unexpected data format.</p>;
  if (orders.length === 0) return <p>No pickups to confirm.</p>;

  return (
    <div>
      <h1>Pickup Confirmation</h1>
      <ul>
        {orders.map(order => (
          <li key={order._id}>
            Order: {order._id} - Client: {order.client?.name || order.client}
            <button onClick={() => confirmPickup(order._id)}>Confirm Pickup</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PickupConfirmation;
