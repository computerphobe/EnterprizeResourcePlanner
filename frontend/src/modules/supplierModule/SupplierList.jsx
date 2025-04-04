import React, { useEffect, useState } from 'react';
import { Table, Button, message, Modal, Form, Input, Popconfirm, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getSuppliers, updateSupplier, deleteSupplier } from './service';

const SupplierList = ({ onAddClick }) => {
  console.log("supplierList opening");
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form] = Form.useForm();

  const handleEdit = (record) => {
    console.log("Editing supplier:", record)
  }
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Contact Person',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'GSTIN',
      dataIndex: 'gstin',
      key: 'gstin',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              handleEdit(record)
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Supplier"
            description="Are you sure you want to delete this supplier?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await getSuppliers();
      console.log('Full response:', response);
      
      if (response?.result && Array.isArray(response.result)) {
        console.log('Supplier data:', response.result);
        setSuppliers(response.result);
      } else {
        console.log('No results array in response:', response);
        setSuppliers([]);
        message.warning('No suppliers found');
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
      message.error('Failed to load suppliers');
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);



  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      await updateSupplier(editingSupplier._id, values);
      message.success('Supplier updated successfully');
      setEditModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      console.error('Error updating supplier:', error);
      message.error('Failed to update supplier');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSupplier(id);
      message.success('Supplier deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      message.error('Failed to delete supplier');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {suppliers.length > 0 && (
            <span style={{ fontSize: '14px' }}>
              Total Suppliers: {suppliers.length}
            </span>
          )}
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={onAddClick}
        >
          Add Supplier
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={suppliers}
        rowKey="_id"
        loading={loading}
        pagination={{ 
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
        }}
      />

      <Modal
        title="Edit Supplier"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
        }}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Supplier Name"
            rules={[{ required: true, message: 'Please enter supplier name' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="contactPerson"
            label="Contact Person"
            rules={[{ required: true, message: 'Please enter contact person' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="phone"
            label="Phone"
            rules={[{ required: true, message: 'Please enter phone number' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="gstin"
            label="GSTIN"
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="paymentTerms"
            label="Payment Terms"
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SupplierList;
