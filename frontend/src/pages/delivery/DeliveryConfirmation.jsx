import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';
import { Table, Button, Typography, Alert, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const { Title } = Typography;

const DeliveryConfirmation = () => {
  // Use AntD's message hook
  const [messageApi, contextHolder] = message.useMessage();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState({});
  const [confirmed, setConfirmed] = useState({});
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  useEffect(() => {
    if (!token) return setLoading(false);

    fetch('/api/deliveries/pending-delivery', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch delivery orders', err);
        setLoading(false);
      });
  }, [token]);

  const handlePhotoChange = ({ file }, orderId) => {
    const realFile = file.originFileObj || file;
    if (realFile) {
      setPhotos(prev => ({
        ...prev,
        [String(orderId)]: realFile,
      }));
      messageApi.success(`Photo selected for Order ID: ${orderId}`);
    }
  };

  const confirmDelivery = async (id) => {
    const photo = photos[id];
    if (!photo) {
      messageApi.warning('Please upload a photo before confirming delivery.');
      return;
    }

    const formData = new FormData();
    formData.append('photo', photo);

    try {
      const res = await fetch(`/api/deliveries/${id}/confirm`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        messageApi.success('Delivery confirmed!');
        setOrders(prev => prev.filter(order => order._id !== id));
        setPhotos(prev => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
        setConfirmed(prev => ({
          ...prev,
          [id]: true,
        }));
      } else {
        const err = await res.json();
        messageApi.error(err?.error || 'Failed to confirm delivery.');
      }
    } catch (err) {
      console.error('Error confirming delivery:', err);
      messageApi.error('Something went wrong while confirming delivery.');
    }
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: '_id',
      key: 'id',
    },
    {
      title: 'Client',
      dataIndex: ['client', 'name'],
      key: 'client',
      render: (_, record) => record.client?.name || record.client || '-',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => {
        const orderId = String(record._id);
        const photo = photos[orderId];
        const isConfirmed = confirmed[orderId];

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Upload
              beforeUpload={() => false}
              onChange={(info) => handlePhotoChange(info, orderId)}
              accept="image/*"
              showUploadList={false}
              disabled={isConfirmed}
            >
              <Button icon={<UploadOutlined />} disabled={isConfirmed}>
                {photo ? 'Uploaded' : 'Upload Photo'}
              </Button>
            </Upload>

            {photo && !isConfirmed && (
              <div style={{ fontSize: '0.85rem', color: '#555' }}>
                Selected: {photo.name}
              </div>
            )}

            <Button
              type="primary"
              disabled={!photo || isConfirmed}
              onClick={() => confirmDelivery(orderId)}
            >
              {isConfirmed ? 'Confirmed' : 'Confirm Delivery'}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      {/* Place contextHolder here so messages can render */}
      {contextHolder}
      <Title level={2}>Delivery Confirmation</Title>
      {loading ? (
        <Alert message="Loading delivery confirmations..." type="info" />
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
    </div>
  );
};

export default DeliveryConfirmation;
