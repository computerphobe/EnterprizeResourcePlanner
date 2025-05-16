import React, { useState, useEffect } from 'react';

const DeliveryConfirmation = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/deliveries/pending-delivery')  // or your endpoint for deliveries to confirm
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch delivery orders', err);
        setLoading(false);
      });
  }, []);

  const confirmDelivery = (id) => {
    fetch(`/api/deliveries/${id}/deliver`, {
      method: 'POST',
    })
      .then(res => {
        if (res.ok) {
          alert('Delivery confirmed!');
          setOrders(orders.filter(order => order._id !== id));
        } else {
          alert('Failed to confirm delivery.');
        }
      });
  };

  if (loading) return <p>Loading delivery confirmations...</p>;

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
