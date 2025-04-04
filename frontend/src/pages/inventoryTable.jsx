import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getinventory, createinventory, updateinventory, deleteinventory } from '@/modules/InventoryModule/service';

export default function InventoryPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingItem, setEditingItem] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // console.log('Fetching inventory data...');
      const result = await getinventory();
      // console.log('API Response:', result);
      // The service already handles the response structure
      setData(result);
    } catch (err) {
      console.error('Error loading inventory:', err);
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

  const columns = [
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
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
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingItem(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          Add Inventory
        </Button>
      </div>

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
        }}
      />

      <Modal
        title={editingItem ? 'Edit Inventory' : 'Add Inventory'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingItem(null);
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            name="itemName"
            label="Item Name"
            rules={[{ required: true, message: 'Please input item name!' }]}
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
        </Form>
      </Modal>
    </div>
  );
}
