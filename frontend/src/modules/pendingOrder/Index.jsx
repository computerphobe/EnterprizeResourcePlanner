import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Spin, Typography, message } from 'antd';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectAuth } from '@/redux/auth/selectors';
import { API_BASE_URL } from '@/config/serverApiConfig';

const { Title } = Typography;

const PendingOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}order/pending-invoice`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          console.log('📋 Fetched orders:', data.result); // Debug log
          setOrders(data.result || []);
        } else {
          throw new Error(data.message || 'Failed to load pending orders');
        }
      } catch (err) {
        console.error('Error loading orders:', err);
        message.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchPendingOrders();
  }, [token]);

  const handleCreateInvoice = (record) => {
    console.log('🎯 Creating invoice for record:', record);
    console.log('🆔 Record ID:', record._id);
    console.log('🔍 Full record object:', JSON.stringify(record, null, 2));
    
    const orderId = record._id;
    const url = `/invoice/create?orderId=${orderId}`;
    console.log('🚀 Navigating to:', url);
    
    navigate(url);
  };
  const columns = [
    {
      title: 'Order ID',
      dataIndex: '_id',
      key: '_id',
      render: (id) => (
        <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>
          {id}
        </span>
      )
    },
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber'
    },
    {
      title: 'Doctor',
      dataIndex: ['doctorId', 'name'],
      key: 'doctor'
    },
    {
      title: 'Hospital',
      dataIndex: 'hospitalName',
      key: 'hospital'
    },
    {
      title: 'Items Info',
      key: 'itemsInfo',
      render: (_, record) => {
        const returnInfo = record.returnInfo;
        if (!returnInfo || !returnInfo.hasReturns) {
          return <span>{returnInfo?.totalOriginalQuantity || 0} items</span>;
        }
        return (
          <div>
            <div>Total: {returnInfo.totalOriginalQuantity}</div>
            <div style={{ color: '#f50', fontSize: '12px' }}>
              Returned: {returnInfo.totalReturnedQuantity}
            </div>
            <div style={{ color: '#52c41a', fontSize: '12px' }}>
              Billable: {returnInfo.totalUsedQuantity}
            </div>
          </div>
        );
      }
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <div>
          <Tag color="blue">{status.toUpperCase()}</Tag>
          {record.returnInfo?.hasReturns && (
            <Tag color="orange" style={{ marginTop: 4 }}>
              Has Returns
            </Tag>
          )}
        </div>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          onClick={() => handleCreateInvoice(record)}
        >
          Create Invoice
        </Button>
      )
    }
  ];

  return (
    <div>
      <Title level={3}>Pending Invoicing Orders</Title>
      {loading ? (
        <Spin size="large" />
      ) : (
        <>
          <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#f0f2f5' }}>
            <p><strong>Debug Info:</strong></p>
            <p>Total Orders: {orders.length}</p>
            <p>Sample Order IDs: {orders.slice(0, 3).map(o => o._id).join(', ')}</p>
          </div>
          <Table dataSource={orders} columns={columns} rowKey="_id" />
        </>
      )}
    </div>
  );
};

export default PendingOrders;