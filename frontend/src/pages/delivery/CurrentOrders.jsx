import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';

const CurrentOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // to track pickup/deliver button loading
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  useEffect(() => {
    const fetchCurrentOrders = async () => {
      try {
        if (!token) {
          console.warn('No auth token available');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/deliveries/current', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch');
        }

        setOrders(data);
      } catch (err) {
        console.error('Failed to fetch current orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentOrders();
  }, [token]);

  const handlePickup = async (id) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/deliveries/${id}/pickup`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Pickup failed');
      }

      setOrders((prev) =>
        prev.map((order) =>
          order._id === id ? { ...order, status: 'picked_up' } : order
        )
      );
    } catch (err) {
      console.error('Pickup error:', err);
      alert('Failed to mark order as picked up.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeliver = async (id) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/deliveries/${id}/deliver`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Delivery failed');
      }

      // Remove delivered order from list
      setOrders((prev) => prev.filter((order) => order._id !== id));
    } catch (err) {
      console.error('Delivery error:', err);
      alert('Failed to mark order as delivered.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <p>Loading current orders...</p>;
  if (!Array.isArray(orders)) return <p>Unexpected data format received.</p>;
  if (orders.length === 0) return <p>No current delivery orders.</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Current Orders</h1>
      <table className="w-full border-collapse border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Order ID</th>
            <th className="border p-2">Client</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Pickup Address</th>
            <th className="border p-2">Delivery Address</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order._id} className="hover:bg-gray-50">
              <td className="border p-2">{order._id}</td>
              <td className="border p-2">{order.client?.name || order.client}</td>
              <td className="border p-2">{order.status}</td>
              <td className="border p-2">{order.pickupDetails?.address}</td>
              <td className="border p-2">{order.deliveryDetails?.address}</td>
              <td className="border p-2 space-x-2">
                <button
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                  onClick={() => alert(`View order ${order._id}`)}
                  disabled={actionLoading === order._id}
                >
                  View
                </button>

                {order.status === 'assigned' && (
                  <button
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                    onClick={() => handlePickup(order._id)}
                    disabled={actionLoading === order._id}
                  >
                    Mark as Picked Up
                  </button>
                )}

                {order.status === 'picked_up' && (
                  <button
                    className="bg-green-600 text-white px-2 py-1 rounded"
                    onClick={() => handleDeliver(order._id)}
                    disabled={actionLoading === order._id}
                  >
                    Mark as Delivered
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CurrentOrders;
