import React, { useState } from 'react';
import { Table, Button, Space, Popconfirm, message, Empty, Collapse } from 'antd';
import { PlusOutlined, ReloadOutlined, BugOutlined } from '@ant-design/icons';
import InventoryForm from './inventoryForm';
import { deleteinventory } from './service';
import columnsFunction from './columns';

// Use a default parameter object and extract properties with defaults
export default function InventoryTable(props = {}) {
  const { loading = false, refresh } = props;
  // Make sure data is always an array even if props or props.data is undefined
  const inventoryData = Array.isArray(props.data) ? props.data : [];
  console.log(inventoryData)
  const [formVisible, setFormVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  const handleDelete = async (id) => {
    try {
      await deleteinventory(id);
      message.success('Deleted successfully');
      if (refresh) refresh();
      else window.location.reload(); // Fallback
    } catch (err) {
      message.error('Delete failed');
    }
  };

  // Display raw data for debugging
  console.log("📊 InventoryTable rendering with data:", inventoryData);

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
        <Button
          icon={<ReloadOutlined />}
          onClick={refresh}
        >
          Refresh
        </Button>
        <Button 
          icon={<BugOutlined />}
          onClick={() => setShowDebug(!showDebug)}
        >
          {showDebug ? 'Hide Debug' : 'Show Debug'}
        </Button>
      </Space>
        {showDebug && (
        <Collapse style={{ marginBottom: 16 }}>
          <Collapse.Panel header="Debug: Raw Inventory Data">
            <pre style={{ maxHeight: '400px', overflow: 'auto' }}>
              {JSON.stringify(inventoryData, null, 2)}
            </pre>
          </Collapse.Panel>
        </Collapse>
      )}
        {inventoryData.length > 0 ? (
        <Table
          rowKey={(record) => record._id || Math.random()}
          columns={[...columnsFunction(), {
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
          dataSource={inventoryData}
          loading={loading}
          expandable={{
            expandedRowRender: (record) => (
              <div>
                <p><strong>Product Code:</strong> {record.productCode || 'Not available'}</p>
                <p><strong>Name Alias:</strong> {record.nameAlias || 'Not available'}</p>
                <p><strong>Material:</strong> {record.material || 'Not available'}</p>
                <p><strong>GST Rate:</strong> {record.gstRate || 'Not available'}</p>
              </div>
            ),
          }}
        />      ) : (
        <Empty 
          description={
            <div>
              <p>No inventory items found</p>
              {showDebug && (
                <pre style={{ fontSize: '12px', textAlign: 'left' }}>
                  Raw data received: {JSON.stringify(inventoryData, null, 2)}
                </pre>
              )}
            </div>
          } 
        />
      )}

      <InventoryForm 
        open={formVisible} 
        onClose={() => setFormVisible(false)} 
        initialValues={editingItem} 
        refresh={refresh || (() => window.location.reload())} 
      />
    </>
  );
}
