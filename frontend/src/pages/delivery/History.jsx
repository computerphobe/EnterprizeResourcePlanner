import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';
import { Table, Typography, Alert } from 'antd';

const { Title } = Typography;

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  useEffect(() => {
    if (!token) return setLoading(false);

    fetch('/api/deliveries/history', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setHistory(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch delivery history', err);
        setLoading(false);
      });
  }, [token]);

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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Delivered At',
      dataIndex: ['deliveryDetails', 'deliveryTime'],
      key: 'deliveredAt',
      render: (time) =>
        time ? new Date(time).toLocaleString() : '-',
    },
  ];

  return (
    <div>
      <Title level={2}>Delivery History</Title>
      {loading ? (
        <Alert message="Loading delivery history..." type="info" />
      ) : history.length === 0 ? (
        <Alert message="Nothing to display" type="warning" />
      ) : (
        <Table
          dataSource={history}
          columns={columns}
          rowKey={record => record._id}
          pagination={{ pageSize: 5 }}
        />
      )}
    </div>
  );
};

export default History;
