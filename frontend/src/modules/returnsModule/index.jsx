import React, { useState } from 'react';
import { Button } from 'antd';
import PageLayout from '@/layout/pageLayout';
import ReturnsTable from './ReturnsTable';
import ReturnsForm from './ReturnsForm';

export default function ReturnsModule() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    console.log('openModal called');
    setIsModalOpen(true)
  } 
  const closeModal = () => setIsModalOpen(false);

  return (
    <PageLayout
      title="Returns"
      extra={
        <Button type="primary" onClick={openModal}>
          Add Return
        </Button>
      }
    >
      <ReturnsTable />

      <ReturnsForm open={isModalOpen} onClose={closeModal} />
    </PageLayout>
  );
}
