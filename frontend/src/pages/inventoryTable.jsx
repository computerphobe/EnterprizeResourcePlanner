import React, { useEffect, useState } from 'react';
import { message, Card } from 'antd';
import { getinventory } from '@/modules/InventoryModule/service';
import InventoryTable from '@/modules/InventoryModule/inventorytable';

export default function InventoryPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const inventoryResult = await getinventory();
      setData(Array.isArray(inventoryResult) ? inventoryResult : []);
    } catch (err) {
      console.error('Failed to load inventory:', err);
      message.error('Failed to load inventory: ' + (err.message || err));
      setData([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <Card 
        title="Inventory Management" 
        style={{ marginBottom: 24 }}
        extra={
          <div style={{ color: '#666', fontSize: '14px' }}>
            Manage your inventory items, track stock levels, and monitor business metrics
          </div>
        }
      >
        <InventoryTable
          data={data}
          loading={loading}
          refresh={loadData}
        />
      </Card>
    </div>
  );
}
