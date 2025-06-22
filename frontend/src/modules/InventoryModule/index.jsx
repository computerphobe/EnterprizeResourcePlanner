import React, { useState, useEffect } from 'react';
import { Button, message } from 'antd';
import useLanguage from '@/locale/useLanguage';
import PageLayout from '@/layout/PageLayout';
import InventoryTable from './inventoryTable';
import InventoryForm from './form';
import { createInventory, getinventory, listInventory } from './service';

export default function InventoryModule() {
  const translate = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  // Fetch Inventory List
  const fetchInventory = async () => {
    setLoading(true);
    
    try {
      const result = await listInventory();
      
      if (result?.success && Array.isArray(result.result)) {
        setInventoryData(result.result);
        if (result.result.length === 0) {
          message.info('No inventory items found. Try adding one!');
        }
      } else {
        setInventoryData([]);
        message.info('No inventory items found. Try adding one!');
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      message.error('Failed to fetch inventory data');
      setInventoryData([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleCreate = async (values) => {
    try {
      await createInventory(values);
      message.success('Inventory item created successfully');
      closeModal();
      fetchInventory(); // Refresh the table after creating
    } catch (error) {
      console.error('Failed to create inventory:', error);
      message.error('Failed to create inventory item');
    }
  };

  return (
    <PageLayout
      title={translate('Inventory')}
      extra={
        <Button type="primary" onClick={openModal}>
          {translate('Add Inventory')}
        </Button>
      }
    >
      {inventoryData.length === 0 && !loading && (
        <div style={{ textAlign: 'center', margin: '20px 0', color: '#666' }}>
          No inventory items found. Click "Add Inventory" to create one.
        </div>
      )}
      
      <InventoryTable data={inventoryData} loading={loading} refresh={fetchInventory} />
      
      <InventoryForm
        open={isModalOpen}
        onClose={closeModal}
        onCreate={handleCreate}
        refresh={fetchInventory}
      />
    </PageLayout>
  );
}
