import React, { useState, useEffect } from 'react';

const PickupConfirmation = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/deliveries/pending-pickup')  // or your endpoint for pending pickups
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch pickup orders', err);
        setLoading(false);
      });
  }, []);

  const confirmPickup = (id) => {
    fetch(`/api/deliveries/${id}/pickup`, {
      method: 'POST',
    })
      .then(res => {
        if (res.ok) {
          alert('Pickup confirmed!');
          // Remove confirmed order from the list
          setOrders(orders.filter(order => order._id !== id));
        } else {
          alert('Failed to confirm pickup.');
        }
      });
  };

  if (loading) return <p>Loading pickup orders...</p>;

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
