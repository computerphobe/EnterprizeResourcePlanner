import React from 'react';
import { PageHeader } from '@ant-design/pro-layout';
import { HistoryOutlined } from '@ant-design/icons';
import HistoryTable from '@/modules/HistoryModule/HistoryTable';
import useLanguage from '@/locale/useLanguage';

export default function HistoryPage() {
  const translate = useLanguage();

  return (
    <>
      <PageHeader
        title={
          <span>
            <HistoryOutlined style={{ marginRight: 8 }} />
            {translate('System History')}
          </span>
        }
        subTitle={translate('View all system activities and transactions')}
        ghost={false}
        style={{ 
          padding: '16px 24px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0'
        }}
      />
      <HistoryTable />
    </>
  );
}
