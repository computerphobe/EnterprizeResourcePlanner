import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';

const CurrentOrders = () => {
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

    fetch('/api/deliveries/current', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Fetch error: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch current orders:', err);
        setLoading(false);
      });
  }, [token]);

  if (loading) return <p>Loading current orders...</p>;

  if (!Array.isArray(orders)) return <p>Unexpected data format received.</p>;

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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CurrentOrders;
