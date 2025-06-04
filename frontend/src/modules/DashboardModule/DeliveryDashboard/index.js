import React, { useEffect, useState } from 'react';
import { Badge } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCurrentDeliveries, fetchDeliveryHistory } from '@/modules/actions/deliveryActions';

const DeliveryDashboard = () => {
  const dispatch = useDispatch();
  const { currentDeliveries, deliveryHistory } = useSelector((state) => state.delivery);
  const [currentColumns, setCurrentColumns] = useState([]);
  const [historyColumns, setHistoryColumns] = useState([]);

  useEffect(() => {
    dispatch(fetchCurrentDeliveries());
    dispatch(fetchDeliveryHistory());
  }, [dispatch]);

  useEffect(() => {
    const currentCols = [
      {
        title: 'Order Number',
        dataIndex: 'orderNumber',
        key: 'orderNumber',
      },
      {
        title: 'Pickup Status',
        dataIndex: 'pickupStatus',
        key: 'pickupStatus',
        render: (status) => (
          <Badge
            status={status === 'picked_up' ? 'success' : 'warning'}
            text={status === 'picked_up' ? 'Picked Up' : 'Pending Pickup'}
          />
        ),
      },
      {
        title: 'Delivery Status',
        dataIndex: 'deliveryStatus',
        key: 'deliveryStatus',
        render: (status) => (
          <Badge
            status={status === 'delivered' ? 'success' : 'processing'}
            text={status === 'delivered' ? 'Delivered' : 'In Transit'}
          />
        ),
      },
      {
        title: 'Customer',
        dataIndex: 'customerName',
        key: 'customerName',
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_, record) => (
          <>
            {record.pickupStatus !== 'picked_up' && (
              <button className="action-btn" onClick={() => handlePickupConfirm(record._id)}>
                Confirm Pickup
              </button>
            )}
            {record.pickupStatus === 'picked_up' && record.deliveryStatus !== 'delivered' && (
              <button className="action-btn" onClick={() => handleDeliveryConfirm(record._id)}>
                Confirm Delivery
              </button>
            )}
          </>
        ),
      },
    ];

    const historyCols = [
      {
        title: 'Order Number',
        dataIndex: 'orderNumber',
        key: 'orderNumber',
      },
      {
        title: 'Delivered On',
        dataIndex: 'deliveredAt',
        key: 'deliveredAt',
        render: (date) => (date ? new Date(date).toLocaleString() : 'N/A'),
      },
      {
        title: 'Customer',
        dataIndex: 'customerName',
        key: 'customerName',
      },
    ];

    setCurrentColumns(currentCols);
    setHistoryColumns(historyCols);
  }, []);

  const handlePickupConfirm = (orderId) => {
    console.log(`Pickup confirmed for order ${orderId}`);
    // TODO: dispatch pickup confirmation action
    // dispatch(confirmPickup(orderId));
  };

  const handleDeliveryConfirm = (orderId) => {
    console.log(`Delivery confirmed for order ${orderId}`);
    // TODO: dispatch delivery confirmation action
    // dispatch(confirmDelivery(orderId));
  };

  return (
    <div className="delivery-dashboard">
      <h2 className="dashboard-title">Delivery Dashboard</h2>

      <section className="dashboard-card" aria-labelledby="current-deliveries-heading">
        <h3 id="current-deliveries-heading">Current Deliveries</h3>
        {currentDeliveries && currentDeliveries.length > 0 ? (
          <table className="dashboard-table">
            <thead>
              <tr>
                {currentColumns.map((col) => (
                  <th key={col.key} scope="col">
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentDeliveries.map((order) => (
                <tr key={order._id}>
                  <td>{order.orderNumber}</td>
                  <td>
                    <Badge
                      status={order.pickupStatus === 'picked_up' ? 'success' : 'warning'}
                      text={order.pickupStatus === 'picked_up' ? 'Picked Up' : 'Pending Pickup'}
                    />
                  </td>
                  <td>
                    <Badge
                      status={order.deliveryStatus === 'delivered' ? 'success' : 'processing'}
                      text={order.deliveryStatus === 'delivered' ? 'Delivered' : 'In Transit'}
                    />
                  </td>
                  <td>{order.customerName}</td>
                  <td>
                    {order.pickupStatus !== 'picked_up' && (
                      <button className="action-btn" onClick={() => handlePickupConfirm(order._id)}>
                        Confirm Pickup
                      </button>
                    )}
                    {order.pickupStatus === 'picked_up' && order.deliveryStatus !== 'delivered' && (
                      <button className="action-btn" onClick={() => handleDeliveryConfirm(order._id)}>
                        Confirm Delivery
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No current deliveries assigned.</p>
        )}
      </section>

      <section className="dashboard-card" aria-labelledby="delivery-history-heading">
        <h3 id="delivery-history-heading">Delivery History</h3>
        {deliveryHistory && deliveryHistory.length > 0 ? (
          <table className="dashboard-table">
            <thead>
              <tr>
                {historyColumns.map((col) => (
                  <th key={col.key} scope="col">
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deliveryHistory.map((historyItem) => (
                <tr key={historyItem._id}>
                  <td>{historyItem.orderNumber}</td>
                  <td>{historyItem.deliveredAt ? new Date(historyItem.deliveredAt).toLocaleString() : 'N/A'}</td>
                  <td>{historyItem.customerName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No delivery history available.</p>
        )}
      </section>
    </div>
  );
};

export default DeliveryDashboard;
