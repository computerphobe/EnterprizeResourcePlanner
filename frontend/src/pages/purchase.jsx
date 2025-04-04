import React from 'react';
import { Card } from 'antd';
import PurchaseModule from '@/modules/purchaseModule/index';

const PurchasePage = () => {
  return (
    <Card title="Purchases">
      <PurchaseModule />
    </Card>
  );
};

export default PurchasePage;
