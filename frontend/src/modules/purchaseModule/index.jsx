import React, { useState } from 'react';
import { Button, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import PageLayout from '@/layout/pageLayout';
import PurchaseList from './PurchaseList';
import PurchaseForm from './PurchaseForm';

export default function PurchaseModule() {
  console.log("purchase module loaded");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAdd = () => {
    console.log("Add purchase button clicked");
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <PageLayout title="Purchases">
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: '16px', fontWeight: 500 }}>Purchase List</span>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Add Purchase
          </Button>
        </div>
        <PurchaseList />
      </Card>
      <PurchaseForm 
        open={isModalOpen} 
        onClose={handleModalClose}
      />
    </PageLayout>
  );
} 