import { useEffect, useState } from 'react';
import { Tag, Row, Col, Card, Table, Statistic } from 'antd';
import { FileDoneOutlined, DollarCircleOutlined, BankOutlined, AccountBookOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import { useMoney } from '@/settings';
import { request } from '@/request';
import useFetch from '@/hooks/useFetch';
import useOnFetch from '@/hooks/useOnFetch';
import { selectMoneyFormat } from '@/redux/settings/selectors';
import { useSelector } from 'react-redux';
// Import directly from the file to avoid path resolution issues
import AccountantModule from '@/modules/AccountantModule/';

const AccountantDashboard = () => {
  // Option to use full module instead of the simplified dashboard
  const useFullModule = true;
  
  if(useFullModule) {
    return <AccountantModule />;
  }
  const translate = useLanguage();
  const { moneyFormatter } = useMoney();
  const money_format_settings = useSelector(selectMoneyFormat);
  
  const [financeStats, setFinanceStats] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    recentTransactions: []
  });

  // Fetch finance data
  useEffect(() => {
    const fetchFinanceData = async () => {
      try {
        // In a real implementation, you would call your backend API
        // For now, we'll use placeholder data
        setFinanceStats({
          totalRevenue: 157500.00,
          pendingPayments: 23450.00,
          recentTransactions: [
            { id: 1, date: '2025-04-28', description: 'Invoice #INV-2025-042', amount: 1250.00, status: 'Paid' },
            { id: 2, date: '2025-04-27', description: 'Invoice #INV-2025-041', amount: 3450.00, status: 'Pending' },
            { id: 3, date: '2025-04-26', description: 'Invoice #INV-2025-040', amount: 2100.00, status: 'Paid' },
            { id: 4, date: '2025-04-25', description: 'Invoice #INV-2025-039', amount: 5200.00, status: 'Pending' },
            { id: 5, date: '2025-04-24', description: 'Invoice #INV-2025-038', amount: 980.00, status: 'Paid' }
          ]
        });
      } catch (error) {
        console.error('Error fetching finance data:', error);
      }
    };
    
    fetchFinanceData();
  }, []);

  // Table columns for recent transactions
  const transactionColumns = [
    {
      title: translate('Date'),
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: translate('Description'),
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: translate('Amount'),
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => moneyFormatter({ amount, currency_code: money_format_settings?.default_currency_code }),
      align: 'right',
    },
    {
      title: translate('Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Paid' ? 'green' : 'orange'}>
          {status}
        </Tag>
      ),
    },
  ];

  return (
    <div className="accountant-dashboard p-4">
      <h1 className="text-2xl font-bold mb-6">{translate('Accountant Dashboard')}</h1>
      
      {/* Finance Overview Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={translate('Total Revenue')}
              value={moneyFormatter({ 
                amount: financeStats.totalRevenue, 
                currency_code: money_format_settings?.default_currency_code 
              })}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={translate('Pending Payments')}
              value={moneyFormatter({ 
                amount: financeStats.pendingPayments, 
                currency_code: money_format_settings?.default_currency_code 
              })}
              valueStyle={{ color: '#cf1322' }}
              prefix={<BankOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={translate('Invoices This Month')}
              value={12}
              prefix={<FileDoneOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={translate('Financial Reports')}
              value={5}
              prefix={<AccountBookOutlined />}
            />
          </Card>
        </Col>
      </Row>
      
      {/* Recent Transactions */}
      <Card 
        title={translate('Recent Transactions')}
        className="mb-6"
      >
        <Table 
          dataSource={financeStats.recentTransactions} 
          columns={transactionColumns}
          rowKey="id"
          pagination={false}
        />
      </Card>
      
      {/* Quick Actions */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card
            title={translate('Financial Tasks')}
            className="h-full"
          >
            <ul className="list-disc pl-5">
              <li className="mb-2">{translate('Review monthly statements')}</li>
              <li className="mb-2">{translate('Prepare tax documents')}</li>
              <li className="mb-2">{translate('Audit expense reports')}</li>
              <li className="mb-2">{translate('Process employee reimbursements')}</li>
            </ul>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            title={translate('Important Dates')}
            className="h-full"
          >
            <ul className="list-disc pl-5">
              <li className="mb-2">{translate('Tax Filing: May 15, 2025')}</li>
              <li className="mb-2">{translate('Quarterly Review: June 30, 2025')}</li>
              <li className="mb-2">{translate('Budget Planning: July 10, 2025')}</li>
              <li className="mb-2">{translate('Financial Audit: August 5, 2025')}</li>
            </ul>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            title={translate('Financial Health')}
            className="h-full"
          >
            <div className="flex flex-col items-center">
              <div className="text-center mb-4">
                <div className="text-lg font-bold text-green-600">Good</div>
                <div className="text-sm text-gray-500">{translate('Overall Financial Status')}</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{ width: '85%' }}
                ></div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                {translate('Current fiscal year performance is 15% above target')}
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default AccountantDashboard;