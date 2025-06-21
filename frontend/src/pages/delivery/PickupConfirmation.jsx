import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';
import { Table, Button, Typography, Alert, message, Modal, Descriptions, Input } from 'antd';

const { Title } = Typography;

const PickupConfirmation = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editableItems, setEditableItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  // Fetch pickup orders
  const fetchOrders = () => {
    setLoading(true);
    fetch('/api/deliveries/pickup', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch pickup orders');
        }
        return res.json();
      })
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        message.error(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (token) fetchOrders();
    else {
      setOrders([]);
      setLoading(false);
    }
  }, [token]);

  // Open modal with selected order and prepare editable items with returnQuantity
  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    const initializedItems = order.items?.map(item => ({
      ...item,
      returnAmount: item.returnAmount != null ? item.returnAmount : 0,
    })) || [];
    const returnItems = editableItems.map(item => ({
    itemId: item._id,
    returnAmount: item.returnAmount || 0,
    }));
    setEditableItems(initializedItems);
    setModalVisible(true);
  };

  // Update local returnAmount state on input change
  const handleReturnAmountChange = (value, index) => {
    const val = Number(value);
    if (val < 0) {
      message.error('Return amount cannot be negative');
      return;
    }

    const updatedItems = [...editableItems];
    updatedItems[index].returnAmount = isNaN(val) ? 0 : val;
    setEditableItems(updatedItems);
  };

  // PATCH backend immediately when returnQuantity changes for an item
  useEffect(() => {
    if (!selectedOrder) return;

    // Debounce or immediate update can be implemented here.
    // For simplicity, no debounce — only update when editableItems changes
    // (Be careful: This will cause a fetch every change. You can optimize later.)

    // For demo, no immediate patch to backend on every keystroke
  }, [editableItems, selectedOrder]);

  // Validate form: all returnQuantity are numbers >= 0
  const isFormValid = () => {
    return editableItems.every(item =>
      item.returnAmount !== undefined &&
      item.returnAmount !== null &&
      !isNaN(item.returnAmount) &&
      item.returnAmount >= 0
    );
  };

  // Confirm pickup: send all return quantities and confirm pickup
  const handleConfirmPickup = () => {
    if (!selectedOrder) return;

    setModalLoading(true);

    const deliveryId = selectedOrder._id;
    const returnItems = editableItems.map(item => ({
      itemId: item._id,
      returnQuantity: item.returnQuantity || 0,
    }));

    fetch(`/api/deliveries/${deliveryId}/pickup-confirm`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'picked-up',
        returnItems,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to confirm pickup');
        }
        return res.json();
      })
      .then(() => {
        message.success('Pickup confirmed successfully');
        setModalVisible(false);
        fetchOrders();
      })
      .catch((err) => {
        message.error(err.message);
      })
      .finally(() => {
        setModalLoading(false);
      });
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: '_id',
      key: '_id',
      render: text => text || '-',
    },
    {
      title: 'Client',
      dataIndex: ['client', 'name'],
      key: 'client',
      render: (text, record) => record.client?.name || record.client || '-',
    },
    {
      title: 'Address',
      dataIndex: ['pickupDetails', 'address'],
      key: 'address',
      render: (text, record) => record.pickupDetails?.address || '-',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="primary" onClick={() => handleViewDetails(record)}>
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Pickup Confirmation</Title>
      {loading ? (
        <Alert message="Loading pickup orders..." type="info" />
      ) : orders.length === 0 ? (
        <Alert message="Nothing to display" type="warning" />
      ) : (
        <Table
          dataSource={orders}
          columns={columns}
          rowKey={record => record._id}
          pagination={false}
        />
      )}

      <Modal
        title="Pickup Order Details"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)} disabled={modalLoading}>
            Close
          </Button>,
          <Button
            key="confirm"
            type="primary"
            disabled={!isFormValid()}
            loading={modalLoading}
            onClick={handleConfirmPickup}
          >
            Confirm Pickup
          </Button>,
        ]}
      >
        {selectedOrder ? (
          <>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Order ID">{selectedOrder._id}</Descriptions.Item>
              <Descriptions.Item label="Client Name">{selectedOrder.client?.name || '-'}</Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ marginTop: '16px' }}>Items to be Returned</Title>
            {editableItems.length > 0 ? (
              <Table
                dataSource={editableItems}
                columns={[
                  {
                    title: 'Item Name',
                    dataIndex: 'name',
                    key: 'name',
                  },
                  {
                    title: 'Quantity',
                    dataIndex: 'quantity',
                    key: 'quantity',
                  },
                  {
                    title: 'Price',
                    dataIndex: 'price',
                    key: 'price',
                    render: price => price != null ? `₹${price.toFixed(2)}` : '-',
                  },
                  {
                    title: 'Return Amount',
                    key: 'returnAmount',
                    render: (_, record, index) => (
                      <Input
                        type="number"
                        min={0}
                        value={record.returnAmount}
                        onChange={e => handleReturnAmountChange(e.target.value, index)}
                        placeholder="Enter return amount"
                      />
                    ),
                  },
                ]}
                rowKey={(item) => item._id}
                pagination={false}
                size="small"
              />
            ) : (
              <p>No items listed.</p>
            )}
          </>
        ) : (
          <p>No details available.</p>
        )}
      </Modal>
    </div>
  );
};

export default PickupConfirmation;
