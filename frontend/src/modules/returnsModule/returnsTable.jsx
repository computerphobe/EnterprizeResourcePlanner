import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message, Tag, Modal, Image, Tooltip } from 'antd';
import { EyeOutlined, CameraOutlined, EditOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { getReturns } from './service';
import dayjs from 'dayjs';
import RecipientForm from './RecipientForm';

export default function ReturnsTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);
  const [collectionInfoModal, setCollectionInfoModal] = useState({
    visible: false,
    data: null
  });

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

  const handleViewCollectionInfo = (collectionMetadata) => {
    setCollectionInfoModal({
      visible: true,
      data: collectionMetadata
    });
  };

  const handleCloseCollectionModal = () => {
    setCollectionInfoModal({
      visible: false,
      data: null
    });
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
      title: 'Collection Info',
      dataIndex: 'collectionMetadata',
      key: 'collectionInfo',
      width: 150,
      render: (collectionMetadata, record) => {
        if (!collectionMetadata) {
          return <Tag color="default">Not Collected</Tag>;
        }

        const { collectorName, collectionDate, photo, customerSignature } = collectionMetadata;
        
        return (
          <Space direction="vertical" size="small">
            <div style={{ fontSize: '12px' }}>
              <div><strong>Collector:</strong> {collectorName || 'N/A'}</div>
              <div><strong>Date:</strong> {collectionDate ? dayjs(collectionDate).format('MM/DD HH:mm') : 'N/A'}</div>
            </div>
            <Space size="small">
              {photo && (
                <Tooltip title="View photo">
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<CameraOutlined />}
                    onClick={() => handleViewCollectionInfo(collectionMetadata)}
                  />
                </Tooltip>
              )}
              {customerSignature && (
                <Tooltip title="View signature">
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<EditOutlined />}
                    onClick={() => handleViewCollectionInfo(collectionMetadata)}
                  />
                </Tooltip>
              )}
              <Tooltip title="View details">
                <Button 
                  type="text" 
                  size="small" 
                  icon={<InfoCircleOutlined />}
                  onClick={() => handleViewCollectionInfo(collectionMetadata)}
                />
              </Tooltip>
            </Space>
          </Space>
        );
      }
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

      <Modal
        title="Collection Information"
        open={collectionInfoModal.visible}
        onCancel={handleCloseCollectionModal}
        footer={[
          <Button key="close" onClick={handleCloseCollectionModal}>
            Close
          </Button>
        ]}
        width={800}
      >
        {collectionInfoModal.data && (
          <div style={{ padding: '20px 0' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Collection Details */}
              <div>
                <h4 style={{ marginBottom: '16px', color: '#1890ff' }}>Collection Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <strong>Collector Name:</strong>
                    <div style={{ marginTop: '4px' }}>{collectionInfoModal.data.collectorName || 'N/A'}</div>
                  </div>
                  <div>
                    <strong>Collection Date:</strong>
                    <div style={{ marginTop: '4px' }}>
                      {collectionInfoModal.data.collectionDate 
                        ? dayjs(collectionInfoModal.data.collectionDate).format('YYYY-MM-DD HH:mm:ss') 
                        : 'N/A'}
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Notes:</strong>
                    <div style={{ marginTop: '4px' }}>{collectionInfoModal.data.notes || 'No notes provided'}</div>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              {collectionInfoModal.data.customerDetails && (
                <div>
                  <h4 style={{ marginBottom: '16px', color: '#1890ff' }}>Customer Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <strong>Name:</strong>
                      <div style={{ marginTop: '4px' }}>{collectionInfoModal.data.customerDetails.name || 'N/A'}</div>
                    </div>
                    <div>
                      <strong>Phone:</strong>
                      <div style={{ marginTop: '4px' }}>{collectionInfoModal.data.customerDetails.phone || 'N/A'}</div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <strong>Address:</strong>
                      <div style={{ marginTop: '4px' }}>{collectionInfoModal.data.customerDetails.address || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Photo */}
              {collectionInfoModal.data.photo && (
                <div>
                  <h4 style={{ marginBottom: '16px', color: '#1890ff' }}>Return Photo</h4>
                  <div style={{ textAlign: 'center' }}>
                    <Image
                      src={collectionInfoModal.data.photo}
                      alt="Return Photo"
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '300px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px'
                      }}
                      placeholder={
                        <div style={{ 
                          width: '200px', 
                          height: '150px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          backgroundColor: '#f5f5f5'
                        }}>
                          Loading...
                        </div>
                      }
                    />
                  </div>
                </div>
              )}

              {/* Customer Signature */}
              {collectionInfoModal.data.customerSignature && (
                <div>
                  <h4 style={{ marginBottom: '16px', color: '#1890ff' }}>Customer Signature</h4>
                  <div style={{ textAlign: 'center' }}>
                    <Image
                      src={collectionInfoModal.data.customerSignature}
                      alt="Customer Signature"
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '200px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        backgroundColor: '#fff'
                      }}
                      placeholder={
                        <div style={{ 
                          width: '200px', 
                          height: '100px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          backgroundColor: '#f5f5f5'
                        }}>
                          Loading...
                        </div>
                      }
                    />
                  </div>
                </div>
              )}
            </Space>
          </div>
        )}
      </Modal>
    </>
  );
}
