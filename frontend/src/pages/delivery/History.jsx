import React, { useEffect, useState } from 'react';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/deliveries/history')
      .then(res => res.json())
      .then(data => {
        setHistory(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch delivery history', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading delivery history...</p>;

  if (history.length === 0) return <p>No past deliveries found.</p>;

  return (
    <div>
      <h1>Delivery History</h1>
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Client</th>
            <th>Status</th>
            <th>Delivered At</th>
          </tr>
        </thead>
        <tbody>
          {history.map(order => (
            <tr key={order._id}>
              <td>{order._id}</td>
              <td>{order.client?.name || order.client}</td>
              <td>{order.status}</td>
              <td>{new Date(order.deliveredAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default History;
