import React, { useState } from 'react';
import { Input, Button, Card, Table, Tabs, Tag, Space, Typography, message, Modal, Descriptions, Divider, List, Row, Col } from 'antd';
import { SearchOutlined, EyeOutlined, FilePdfOutlined, DownloadOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';
import { API_BASE_URL } from '@/config/serverApiConfig';

const { Title, Text } = Typography;

const InvoiceDebugger = () => {
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const { current } = useSelector(selectAuth);
  const token = current?.token || '';

  const handleSearch = async () => {
    if (!clientId.trim()) {
      return message.error('Please enter a client ID');
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}admin/client-invoices/${clientId.trim()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      
      const data = await response.json();
      if (data.success) {
        setInvoices(data.result || []);
        message.success(`Found ${data.result?.length || 0} invoices for client ID: ${clientId}`);
      } else {
        throw new Error(data.message || 'Failed to fetch invoices');
      }
    } catch (error) {
      message.error(error.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (invoice) => {
    setSelectedInvoice(invoice);
    setDetailsVisible(true);
  };

  const handleGeneratePDF = (invoice) => {
    if (invoice.pdf) {
      window.open(`/api/pdf/${invoice.pdf}`, '_blank');
    } else {
      message.warning('PDF not available for this invoice');
    }
  };
  
  const closeDetails = () => {
    setSelectedInvoice(null);
    setDetailsVisible(false);
  };

  const columns = [
    {
      title: 'Bill Number',
      dataIndex: 'billNumber',
      key: 'billNumber',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'amount',
      render: (amount) => `₹ ${amount.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'paid') color = 'green';
        else if (status === 'pending') color = 'orange';
        else if (status === 'cancelled') color = 'red';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            size="small"
          >
            View
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => handleGeneratePDF(record)}
            size="small"
          >
            PDF
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <Title level={2}>Admin Invoice Debugger</Title>
      </div>
      <Card className="mb-4">
        <div className="flex items-center">
          <Input 
            placeholder="Enter Client ID" 
            value={clientId} 
            onChange={e => setClientId(e.target.value)} 
            style={{ width: '300px' }}
          />
          <Button 
            type="primary" 
            icon={<SearchOutlined />} 
            onClick={handleSearch} 
            loading={loading} 
            style={{ marginLeft: '16px' }}
          >
            Search Invoices
          </Button>
        </div>
      </Card>
      
      {invoices.length > 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <Title level={4} className="mb-4">
            Found {invoices.length} invoices for Client ID: {clientId}
          </Title>
          <Table
            dataSource={invoices}
            columns={columns}
            rowKey="_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </div>
      ) : loading ? null : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <Text>Enter a client ID and click Search to find invoices</Text>
        </div>
      )}

      {/* Invoice Details Modal */}
      <Modal
        title={`Invoice Details - ${selectedInvoice?.billNumber || ''}`}
        open={detailsVisible}
        onCancel={closeDetails}
        footer={[
          <Button key="close" onClick={closeDetails}>
            Close
          </Button>,
          selectedInvoice?.pdf && (
            <Button 
              key="pdf" 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={() => handleGeneratePDF(selectedInvoice)}
            >
              Download PDF
            </Button>
          )
        ]}
        width={800}
      >
        {selectedInvoice && (
          <div>
            <Card title="Invoice Information" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Invoice Number">
                      <Text strong>{selectedInvoice.billNumber}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Date">
                      {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Due Date">
                      {selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : 'N/A'}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Status">
                      <Tag color={selectedInvoice.status === 'paid' ? 'green' : 
                              selectedInvoice.status === 'partially' ? 'blue' : 'orange'}>
                        {selectedInvoice.status.toUpperCase()}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Total Amount">
                      <Text strong>₹{selectedInvoice.totalAmount.toFixed(2)}</Text>
                    </Descriptions.Item>
                    {selectedInvoice.credit > 0 && (
                      <Descriptions.Item label="Amount Paid">
                        <Text type="success">₹{selectedInvoice.credit.toFixed(2)}</Text>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            <Card title="Client Information" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Client Name">
                  {selectedInvoice.client?.name || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Client ID">
                  {selectedInvoice.client?._id || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="User ID">
                  {selectedInvoice.client?.userId || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {selectedInvoice.client?.email || 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {selectedInvoice.items && selectedInvoice.items.length > 0 && (
              <Card title="Invoice Items" size="small" style={{ marginBottom: 16 }}>
                <List
                  dataSource={selectedInvoice.items}
                  renderItem={(item) => (
                    <List.Item>
                      <div style={{ width: '100%' }}>
                        <Row justify="space-between" align="middle">
                          <Col span={16}>
                            <Text strong>{item.itemName}</Text>
                            {item.description && (
                              <>
                                <br />
                                <Text type="secondary">{item.description}</Text>
                              </>
                            )}
                          </Col>
                          <Col span={8} style={{ textAlign: 'right' }}>
                            <div>{item.quantity} x ₹{item.price.toFixed(2)}</div>
                            <Text strong>₹{item.total.toFixed(2)}</Text>
                          </Col>
                        </Row>
                      </div>
                    </List.Item>
                  )}
                />
                
                <Divider style={{ margin: '12px 0' }} />
                <Row justify="end">
                  <Col span={12}>
                    <div style={{ textAlign: 'right', paddingRight: '16px' }}>
                      <div>
                        <Text>Subtotal: </Text>
                        <Text strong>₹{selectedInvoice.subTotal.toFixed(2)}</Text>
                      </div>
                      {selectedInvoice.taxRate > 0 && (
                        <div>
                          <Text>Tax ({selectedInvoice.taxRate}%): </Text>
                          <Text strong>₹{selectedInvoice.taxTotal.toFixed(2)}</Text>
                        </div>
                      )}
                      {selectedInvoice.discount > 0 && (
                        <div>
                          <Text>Discount: </Text>
                          <Text strong>₹{selectedInvoice.discount.toFixed(2)}</Text>
                        </div>
                      )}
                      <div style={{ marginTop: '8px' }}>
                        <Text strong>Total: </Text>
                        <Text strong style={{ fontSize: '16px' }}>₹{selectedInvoice.totalAmount.toFixed(2)}</Text>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>
            )}

            {selectedInvoice.notes && (
              <Card title="Notes" size="small">
                <Text>{selectedInvoice.notes}</Text>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InvoiceDebugger;
