import { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Tag, Button, Tabs, Spin, message } from 'antd';
import { 
  PieChartOutlined, 
  BarChartOutlined, 
  FileTextOutlined, 
  PrinterOutlined,
  DownloadOutlined,
  LoadingOutlined 
} from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import { useMoney } from '@/settings';
import { selectMoneyFormat } from '@/redux/settings/selectors';
import { useSelector } from 'react-redux';
import { request } from '@/request';
import FinancialSummary from './components/FinancialSummary';
import ExpensesChart from './components/ExpensesChart';
import RevenueChart from './components/RevenueChart';

function AccountantModule() {
  const translate = useLanguage();
  const { moneyFormatter } = useMoney();
  const money_format_settings = useSelector(selectMoneyFormat);
    const [activeTab, setActiveTab] = useState('1');
  const [loading, setLoading] = useState(true);
  const [ledgerData, setLedgerData] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await request.getFinancialData();
        
        if (response.success && response.result && response.result.ledgerEntries) {
          setLedgerData(response.result.ledgerEntries);
        }
      } catch (error) {
        console.error("Error fetching ledger data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
    // Table columns for ledger
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
      filters: [
        { text: translate('Sales Revenue'), value: 'Sales Revenue' },
        { text: translate('Accounts Receivable'), value: 'Accounts Receivable' },
        { text: translate('Office Supplies'), value: 'Office Supplies' },
        { text: translate('Salaries'), value: 'Salaries' },
        { text: translate('Utilities'), value: 'Utilities' }
      ],
      onFilter: (value, record) => record.account === value,
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
      filters: [
        { text: translate('Revenue'), value: 'revenue' },
        { text: translate('Expense'), value: 'expense' },
        { text: translate('Asset'), value: 'asset' },
        { text: translate('Liability'), value: 'liability' }
      ],
      onFilter: (value, record) => record.type === value,
      render: (type) => {
        const colors = {
          revenue: 'green',
          expense: 'red',
          asset: 'blue',
          liability: 'orange'
        };
        return <Tag color={colors[type]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Tag>;
      },
    },
    {
      title: translate('Debit'),
      dataIndex: 'debit',
      key: 'debit',
      render: (amount) => amount > 0 ? moneyFormatter({ amount, currency_code: money_format_settings?.default_currency_code }) : '-',
      align: 'right',
      sorter: (a, b) => (a.debit || 0) - (b.debit || 0),
    },
    {
      title: translate('Credit'),
      dataIndex: 'credit',
      key: 'credit',
      render: (amount) => amount > 0 ? moneyFormatter({ amount, currency_code: money_format_settings?.default_currency_code }) : '-',
      align: 'right',
      sorter: (a, b) => (a.credit || 0) - (b.credit || 0),
    }
  ];

  const tabItems = [
    {
      key: '1',
      label: <span><FileTextOutlined /> {translate('General Ledger')}</span>,
      children: (
        <Table 
          dataSource={ledgerData} 
          columns={ledgerColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      )
    },
    {
      key: '2',
      label: <span><PieChartOutlined /> {translate('Expenses Analysis')}</span>,
      children: <ExpensesChart />
    },
    {
      key: '3',
      label: <span><BarChartOutlined /> {translate('Revenue Analysis')}</span>,
      children: <RevenueChart />
    }
  ];

  return (
    <div className="accountant-module">
      <Row gutter={[16, 16]} className="mb-4">
        <Col span={24}>
          <FinancialSummary />
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} className="mb-4">
        <Col span={24}>
          <Card 
            title={translate('Financial Records')}            extra={
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
                    // In a real implementation, this would trigger a CSV/PDF export
                  }}
                  disabled={loading}
                >
                  {translate('Export')}
                </Button>
              </div>
            }
          >            <Tabs 
              activeKey={activeTab}
              onChange={setActiveTab}
            >              <Tabs.TabPane 
                key="1" 
                tab={<span><FileTextOutlined /> {translate('General Ledger')}</span>}
              >
                {loading ? (
                  <div className="flex justify-center items-center p-8">
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                  </div>
                ) : (
                  <Table 
                    dataSource={ledgerData} 
                    columns={ledgerColumns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    locale={{ 
                      emptyText: translate('No ledger entries found') 
                    }}
                    summary={pageData => {
                      let totalDebit = 0;
                      let totalCredit = 0;
                      
                      pageData.forEach(({ debit, credit }) => {
                        totalDebit += Number(debit || 0);
                        totalCredit += Number(credit || 0);
                      });
                      
                      return (
                        <>
                          <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={3}>
                              <strong>{translate('Total')}</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1}></Table.Summary.Cell>
                            <Table.Summary.Cell index={2} align="right">
                              <strong>
                                {moneyFormatter({ 
                                  amount: totalDebit, 
                                  currency_code: money_format_settings?.default_currency_code 
                                })}
                              </strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={3} align="right">
                              <strong>
                                {moneyFormatter({ 
                                  amount: totalCredit, 
                                  currency_code: money_format_settings?.default_currency_code 
                                })}
                              </strong>
                            </Table.Summary.Cell>
                          </Table.Summary.Row>
                        </>
                      );
                    }}
                  />
                )}
              </Tabs.TabPane>
              <Tabs.TabPane 
                key="2" 
                tab={<span><PieChartOutlined /> {translate('Expenses Analysis')}</span>}
              >
                <ExpensesChart />
              </Tabs.TabPane>
              <Tabs.TabPane 
                key="3" 
                tab={<span><BarChartOutlined /> {translate('Revenue Analysis')}</span>}
              >
                <RevenueChart />
              </Tabs.TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>    </div>
  );
}

export default AccountantModule;
