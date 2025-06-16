import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Space,
  Button,
  DatePicker,
  Select,
  Input,
  Row,
  Col,
  Statistic,
  Tag,
  Badge,
  Avatar,
  Tooltip,
  InputNumber,
  message,
  Spin,
  Empty
} from 'antd';
import {
  HistoryOutlined,
  FilterOutlined,
  ExportOutlined,
  ReloadOutlined,
  UserOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  UndoOutlined,
  CalendarOutlined,
  DollarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { historyService } from './service';
import useLanguage from '@/locale/useLanguage';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

const HistoryTable = () => {
  const translate = useLanguage();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [summary, setSummary] = useState({});
  const [filters, setFilters] = useState({});
  const [filtersData, setFiltersData] = useState({
    clients: [],
    users: [],
    years: [],
    activityTypes: [],
    statuses: {}
  });

  // Filter states
  const [selectedDateRange, setSelectedDateRange] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedActivityType, setSelectedActivityType] = useState('all');
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [minAmount, setMinAmount] = useState(null);
  const [maxAmount, setMaxAmount] = useState(null);
  const [searchText, setSearchText] = useState('');

  // Load filter options
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const response = await historyService.getFilters();
        if (response.success) {
          setFiltersData(response.result);
        }
      } catch (error) {
        console.error('Error loading filters:', error);
        message.error('Failed to load filter options');
      }
    };
    loadFilters();
  }, []);

  // Load history data
  const loadHistory = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.pageSize,
        ...(selectedDateRange.length === 2 && {
          startDate: selectedDateRange[0].format('YYYY-MM-DD'),
          endDate: selectedDateRange[1].format('YYYY-MM-DD')
        }),
        ...(selectedMonth && { month: selectedMonth }),
        ...(selectedYear && { year: selectedYear }),
        ...(selectedActivityType !== 'all' && { activityType: selectedActivityType }),
        ...(selectedClient && { client: selectedClient }),
        ...(selectedUser && { performedBy: selectedUser }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(minAmount && { minAmount }),
        ...(maxAmount && { maxAmount }),
        ...(searchText && { search: searchText })
      };

      const response = await historyService.getHistory(params);
      if (response.success) {
        setData(response.result);
        setPagination({
          ...pagination,
          current: page,
          total: response.pagination.total
        });
        setSummary(response.summary);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      message.error('Failed to load history data');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadHistory();
  }, []);

  // Handle filter changes
  const handleFilterChange = () => {
    loadHistory(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedDateRange([]);
    setSelectedMonth(null);
    setSelectedYear(null);
    setSelectedActivityType('all');
    setSelectedClient(null);
    setSelectedUser(null);
    setSelectedStatus('all');
    setMinAmount(null);
    setMaxAmount(null);
    setSearchText('');
    setTimeout(() => loadHistory(1), 100);
  };

  // Get activity type icon and color
  const getActivityTypeInfo = (type) => {
    const types = {
      order: { icon: <ShoppingOutlined />, color: 'blue', label: 'Order' },
      invoice: { icon: <FileTextOutlined />, color: 'green', label: 'Invoice' },
      return: { icon: <UndoOutlined />, color: 'orange', label: 'Return' }
    };
    return types[type] || { icon: <HistoryOutlined />, color: 'default', label: 'Activity' };
  };

  // Get status color
  const getStatusColor = (status, type) => {
    const statusColors = {
      order: {
        pending: 'orange',
        processing: 'blue',
        picked_up: 'cyan',
        delivered: 'green',
        cancelled: 'red'
      },
      invoice: {
        draft: 'default',
        pending: 'orange',
        sent: 'blue',
        paid: 'green',
        overdue: 'red',
        cancelled: 'red'
      },
      return: {
        'Available for reuse': 'green',
        'Used': 'blue',
        'Damaged': 'orange',
        'Disposed': 'red'
      }
    };
    return statusColors[type]?.[status] || 'default';
  };

  // Table columns
  const columns = [
    {
      title: 'Activity',
      dataIndex: 'activityType',
      key: 'activityType',
      width: 120,
      render: (type) => {
        const info = getActivityTypeInfo(type);
        return (
          <Space>
            <Avatar size="small" icon={info.icon} style={{ backgroundColor: `var(--${info.color}-color)` }} />
            <span>{info.label}</span>
          </Space>
        );
      }
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      )
    },
    {
      title: 'Status',
      dataIndex: 'activitySubType',
      key: 'status',
      width: 120,
      render: (status, record) => (
        <Tag color={getStatusColor(status, record.activityType)}>
          {status?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Client',
      dataIndex: ['clientInfo', 'name'],
      key: 'client',
      width: 150,
      render: (name) => name || <span style={{ color: '#999' }}>No client</span>
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (amount) => (
        <Space>
          <DollarOutlined style={{ color: '#52c41a' }} />
          <span>{amount ? `$${amount.toFixed(2)}` : '-'}</span>
        </Space>
      )
    },
    {
      title: 'Performed By',
      dataIndex: ['performedByInfo', 'name'],
      key: 'performedBy',
      width: 130,
      render: (name) => name || <span style={{ color: '#999' }}>System</span>
    },
    {
      title: 'Date',
      dataIndex: 'activityDate',
      key: 'date',
      width: 150,
      render: (date) => (
        <Space>
          <CalendarOutlined />
          <span>{dayjs(date).format('MMM DD, YYYY HH:mm')}</span>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Activities"
              value={summary.totalActivities || 0}
              prefix={<HistoryOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="This Month"
              value={summary.thisMonth || 0}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Amount"
              value={summary.totalAmount || 0}
              prefix={<DollarOutlined />}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Row gutter={8}>
              <Col span={8}>
                <Statistic
                  title="Orders"
                  value={summary.totalOrders || 0}
                  valueStyle={{ fontSize: '16px' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Invoices"
                  value={summary.totalInvoices || 0}
                  valueStyle={{ fontSize: '16px' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Returns"
                  value={summary.totalReturns || 0}
                  valueStyle={{ fontSize: '16px' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card 
        title={
          <Space>
            <FilterOutlined />
            Filters
          </Space>
        }
        extra={
          <Space>
            <Button onClick={clearFilters}>Clear All</Button>
            <Button 
              type="primary" 
              onClick={handleFilterChange}
              loading={loading}
            >
              Apply Filters
            </Button>
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <label>Date Range:</label>
            <RangePicker
              style={{ width: '100%' }}
              value={selectedDateRange}
              onChange={setSelectedDateRange}
              format="YYYY-MM-DD"
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <label>Month:</label>
            <Select
              style={{ width: '100%' }}
              value={selectedMonth}
              onChange={setSelectedMonth}
              allowClear
            >
              {[...Array(12)].map((_, i) => (
                <Option key={i + 1} value={i + 1}>
                  {dayjs().month(i).format('MMMM')}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <label>Year:</label>
            <Select
              style={{ width: '100%' }}
              value={selectedYear}
              onChange={setSelectedYear}
              allowClear
            >
              {filtersData.years.map(year => (
                <Option key={year} value={year}>{year}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <label>Search:</label>
            <Search
              placeholder="Search descriptions, names, etc."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={handleFilterChange}
            />
          </Col>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          <Col xs={24} sm={12} md={6}>
            <label>Activity Type:</label>
            <Select
              style={{ width: '100%' }}
              value={selectedActivityType}
              onChange={setSelectedActivityType}
            >
              {filtersData.activityTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <label>Status:</label>
            <Select
              style={{ width: '100%' }}
              value={selectedStatus}
              onChange={setSelectedStatus}
            >
              <Option value="all">All Statuses</Option>
              {selectedActivityType !== 'all' && filtersData.statuses[selectedActivityType]?.map(status => (
                <Option key={status} value={status}>
                  {status}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <label>Client:</label>
            <Select
              style={{ width: '100%' }}
              value={selectedClient}
              onChange={setSelectedClient}
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {filtersData.clients.map(client => (
                <Option key={client._id} value={client._id}>
                  {client.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <label>Performed By:</label>
            <Select
              style={{ width: '100%' }}
              value={selectedUser}
              onChange={setSelectedUser}
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {filtersData.users.map(user => (
                <Option key={user._id} value={user._id}>
                  {user.name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          <Col xs={24} sm={12} md={6}>
            <label>Min Amount:</label>
            <InputNumber
              style={{ width: '100%' }}
              value={minAmount}
              onChange={setMinAmount}
              placeholder="0.00"
              prefix="$"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <label>Max Amount:</label>
            <InputNumber
              style={{ width: '100%' }}
              value={maxAmount}
              onChange={setMaxAmount}
              placeholder="999.99"
              prefix="$"
            />
          </Col>
        </Row>
      </Card>

      {/* History Table */}
      <Card
        title={
          <Space>
            <HistoryOutlined />
            System History
            {data.length > 0 && <Badge count={data.length} style={{ backgroundColor: '#52c41a' }} />}
          </Space>
        }
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => loadHistory(pagination.current)}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              icon={<ExportOutlined />} 
              onClick={() => message.info('Export feature coming soon!')}
            >
              Export
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} activities`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
              loadHistory(page);
            }
          }}
          locale={{
            emptyText: loading ? <Spin /> : <Empty description="No history data available" />
          }}
        />
      </Card>
    </div>
  );
};

export default HistoryTable;
