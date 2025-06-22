import React, { useState } from 'react';
import { Button } from 'antd';
import PageLayout from '@/layout/pageLayout';
import ReturnsTable from '@/modules/returnsModule/returnsTable';
import ReturnsForm from '@/modules/returnsModule/returnsForm';

export default function ReturnsModule() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
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
