import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, message, Space, Popconfirm, Modal, Form, InputNumber, Select, Input, DatePicker, Descriptions, Card, Divider, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, FilePdfOutlined, EyeOutlined } from '@ant-design/icons';
import { getPurchases, deletePurchase, generatePurchasePDF } from './service';
import moment from 'moment';
import { PlusOutlined } from '@ant-design/icons';
import { request } from '@/request';

const { Title, Text } = Typography;

export default function PurchaseList() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState(null);

  const handleGeneratePDF = async (record) => {
    try {
      message.loading({ content: 'Generating PDF...', key: 'pdfGeneration' });
      
      await generatePurchasePDF(record._id);
      
      message.success({ 
        content: 'PDF opened in new tab', 
        key: 'pdfGeneration' 
      });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      message.error({ 
        content: 'Failed to generate PDF', 
        key: 'pdfGeneration' 
      });
    }
  };

  const handleEdit = (record) => {
    console.log('Editing purchase with supplier details:', record);
    
    // If supplier is just an ID string, look it up from our suppliers list
    let supplierInfo = record.supplier;
    if (typeof record.supplier === 'string') {
      const foundSupplier = suppliers.find(s => s._id === record.supplier);
      if (foundSupplier) {
        supplierInfo = foundSupplier;
      }
    }
    
    // Process record with all needed details
    const processedRecord = {
      ...record,
      supplier: supplierInfo, // Use the complete supplier object
      date: record.date ? moment(record.date) : moment(),
      totalAmount: Number(record.totalAmount) || 0,
      status: record.status || 'Pending',
      paymentTerms: record.paymentTerms || 'Net 30',
      items: (record.items || []).map(item => {
        // Ensure item has all properties needed
        return {
          ...item,
          inventoryItem: typeof item.inventoryItem === 'object' 
            ? item.inventoryItem._id 
            : item.inventoryItem,
          quantity: Number(item.quantity) || 0,
          price: Number(item.price) || 0
        };
      })
    };
    
    setEditingPurchase(processedRecord);
    setIsEditModalOpen(true);
  };

  const handleView = (record) => {
    console.log('Viewing purchase details:', record);
    setViewingPurchase(record);
    setIsViewModalOpen(true);
  };

  const handleUpdatePurchase = async (id, values) => {
    try {
      message.loading({ content: 'Updating purchase...', key: 'updatePurchase' });
      
      const formattedValues = {
        ...values,
        date: values.date ? values.date.toISOString() : null
      };
      
      console.log('Updating purchase with data:', formattedValues);
      
      const result = await request.update({
        entity: 'purchases',
        id,
        jsonData: formattedValues
      });
      
      if (result.success) {
        message.success({ content: 'Purchase updated successfully', key: 'updatePurchase' });
        setIsEditModalOpen(false);
        fetchPurchases();
      } else {
        message.error({ content: result.message || 'Failed to update purchase', key: 'updatePurchase' });
      }
    } catch (error) {
      console.error('Error updating purchase:', error);
      message.error({ content: 'Failed to update purchase', key: 'updatePurchase' });
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => {
        if (!date) return 'No date';
        try {
          return moment(date).format('DD/MM/YYYY');
        } catch (e) {
          console.error('Invalid date:', date, e);
          return 'Invalid date';
        }
      }
    },
    {
      title: 'Supplier',
      dataIndex: 'supplierName',
      key: 'supplier'
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items) => `${items?.length || 0} items`
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => {
        const numAmount = Number(amount);
        return isNaN(numAmount) ? '$0.00' : `$${numAmount.toFixed(2)}`;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'Delivered') color = 'green';
        if (status === 'Pending') color = 'orange';
        if (status === 'Cancelled') color = 'red';
        if (status === 'Completed') color = 'blue';
        return <Tag color={color}>{status || 'Pending'}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            size="small"
          >
            View
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Edit
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => handleGeneratePDF(record)}
            size="small"
          >
            PDF
          </Button>
        </Space>
      )
    }
  ];

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      // First, get all suppliers so we can look up complete details by ID
      const suppliersResponse = await request.list({ entity: 'suppliers' });
      let suppliersMap = {};
      
      if (suppliersResponse.success) {
        // Create a lookup map of suppliers by ID
        suppliersMap = suppliersResponse.result.reduce((map, supplier) => {
          map[supplier._id] = supplier;
          return map;
        }, {});
        
        // Also store in state for other operations
        setSuppliers(suppliersResponse.result);
      }
      
      // Get all inventory items
      const inventoryResponse = await request.list({ entity: 'inventory' });
      let inventoryMap = {};
      
      if (inventoryResponse.success) {
        // Create a lookup map of inventory items by ID
        inventoryMap = inventoryResponse.result.reduce((map, item) => {
          map[item._id] = item;
          return map;
        }, {});
        
        // Also store in state for other operations
        setInventory(inventoryResponse.result);
      }
      
      // Now fetch purchases
      const response = await request.list({ 
        entity: 'purchases'
      });
      
      if (response.success) {
        // Map data and ensure values are properly formatted
        const mappedPurchases = response.result.map(purchase => {
          // Get complete supplier info from our map
          let supplierInfo = null;
          if (purchase.supplier) {
            // If supplier is an object, it's already populated
            if (typeof purchase.supplier === 'object') {
              supplierInfo = purchase.supplier;
            }
            // Otherwise, look it up from our map
            else if (suppliersMap[purchase.supplier]) {
              supplierInfo = suppliersMap[purchase.supplier];
            }
          }
          
          // Process items and look up names from our inventory map
          const processedItems = (purchase.items || []).map(item => {
            const quantity = Number(item.quantity) || 0;
            const price = Number(item.price) || 0;
            const itemTotal = quantity * price;
            
            // Get inventory item info
            let inventoryInfo = null;
            if (item.inventoryItem) {
              // If inventoryItem is an object, it's already populated
              if (typeof item.inventoryItem === 'object') {
                inventoryInfo = item.inventoryItem;
              }
              // Otherwise, look it up from our map
              else if (inventoryMap[item.inventoryItem]) {
                inventoryInfo = inventoryMap[item.inventoryItem];
              }
            }
            
            return {
              ...item,
              quantity: quantity,
              price: price,
              inventoryItem: inventoryInfo || { _id: item.inventoryItem, name: 'Unknown Item' },
              itemName: inventoryInfo?.name || 'Unknown Item',
              totalPrice: itemTotal
            };
          });
          
          // Calculate total if not provided
          let calculatedTotal = processedItems.reduce((sum, item) => sum + item.totalPrice, 0);
          
          return {
            ...purchase,
            key: purchase._id,
            // Store complete supplier object and a friendly name
            supplier: supplierInfo || { 
              _id: purchase.supplier, 
              name: 'Unknown Supplier',
              phone: 'N/A',
              email: 'N/A',
              gstin: 'N/A'
            },
            supplierName: supplierInfo?.name || 'Unknown Supplier',
            items: processedItems,
            date: purchase.date || new Date().toISOString(),
            totalAmount: Number(purchase.totalAmount) || calculatedTotal
          };
        });
        
        console.log('Processed purchases with full supplier details:', mappedPurchases);
        setPurchases(mappedPurchases);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
      message.error('Failed to load purchases');
    } finally {
      setLoading(false);
      setSuppliersLoading(false);
      setInventoryLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    setSuppliersLoading(true);
    try {
      const response = await request.list({ entity: 'suppliers' });
      if (response.success) {
        setSuppliers(response.result);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setSuppliersLoading(false);
    }
  };

  const fetchInventory = async () => {
    setInventoryLoading(true);
    try {
      const response = await request.list({ entity: 'inventory' });
      if (response.success) {
        setInventory(response.result);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setInventoryLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
    fetchSuppliers();
    fetchInventory();
  }, []);

  return (
    <>
    <Table
      columns={columns}
      dataSource={purchases}
      rowKey="_id"
      loading={loading}
        pagination={{ 
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
        }}
      />
      {/* Edit Purchase Modal */}
      <Modal
        title="Edit Purchase"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        width={800}
      >
        {editingPurchase && (
          <Form
            layout="vertical"
            initialValues={{
              supplier: editingPurchase.supplier?._id,
              items: editingPurchase.items.map(item => ({
                inventoryItem: item.inventoryItem?._id || item.inventoryItem,
                quantity: Number(item.quantity) || 0,
                price: Number(item.price) || 0
              })),
              totalAmount: Number(editingPurchase.totalAmount) || 0,
              date: editingPurchase.date ? moment(editingPurchase.date) : moment(),
              status: editingPurchase.status || 'Pending',
              paymentTerms: editingPurchase.paymentTerms || 'Net 30'
            }}
            onFinish={(values) => handleUpdatePurchase(editingPurchase._id, values)}
          >
            {/* Supplier Selection */}
            <Form.Item
              name="supplier"
              label="Supplier"
              rules={[{ required: true, message: 'Please select a supplier' }]}
            >
              <Select
                placeholder="Select a supplier"
                loading={suppliersLoading}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) => {
                  const children = option?.children || '';
                  const searchString = typeof children === 'string' ? children : String(children || '');
                  const inputString = typeof input === 'string' ? input : String(input || '');
                  return searchString.toLowerCase().indexOf(inputString.toLowerCase()) >= 0;
                }}
              >
                {suppliers.map(supplier => (
                  <Select.Option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* Purchase Date */}
            <Form.Item
              name="date"
              label="Purchase Date"
              rules={[{ required: true, message: 'Please select a date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            {/* Status Selection */}
            <Form.Item
              name="status"
              label="Status"
            >
              <Select placeholder="Select status">
                <Select.Option value="Pending">Pending</Select.Option>
                <Select.Option value="Delivered">Delivered</Select.Option>
                <Select.Option value="Completed">Completed</Select.Option>
                <Select.Option value="Cancelled">Cancelled</Select.Option>
              </Select>
            </Form.Item>

            {/* Payment Terms */}
            <Form.Item
              name="paymentTerms"
              label="Payment Terms"
            >
              <Select placeholder="Select payment terms">
                <Select.Option value="Net 30">Net 30</Select.Option>
                <Select.Option value="Net 60">Net 60</Select.Option>
                <Select.Option value="Net 90">Net 90</Select.Option>
                <Select.Option value="Immediate">Immediate</Select.Option>
              </Select>
            </Form.Item>

            {/* Items List */}
            <Form.List name="items">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => {
                    // Get the current item being edited
                    const currentItem = editingPurchase.items[name];

                    return (
                      <div key={key} style={{ display: 'flex', marginBottom: 8, gap: 8 }}>
                        <Form.Item
                          {...restField}
                          name={[name, 'inventoryItem']}
                          rules={[{ required: true, message: 'Select an item' }]}
                          style={{ flex: 3 }}
                        >
                          <Select 
                            placeholder="Select item"
                            loading={inventoryLoading}
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) => {
                              const children = option?.children || '';
                              const searchString = typeof children === 'string' ? children : String(children || '');
                              const inputString = typeof input === 'string' ? input : String(input || '');
                              return searchString.toLowerCase().indexOf(inputString.toLowerCase()) >= 0;
                            }}
                          >
                            {inventory.map(item => (
                              <Select.Option key={item._id} value={item._id}>
                                {item.name}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'quantity']}
                          rules={[{ required: true, message: 'Quantity required' }]}
                          style={{ flex: 1 }}
                        >
                          <InputNumber placeholder="Qty" min={1} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'price']}
                          rules={[{ required: true, message: 'Price required' }]}
                          style={{ flex: 1 }}
                        >
                          <InputNumber 
                            placeholder="Price"
                            formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                            min={0}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                        <Button
                          onClick={() => remove(name)}
                          type="text"
                          icon={<DeleteOutlined />}
                          danger
                        />
                      </div>
                    );
                  })}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      Add Item
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>

            {/* Submit Buttons */}
            <Form.Item>
              <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
                Update Purchase
              </Button>
              <Button onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>
      {/* View Purchase Details Modal */}
      <Modal
        title="Purchase Details"
        open={isViewModalOpen}
        onCancel={() => setIsViewModalOpen(false)}
        footer={[
          <Button key="pdf" icon={<FilePdfOutlined />} onClick={() => viewingPurchase && handleGeneratePDF(viewingPurchase)}>
            Generate PDF
          </Button>,
          <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => {
            setIsViewModalOpen(false);
            viewingPurchase && handleEdit(viewingPurchase);
          }}>
            Edit
          </Button>,
          <Button key="close" onClick={() => setIsViewModalOpen(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {viewingPurchase && (
          <>
            <Descriptions title="Purchase Information" bordered>
              <Descriptions.Item label="Purchase ID" span={3}>{viewingPurchase._id}</Descriptions.Item>
              <Descriptions.Item label="Date" span={1}>
                {viewingPurchase.date ? moment(viewingPurchase.date).format('MMMM Do, YYYY') : 'Not specified'}
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                <Tag color={
                  viewingPurchase.status === 'Delivered' ? 'green' : 
                  viewingPurchase.status === 'Pending' ? 'orange' :
                  viewingPurchase.status === 'Cancelled' ? 'red' :
                  viewingPurchase.status === 'Completed' ? 'blue' : 'default'
                }>
                  {viewingPurchase.status || 'Pending'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Payment Terms" span={3}>
                {viewingPurchase.paymentTerms || 'Standard Terms'}
              </Descriptions.Item>
              <Descriptions.Item label="Total Amount" span={3}>
                <Text strong>${(Number(viewingPurchase.totalAmount) || 0).toFixed(2)}</Text>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={5}>Supplier Details</Title>
            {viewingPurchase.supplier ? (
              <Descriptions bordered>
                <Descriptions.Item label="Name" span={3}>
                  {viewingPurchase.supplier.name || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Contact" span={1}>
                  {viewingPurchase.supplier.phone || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Email" span={2}>
                  {viewingPurchase.supplier.email || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="GSTIN" span={3}>
                  {viewingPurchase.supplier.gstin || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Address" span={3}>
                  {viewingPurchase.supplier.address || 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Text type="secondary">No supplier information available</Text>
            )}

            <Divider />

            <Title level={5}>Items</Title>
            <Table
              dataSource={viewingPurchase.items.map((item, index) => ({
                ...item,
                key: index,
                name: item.itemName || 'Unknown Item',
                totalPrice: item.quantity * item.price
              }))}
              pagination={false}
              columns={[
                {
                  title: 'Item',
                  dataIndex: 'name',
                  key: 'name'
                },
                {
                  title: 'Quantity',
                  dataIndex: 'quantity',
                  key: 'quantity'
                },
                {
                  title: 'Price',
                  dataIndex: 'price',
                  key: 'price',
                  render: (price) => {
                    const numPrice = Number(price);
                    return isNaN(numPrice) ? '$0.00' : `$${numPrice.toFixed(2)}`;
                  }
                },
                {
                  title: 'Total',
                  dataIndex: 'totalPrice',
                  key: 'totalPrice',
                  render: (total) => {
                    const numTotal = Number(total);
                    return isNaN(numTotal) ? '$0.00' : `$${numTotal.toFixed(2)}`;
                  }
                }
              ]}
            />
          </>
        )}
      </Modal>
    </>
  );
} 