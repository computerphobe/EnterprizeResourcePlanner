import React, { useEffect, useState } from 'react';

const CurrentOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/deliveries/current')
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch current orders', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading current orders...</p>;

  if (orders.length === 0) return <p>No current delivery orders.</p>;

  return (
    <div>
      <h1>Current Orders</h1>
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Client</th>
            <th>Status</th>
            <th>Pickup Address</th>
            <th>Delivery Address</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order._id}>
              <td>{order._id}</td>
              <td>{order.client?.name || order.client}</td>
              <td>{order.status}</td>
              <td>{order.pickupAddress}</td>
              <td>{order.deliveryAddress}</td>
              <td>
                <button onClick={() => alert(`View order ${order._id}`)}>View</button>
                {/* Add more actions here */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CurrentOrders;
