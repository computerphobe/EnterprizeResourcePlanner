import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  useEffect(() => {
    if (!token) {
      console.warn('No auth token available');
      setLoading(false);
      return;
    }

    fetch('/api/deliveries/history', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then(data => {
        setHistory(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch delivery history', err);
        setLoading(false);
      });
  }, [token]);

  if (loading) return <p>Loading delivery history...</p>;

  if (!Array.isArray(history)) return <p>Unexpected data format received.</p>;

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
              <td>{order.deliveredAt ? new Date(order.deliveredAt).toLocaleString() : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default History;
