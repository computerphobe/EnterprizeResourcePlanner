import { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Tag, Button, Tabs, Spin, message, Modal, Form, Input, DatePicker, Select, InputNumber } from 'antd';
import {
  PieChartOutlined,
  BarChartOutlined,
  FileTextOutlined,
  PrinterOutlined,
  DownloadOutlined,
  LoadingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import { useMoney } from '@/settings';
import { useSelector } from 'react-redux';
import { selectMoneyFormat } from '@/redux/settings/selectors';
import ExpensesChart from './components/ExpensesChart';
import RevenueChart from './components/RevenueChart';
import moment from 'moment';

function AccountantModule() {
  const translate = useLanguage();
  const { moneyFormatter } = useMoney();
  const money_format_settings = useSelector(selectMoneyFormat);
  const [activeTab, setActiveTab] = useState('1');
  const [loading, setLoading] = useState(true);
  const [ledgerData, setLedgerData] = useState([]);
  const [financialData, setFinancialData] = useState(null);
  const [financialDataLoading, setFinancialDataLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({});
  const [formVisible, setFormVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [form] = Form.useForm();
  const [accountOptions, setAccountOptions] = useState([
    { label: 'Sales Revenue', value: 'Sales Revenue' },
    { label: 'Accounts Receivable', value: 'Accounts Receivable' },
    { label: 'Office Supplies', value: 'Office Supplies' },
    { label: 'Salaries', value: 'Salaries' },
    { label: 'Utilities', value: 'Utilities' },
    { label: 'Marketing', value: 'Marketing' },
    { label: 'Rent', value: 'Rent' },
    { label: 'Insurance', value: 'Insurance' },
    { label: 'Equipment', value: 'Equipment' }
  ]);

  const fetchLedgerEntries = async (params = {}) => {
    try {
      setLoading(true);

      const queryParams = {
        page: params.pagination?.current || pagination.current,
        limit: params.pagination?.pageSize || pagination.pageSize,
        ...filters,
        ...params.filters
      };

      // If we have date filters, format them properly
      if (queryParams.startDate) {
        queryParams.startDate = moment(queryParams.startDate).format('YYYY-MM-DD');
      }

      if (queryParams.endDate) {
        queryParams.endDate = moment(queryParams.endDate).format('YYYY-MM-DD');
      }

      // Use the request.getLedgerEntries method
      const response = await request.getLedgerEntries(queryParams);
      console.log('response from getLedgerEntries:', response);
      if (response.success && response.result) {
        setLedgerData(response.result.entries);
        setPagination({
          ...pagination,
          current: response.result.page,
          pageSize: response.result.limit,
          total: response.result.total
        });
      }
    } catch (error) {
      console.error("Error fetching ledger entries:", error);
      message.error(translate('Failed to fetch ledger entries'));
      const [totalRevenue, setTotalRevenue] = useState(0);
      const [totalExpenses, setTotalExpenses] = useState(0);

      useEffect(() => {

        // Fetch financial data once for all tabs
        const fetchFinancialData = async () => {
          if (financialData) return; // Don't fetch if we already have data

          try {
            setFinancialDataLoading(true);
            const response = await request.getFinancialData();

            if (response.success && response.result) {
              console.log('Financial data loaded successfully');
              setFinancialData(response.result);
            } else {
              console.error('Failed to fetch financial data:', response);
            }
          } catch (error) {
            console.error('Error fetching financial data:', error);
          } finally {
            setFinancialDataLoading(false);
          }
        };

        // Handle tab change to pre-fetch data as needed
        const handleTabChange = (activeKey) => {
          setActiveTab(activeKey);

          // Pre-fetch financial data when switching to charts tabs
          if (activeKey === '2' || activeKey === '3') {
            fetchFinancialData();
          }
        };

        useEffect(() => {
          fetchLedgerEntries();

          // Fetch financial data on initial load
          fetchFinancialData();
        }, []);

        const handleTableChange = (newPagination, filters, sorter) => {
          fetchLedgerEntries({
            pagination: newPagination,
            filters: Object.keys(filters).reduce((acc, key) => {
              if (filters[key]) {
                acc[key] = filters[key][0];
              }
              return acc;
            }, {})
          });
        };

        const handleAddEntry = () => {
          form.resetFields();
          setEditingEntry(null);
          setFormVisible(true);
        };

        const handleEditEntry = (entry) => {
          console.log('Entry being edited:', entry); // Debug log
          setEditingEntry(entry);
          form.setFieldsValue({
            ...entry,
            date: moment(entry.date),
            // Calculate amount from debit or credit
            amount: entry.type === 'expense' || entry.type === 'asset'
              ? entry.debit
              : entry.credit
          });
          setFormVisible(true);
        };

        const handleDeleteEntry = async (entry) => {
          Modal.confirm({
            title: translate('Delete Entry'),
            content: translate('Are you sure you want to delete this ledger entry?'),
            okText: translate('Yes'),
            okType: 'danger',
            cancelText: translate('No'),
            onOk: async () => {
              try {
                // Check if the entry has _id (backend MongoDB format) or id (client-side format)
                const entryId = entry._id || entry.id;

                console.log('Deleting ledger entry with id:', entryId);

                if (!entryId) {
                  message.error(translate('Cannot delete entry: No ID found'));
                  return;
                }

                const response = await request.deleteLedgerEntry(entryId);

                if (response.success) {
                  message.success(translate('Ledger entry deleted successfully'));
                  fetchLedgerEntries();
                }
              } catch (error) {
                console.error("Error deleting ledger entry:", error);
                message.error(translate('Failed to delete ledger entry'));
              }
            }
          });
        };

        const handleFormSubmit = async () => {
          try {
            const values = await form.validateFields();

            // Show loading message
            const loadingKey = 'ledgerEntry' + (editingEntry ? 'Update' : 'Create');
            message.loading({ content: translate('Processing...'), key: loadingKey, duration: 0 });

            // Format the values
            const formattedValues = {
              ...values,
              date: values.date.format('YYYY-MM-DD')
            };

            // Set debit/credit based on type
            if (values.type === 'expense' || values.type === 'asset') {
              formattedValues.debit = values.amount;
              formattedValues.credit = 0;
            } else {
              formattedValues.credit = values.amount;
              formattedValues.debit = 0;
            }

            // Remove the amount field as it's not part of the schema
            delete formattedValues.amount;

            let response = null;
            let success = false;

            // Get the correct MongoDB ID (_id) from the editing entry
            const entryId = editingEntry ? (editingEntry._id || editingEntry.id) : null;
            console.log('Using entry ID for update:', entryId);

            // Try different strategies to save the entry
            const strategies = [
              // Strategy 1: Primary endpoints
              async () => {
                console.log('Trying primary endpoints');
                if (editingEntry) {
                  console.log('Updating ledger entry with id:', entryId);
                  return await request.updateLedgerEntry(entryId, formattedValues);
                } else {
                  return await request.createLedgerEntry(formattedValues);
                }
              },
              // Strategy 2: Fallback to test endpoint
              async () => {
                console.log('Trying fallback test endpoint');
                if (editingEntry) {
                  console.log('Using test update endpoint with id:', entryId);
                  return await request.testUpdateLedgerEntry(entryId, formattedValues);
                } else {
                  return await request.testCreateLedgerEntry(formattedValues);
                }
              },
              // Strategy 3: Direct axios call as last resort
              async () => {
                console.log('Trying direct axios call');
                const axios = (await import('axios')).default;
                const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).token : null;

                const headers = {
                  'Content-Type': 'application/json'
                };

                if (token) {
                  headers['Authorization'] = `Bearer ${token}`;
                }

                if (editingEntry) {
                  console.log('Direct axios call for updating ledger entry with id:', entryId);
                  const result = await axios.put(`/api/ledger/${entryId}`, formattedValues, { headers });
                  return result.data;
                } else {
                  const result = await axios.post('/api/ledger', formattedValues, { headers });
                  return result.data;
                }
              }
            ];

            // Try each strategy in sequence until one succeeds
            for (const strategy of strategies) {
              try {
                response = await strategy();
                if (response && response.success) {
                  success = true;
                  break;
                }
              } catch (strategyError) {
                console.error('Strategy failed:', strategyError);
                continue;
              }
            }

            // Handle the result
            if (success) {
              message.success({
                content: editingEntry
                  ? translate('Ledger entry updated successfully')
                  : translate('Ledger entry created successfully'),
                key: loadingKey
              });
              setFormVisible(false);
              fetchLedgerEntries();
            } else {
              message.error({
                content: translate('Failed to save ledger entry. Please try again.'),
                key: loadingKey
              });
            }
          } catch (error) {
            console.error("Error submitting ledger entry:", error);
            message.error(translate('Failed to save ledger entry. Please check form values.'));
          }
        };

        // Table columns for ledger

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
          filters: accountOptions.map(option => ({ text: translate(option.label), value: option.value })),
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
          sorter: (a, b) => (a.credit || 0) - (b.credit || 0),
        },
        {
          title: translate('Actions'),
          key: 'action',
          render: (_, record) => (
            <div className="flex space-x-2">
              <Button
                type="primary"
                icon={<EditOutlined />}
                size="small"
                onClick={() => handleEditEntry(record)}
              />
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
                onClick={() => handleDeleteEntry(record)}
              />
            </div>
          ),
        }
      ]
    };


    return (
      <div className="accountant-module">
        {/* Styled Financial Summary Block */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col span={24}>
            <FinancialSummary preloadedData={financialData} isLoading={financialDataLoading} />
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
      </div>
    )
  };
}

export default AccountantModule;