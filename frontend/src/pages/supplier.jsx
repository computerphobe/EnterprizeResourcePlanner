import React from 'react';
import { Card } from 'antd';
import SupplierModule from '@/modules/supplierModule/index';

const SupplierPage = () => {
  return (
    <Card title="Suppliers">
      <SupplierModule />
    </Card>
  );
};

export default SupplierPage;
