import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Card,
  Row,
  Col,
  Typography,
  Table,
  Divider,
} from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const { Title, Text } = Typography;

const COLORS = ['#1890ff', '#52c41a', '#fa541c', '#faad14', '#13c2c2'];

const currencyFormatter = (value) =>
  value != null
    ? `₹${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : '₹0.00';

const FinancialReports = () => {
  const [summary, setSummary] = useState({});
  const [monthlyProfitLoss, setMonthlyProfitLoss] = useState([]);
  const [expensesByCategory, setExpensesByCategory] = useState([]);
  const [netProfitTrend, setNetProfitTrend] = useState([]);
  const [outstandingPayments, setOutstandingPayments] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      const res = await axios.get('/financial-reports/summary');
      const data = res.data;

      setSummary(data.summary || {});
      setMonthlyProfitLoss(data.profitLoss || []);
      setExpensesByCategory(data.expensesByCategory || []);
      setNetProfitTrend(data.netProfitTrend || []);
      setOutstandingPayments(data.outstandingPayments || []);
      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      console.error('Error fetching financial reports:', err);
    }
  };

  const summaryCards = [
    { label: 'Total Revenue', value: summary.totalRevenue, color: '#52c41a' }, // green success
    { label: 'Total Expenses', value: summary.totalExpenses, color: '#fa541c' }, // red error
    { label: 'Net Profit', value: summary.netProfit, color: '#1890ff' }, // blue primary
    { label: 'Tax Liability (18%)', value: summary.taxLiability, color: '#faad14' }, // orange warning
  ];

  const outstandingColumns = [
    {
      title: 'Client',
      dataIndex: 'clientName',
      key: 'clientName',
      ellipsis: true,
      sorter: (a, b) => a.clientName.localeCompare(b.clientName),
      defaultSortOrder: 'ascend',
      width: 200,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => currencyFormatter(amount),
      sorter: (a, b) => a.amount - b.amount,
      width: 120,
    },
    {
      title: 'Due Since',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.dueDate) - new Date(b.dueDate),
      width: 140,
    },
    {
      title: 'Age Bucket',
      dataIndex: 'ageBucket',
      key: 'ageBucket',
      align: 'center',
      width: 110,
    },
  ];

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: '24px auto',
        padding: '0 16px',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: '#222',
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <Title
          level={2}
          style={{
            marginBottom: 6,
            fontWeight: 700,
            color: '#1a1a1a',
            textAlign: 'left',
          }}
        >
          Financial Reports
        </Title>
        {lastUpdated && (
          <Text
            type="secondary"
            style={{
              fontSize: 13,
              display: 'block',
              textAlign: 'left',
              marginBottom: 12,
            }}
          >
            Last updated: {lastUpdated}
          </Text>
        )}
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {summaryCards.map(({ label, value, color }) => (
          <Col xs={24} sm={12} md={6} key={label}>
            <Card
              variant="outlined"
              style={{
                height: 110,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                borderRadius: 10,
                boxShadow: '0 1px 6px rgba(0,0,0,0.1)',
                backgroundColor: '#fff',
              }}
              styles={{
                header: { padding: 0 },
                body: { padding: '16px' },
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#555',
                  marginBottom: 6,
                  letterSpacing: 0.4,
                  userSelect: 'none',
                }}
              >
                {label}
              </Text>
              <Title
                level={3}
                style={{
                  margin: 0,
                  fontVariantNumeric: 'tabular-nums',
                  color,
                  userSelect: 'text',
                }}
              >
                {currencyFormatter(value)}
              </Title>
            </Card>
          </Col>
        ))}
      </Row>

      <Divider style={{ margin: '0 0 32px' }} />

      {/* Profit & Loss BarChart */}
      <Card
        variant="outlined"
        style={{
          marginBottom: 32,
          borderRadius: 12,
          boxShadow: '0 1px 6px rgba(0,0,0,0.1)',
          padding: '20px 24px 28px',
        }}
        styles={{
          header: {
            fontWeight: 600,
            fontSize: 16,
            paddingBottom: 16,
            textAlign: 'left',
          },
          body: { padding: 0 },
        }}
        title="Profit & Loss Overview (Monthly)"
      >
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart
              data={monthlyProfitLoss}
              margin={{ top: 15, right: 30, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#555' }}
                tickLine={false}
                axisLine={{ stroke: '#ccc' }}
              />
              <YAxis
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12, fill: '#555' }}
                tickLine={false}
                axisLine={{ stroke: '#ccc' }}
              />
              <RechartsTooltip formatter={currencyFormatter} />
              <Legend verticalAlign="top" height={36} />
              <Bar
                dataKey="revenue"
                fill="#1890ff"
                name="Revenue"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="expenses"
                fill="#fa541c"
                name="Expenses"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Expenses by Category Horizontal BarChart */}
      <Card
        variant="outlined"
        style={{
          marginBottom: 32,
          borderRadius: 12,
          boxShadow: '0 1px 6px rgba(0,0,0,0.1)',
          padding: '20px 24px 28px',
        }}
        styles={{
          header: {
            fontWeight: 600,
            fontSize: 16,
            paddingBottom: 16,
            textAlign: 'left',
          },
          body: { padding: 0 },
        }}
        title="Expenses by Category"
      >
        <div style={{ width: '100%', height: 360 }}>
          <ResponsiveContainer>
            <BarChart
              data={expensesByCategory}
              layout="vertical"
              margin={{ top: 15, right: 30, left: 80, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis
                type="number"
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12, fill: '#555' }}
                tickLine={false}
                axisLine={{ stroke: '#ccc' }}
              />
              <YAxis
                type="category"
                dataKey="category"
                width={160}
                tick={{ fontSize: 13, fill: '#333', fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
              />
              <RechartsTooltip formatter={currencyFormatter} />
              <Bar dataKey="amount" radius={[0, 10, 10, 0]}>
                {expensesByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Outstanding Payments Table */}
      <Card
        variant="outlined"
        style={{
          borderRadius: 12,
          boxShadow: '0 1px 6px rgba(0,0,0,0.1)',
          padding: '16px 24px',
        }}
        styles={{
          header: {
            fontWeight: 600,
            fontSize: 16,
            textAlign: 'left',
          },
          body: { paddingTop: 0 },
        }}
        title="Outstanding Payments"
      >
        <Table
          columns={outstandingColumns}
          dataSource={outstandingPayments}
          pagination={{ pageSize: 6 }}
          rowKey={(record) => record.id || record.clientName}
          scroll={{ x: 600 }}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default FinancialReports;
