import { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Tag, Button, Tabs, Spin, message } from 'antd';
import {
  PieChartOutlined,
  BarChartOutlined,
  FileTextOutlined,
  PrinterOutlined,
  DownloadOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import { useMoney } from '@/settings';
import { useSelector } from 'react-redux';
import { selectMoneyFormat } from '@/redux/settings/selectors';
import ExpensesChart from './components/ExpensesChart';
import RevenueChart from './components/RevenueChart';

function AccountantModule() {
  const translate = useLanguage();
  const { moneyFormatter } = useMoney();
  const money_format_settings = useSelector(selectMoneyFormat);
  const [activeTab, setActiveTab] = useState('1');
  const [loading, setLoading] = useState(true);
  const [ledgerData, setLedgerData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

useEffect(() => {
  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const ledgerSummaryRes = await fetch('/api/ledger/summary', { headers }).then(res => res.json());

      if (ledgerSummaryRes.success && ledgerSummaryRes.result) {
        setLedgerData(ledgerSummaryRes.result.entries || []);
        setTotalRevenue(ledgerSummaryRes.result.totalRevenue || 0);
        setTotalExpenses(ledgerSummaryRes.result.totalExpenses || 0);
      } else {
        setLedgerData([]);
        setTotalRevenue(0);
        setTotalExpenses(0);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
      message.error(translate('Failed to load financial data'));
    } finally {
      setLoading(false);
    }
  };

  fetchFinancialData();
}, []);

  const netProfit = totalRevenue - totalExpenses;
  const estimatedTax = netProfit * 0.18;

  const ledgerColumns = [
    {
      title: translate('Date'),
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      defaultSortOrder: 'descend',
      render: (date) => {
        const formattedDate = new Date(date).toLocaleDateString();
        return formattedDate !== 'Invalid Date' ? formattedDate : date;
      },
    },
    {
      title: translate('Account'),
      dataIndex: 'account',
      key: 'account',
    },
    {
      title: translate('Description'),
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: translate('Type'),
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const colors = {
          revenue: 'green',
          expense: 'red',
          asset: 'blue',
          liability: 'orange',
        };
        return <Tag color={colors[type]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Tag>;
      },
    },
    {
      title: translate('Debit'),
      dataIndex: 'debit',
      key: 'debit',
      render: (amount) =>
        amount > 0
          ? moneyFormatter({ amount, currency_code: money_format_settings?.default_currency_code })
          : '-',
      align: 'right',
    },
    {
      title: translate('Credit'),
      dataIndex: 'credit',
      key: 'credit',
      render: (amount) =>
        amount > 0
          ? moneyFormatter({ amount, currency_code: money_format_settings?.default_currency_code })
          : '-',
      align: 'right',
    },
  ];

  return (
    <div className="accountant-module">
      {/* Styled Financial Summary Block */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col span={24}>
          <Card title={translate('Financial Summary')} style={{ borderRadius: '12px', background: '#fafafa' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <div>
                  <h4>{translate('Total Revenue')}</h4>
                  <p style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}>
                    {moneyFormatter({ amount: totalRevenue, currency_code: money_format_settings?.default_currency_code })}
                  </p>
                </div>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div>
                  <h4>{translate('Total Expenses')}</h4>
                  <p style={{ fontSize: 20, fontWeight: 'bold', color: '#ff4d4f' }}>
                    {moneyFormatter({ amount: totalExpenses, currency_code: money_format_settings?.default_currency_code })}
                  </p>
                </div>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div>
                  <h4>{translate('Net Profit')}</h4>
                  <p style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                    {moneyFormatter({ amount: netProfit, currency_code: money_format_settings?.default_currency_code })}
                  </p>
                </div>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div>
                  <h4>{translate('Estimated Tax Liability')}</h4>
                  <p style={{ fontSize: 20, fontWeight: 'bold' }}>
                    {moneyFormatter({ amount: estimatedTax, currency_code: money_format_settings?.default_currency_code })}
                  </p>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Ledger + Charts */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col span={24}>
          <Card
            title={translate('Financial Records')}
            extra={
              <div>
                <Button
                  type="primary"
                  icon={<PrinterOutlined />}
                  className="mr-2"
                  onClick={() => {
                    message.success(translate('Preparing document for printing...'));
                    setTimeout(() => {
                      window.print();
                    }, 500);
                  }}
                  disabled={loading}
                >
                  {translate('Print')}
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    message.success(translate('Exporting financial records...'));
                  }}
                  disabled={loading}
                >
                  {translate('Export')}
                </Button>
              </div>
            }
          >
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <Tabs.TabPane key="1" tab={<span><FileTextOutlined /> {translate('General Ledger')}</span>}>
                {loading ? (
                  <div className="flex justify-center items-center p-8">
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                  </div>
                ) : (
                  <Table
                    dataSource={ledgerData}
                    columns={ledgerColumns}
                    rowKey={(record) => record._id || record.id}
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: translate('No ledger entries found') }}
                  />
                )}
              </Tabs.TabPane>
              <Tabs.TabPane key="2" tab={<span><PieChartOutlined /> {translate('Expenses Analysis')}</span>}>
                <ExpensesChart />
              </Tabs.TabPane>
              <Tabs.TabPane key="3" tab={<span><BarChartOutlined /> {translate('Revenue Analysis')}</span>}>
                <RevenueChart />
              </Tabs.TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default AccountantModule;
