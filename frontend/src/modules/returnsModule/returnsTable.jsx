import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message, Tag } from 'antd';
import { getReturns } from './service';
import dayjs from 'dayjs';
import RecipientForm from './RecipientForm';

export default function ReturnsTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getReturns();
      console.log('API Response:', result);

      if (result && result.success) {
        const returnsData = result.result || [];
        console.log('Returns data to display:', returnsData);
        setData(returnsData);
        
        if (returnsData.length === 0) {
          message.info('No returns found. Create a new return using the "Add Return" button.');
        }
      } else {
        console.error('API call failed:', result);
        message.error(result?.message || 'Failed to load returns');
        setData([]);
      }
    } catch (err) {
      console.error('Error loading returns:', err);
      message.error('Error loading returns: ' + (err.message || 'Unknown error'));
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkAsUsed = (returnId) => {
    setSelectedReturn(returnId);
    setIsRecipientModalOpen(true);
  };

  const handleRecipientModalClose = (shouldRefresh = false) => {
    setIsRecipientModalOpen(false);
    setSelectedReturn(null);
    if (shouldRefresh) {
      loadData();
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'Available for reuse': 'green',
      'Disposed': 'red',
      'Damaged': 'orange'
    };
    return statusColors[status] || 'default';
  };

  const columns = [
    {
      title: 'Item Name',
      dataIndex: ['originalItemId', 'itemName'],
      key: 'itemName',
      render: (text, record) => {
        const item = record.originalItemId;
        return item ? item.itemName : 'N/A';
      }
    },
    {
      title: 'Returned Quantity',
      dataIndex: 'returnedQuantity',
      key: 'returnedQuantity',
      sorter: (a, b) => a.returnedQuantity - b.returnedQuantity
    },
    {
      title: 'Return Date',
      dataIndex: 'returnDate',
      key: 'returnDate',
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : 'N/A',
      sorter: (a, b) => new Date(a.returnDate) - new Date(b.returnDate)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status || 'N/A'}
        </Tag>
      )
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (text) => text || 'N/A'
    },
    {
      title: 'Recipient',
      dataIndex: 'recipient',
      key: 'recipient',
      render: (recipient) => {
        if (!recipient) return 'N/A';
        return (
          <div>
            <div><strong>Name:</strong> {recipient.name}</div>
            <div><strong>Dept:</strong> {recipient.department}</div>
            {recipient.notes && <div><strong>Notes:</strong> {recipient.notes}</div>}
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status === 'Available for reuse' && (
            <Button 
              type="primary" 
              size="small"
              onClick={() => handleMarkAsUsed(record._id)}
            >
              Use Item
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table 
        rowKey="_id" 
        columns={columns} 
        dataSource={data} 
        loading={loading}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`
        }}
      />

      <RecipientForm
        open={isRecipientModalOpen}
        onClose={handleRecipientModalClose}
        returnId={selectedReturn}
      />
    </>
  );
}
