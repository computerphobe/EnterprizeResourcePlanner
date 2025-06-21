import { useEffect } from 'react';
import { Tabs } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import useLanguage from '@/locale/useLanguage';
import AccountantDashboard from './Dashboards/accountant';
import { 
  DashboardOutlined, 
  FileTextOutlined, 
  BankOutlined, 
  BarChartOutlined,
  AuditOutlined
} from '@ant-design/icons';
import PageLoader from '@/components/PageLoader';

export default function AccountantPage() {
  const translate = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract the active tab from URL or default to 'dashboard'
  const activeTab = location.hash ? location.hash.substring(1) : 'dashboard';
  
  const handleTabChange = (tabKey) => {
    navigate(`#${tabKey}`);
  };
  
  const tabItems = [
    {
      key: 'dashboard',
      label: <span><DashboardOutlined /> {translate('Dashboard')}</span>,
      children: <AccountantDashboard />
    },
    {
      key: 'ledger',
      label: <span><FileTextOutlined /> {translate('Ledger')}</span>,
      children: (
        <div className="p-4">
          <div className="text-center py-8">
            <PageLoader />
            <p className="mt-4 text-gray-500">{translate('Loading ledger data...')}</p>
          </div>
        </div>
      )
    },
    {
      key: 'banking',
      label: <span><BankOutlined /> {translate('Banking')}</span>,
      children: (
        <div className="p-4">
          <div className="text-center py-8">
            <PageLoader />
            <p className="mt-4 text-gray-500">{translate('Loading banking data...')}</p>
          </div>
        </div>
      )
    },
    {
      key: 'reports',
      label: <span><BarChartOutlined /> {translate('Reports')}</span>,
      children: (
        <div className="p-4">
          <div className="text-center py-8">
            <PageLoader />
            <p className="mt-4 text-gray-500">{translate('Loading financial reports...')}</p>
          </div>
        </div>
      )
    },
    {
      key: 'audit',
      label: <span><AuditOutlined /> {translate('Audit')}</span>,
      children: (
        <div className="p-4">
          <div className="text-center py-8">
            <PageLoader />
            <p className="mt-4 text-gray-500">{translate('Loading audit data...')}</p>
          </div>
        </div>
      )
    }
  ];
  
  return (
    <div className="accountant-page">
      <h1 className="text-2xl font-bold mb-4">{translate('Financial Management')}</h1>
      
      <Tabs 
        defaultActiveKey={activeTab}
        onChange={handleTabChange}
        type="card"
        size="large"
        className="mb-6"
        items={tabItems}
      />
    </div>
  );
}
