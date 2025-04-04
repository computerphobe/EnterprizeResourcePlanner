import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Popconfirm, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import InventoryForm from './inventoryForm';
import { getinventory, deleteinventory } from './service';
import getColumns from './columns';

export default function InventoryTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getinventory();
      console.log("Fetched Inventory Data:", result);
      if (Array.isArray(result)) {
        setData(result.map(item => ({
          ...item,
          key: item._id,
          status: item.quantity > 0 ? 'In Stock' : 'Out of Stock'
        })));
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Error loading inventory:", err);
      message.error("Error loading inventory");
      setData([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteinventory(id);
      message.success('Deleted successfully');
      loadData();
    } catch (err) {
      message.error('Delete failed');
    }
  };

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingItem(null);
            setFormVisible(true);
          }}
        >
          Add Inventory
        </Button>
      </Space>

      <Table
        rowKey="_id"
        columns={[...getColumns(), {
          title: 'Actions',
          render: (text, record) => (
            <Space>
              <Button size="small" onClick={() => { setEditingItem(record); setFormVisible(true); }}>Edit</Button>
              <Popconfirm title="Delete this item?" onConfirm={() => handleDelete(record._id)}>
                <Button size="small" danger>Delete</Button>
              </Popconfirm>
            </Space>
          ),
        }]}
        dataSource={data}
        loading={loading}
      />

      <InventoryForm open={formVisible} onClose={() => setFormVisible(false)} initialValues={editingItem} refresh={loadData} />
        
    </>
  );
}
