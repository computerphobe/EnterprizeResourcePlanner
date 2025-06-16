import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import {
  getinventory,
  createinventory,
  updateinventory,
  deleteinventory,
} from '@/modules/InventoryModule/service';

const { Option } = Select;

export default function InventoryTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingItem, setEditingItem] = useState(null);
  const [searchText, setSearchText] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getinventory();
      setData(result);
    } catch (err) {
      message.error('Failed to load inventory: ' + (err.message || err));
      setData([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (values) => {
    try {
      // ✅ Ensure gstRate is a number
      if (values.gstRate) {
        values.gstRate = Number(values.gstRate);
      }

      if (editingItem) {
        await updateinventory(editingItem._id, values);
        message.success('Inventory updated successfully');
      } else {
        await createinventory(values);
        message.success('Inventory added successfully');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingItem(null);
      loadData();
    } catch (err) {
      message.error('Error saving inventory');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteinventory(id);
      message.success('Inventory deleted');
      loadData();
    } catch (err) {
      message.error('Delete failed');
    }
  };

  const handleEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const filteredData = data.filter((item) =>
    item.productCode?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    { title: 'Product Code', dataIndex: 'productCode', key: 'productCode' },
    { title: 'Item Name', dataIndex: 'itemName', key: 'itemName' },
    { title: 'Name Alias', dataIndex: 'nameAlias', key: 'nameAlias' },
    { title: 'Material', dataIndex: 'material', key: 'material' },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Price', dataIndex: 'price', key: 'price' },
    {
      title: 'GST Rate',
      dataIndex: 'gstRate',
      key: 'gstRate',
      render: (rate) => (rate !== undefined ? `${rate}%` : 'N/A'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(record)}>Edit</Button>
          <Button danger size="small" onClick={() => handleDelete(record._id)}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingItem(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          Add Product
        </Button>
        <Input
          placeholder="Search by Product Code"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 250 }}
        />
      </div>

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
        }}
      />

      <Modal
        title={editingItem ? 'Edit Product' : 'Add Product'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingItem(null);
        }}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="itemName"
            label="Product Name"
            rules={[{ required: true, message: 'Please input product name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="productCode"
            label="Product Code"
            rules={[{ required: true, message: 'Please input product code!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="nameAlias"
            label="Name Alias"
            rules={[{ required: true, message: 'Please input name alias!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="material"
            label="Material"
            rules={[{ required: true, message: 'Please input material!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Please input quantity!' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please input category!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="price"
            label="Price"
            rules={[{ required: true, message: 'Please input price!' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="gstRate"
            label="GST Rate"
            rules={[{ required: true, message: 'Please select GST rate!' }]}
          >
            <Select placeholder="Select GST rate">
              <Option value={5}>5%</Option>
              <Option value={12}>12%</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
