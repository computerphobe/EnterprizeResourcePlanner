import React, { useState, useEffect } from 'react';
import { Button } from 'antd';
import useLanguage from '@/locale/useLanguage';
import PageLayout from '@/layout/PageLayout';
import InventoryTable from './inventoryTable';
import InventoryForm from './form';
import { createInventory, listInventory } from './service';

export default function InventoryModule() {
  const translate = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inventoryData, setInventoryData] = useState([]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Fetch Inventory List
  const fetchInventory = async () => {
    try {
      const response = await listInventory();
      console.log('Fetched Inventory:', response);
      if (response.success) {
        setInventoryData(response.result);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleCreate = async (values) => {
    try {
      await createInventory(values);
      closeModal();
      fetchInventory(); // Refresh the table after creating new inventory
    } catch (error) {
      console.error('Failed to create inventory:', error);
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
      <InventoryTable data={inventoryData} />

      <InventoryForm
        open={isModalOpen}
        onCancel={closeModal}
        onCreate={handleCreate}
      />
    </PageLayout>
  );
}
