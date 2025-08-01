// 📁 modules/ClientLedgerModule/index.jsx
import { useState, useMemo, useEffect } from 'react';
import { Card, Table, Typography, message, Row, Col } from 'antd';
import SelectAsync from '@/components/SelectAsync';
import { API_BASE_URL } from '@/config/serverApiConfig';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function ClientLedgerModule() {
  const [clientId, setClientId] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(0);

  const fetchLedger = async (id) => {
    if (!id) {
      console.log('❌ No client ID provided');
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔍 Fetching ledger for client ID:', id);
      
      const token = localStorage.getItem('token');
      console.log('🔍 Token exists:', !!token);
      
      // Use API_BASE_URL for hosted environment compatibility
      const apiUrl = `${API_BASE_URL}ledger/client/${id}`;
      console.log('🔍 API URL:', apiUrl);
      
      const res = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🔍 Response status:', res.status);
      console.log('🔍 Response ok:', res.ok);

      const data = await res.json();
      console.log('🔍 Response data:', data);

      if (res.ok && data.success) {
        console.log('✅ Successfully fetched ledger entries:', data.result.length);
        setLedger(data.result);
        setCurrentBalance(data.currentBalance || 0);
      } else {
        console.error('❌ API Error:', data.message || 'Could not fetch ledger');
        message.error(data.message || 'Could not fetch ledger');
      }
    } catch (err) {
      console.error('❌ Network/Parse Error:', err);
      message.error('API error while fetching ledger: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      render: (val) => dayjs(val).format('DD MMM YYYY'),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      filters: [
        { text: 'Invoice', value: 'Invoice' },
        { text: 'Payment', value: 'Payment' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Reference',
      dataIndex: 'number',
    },
    {
      title: 'Description',
      dataIndex: 'description',
    },
    {
      title: 'Debit (₹)',
      dataIndex: 'debit',
      render: (val) => val ? `₹${val.toFixed(2)}` : '-',
      align: 'right',
    },
    {
      title: 'Credit (₹)',
      dataIndex: 'credit',
      render: (val) => val ? `₹${val.toFixed(2)}` : '-',
      align: 'right',
    },
    {
      title: 'Balance (₹)',
      dataIndex: 'balance',
      render: (val) => (
        <span style={{ color: val > 0 ? '#cf1322' : val < 0 ? '#389e0d' : '#000' }}>
          ₹{val?.toFixed(2) || '0.00'}
        </span>
      ),
      align: 'right',
    },
  ];

  // 🔢 Compute total credit and debit
  const totals = useMemo(() => {
    let credit = 0;
    let debit = 0;
    ledger.forEach(entry => {
      credit += entry.credit || 0;
      debit += entry.debit || 0;
    });
    return {
      credit,
      debit,
      balance: debit - credit, // In accounting: Assets (debit) - Liabilities (credit)
    };
  }, [ledger]);

  return (
    <Card title={<Title level={4}>Client Ledger</Title>}>
      <SelectAsync
        placeholder="Select Client"
        entity="client"
        displayLabels={['name']}
        outputValue="_id"
        onChange={(val, option) => {
          console.log('🎯 Client selected:', { val, option });
          setClientId(val);
          setSelectedClient(option);
          fetchLedger(val);
        }}
        style={{ width: '100%', marginBottom: 16 }}
      />

      <Table
        columns={columns}
        dataSource={ledger}
        rowKey={(record) => record._id || `${record.type}-${record.date}-${Math.random()}`}
        loading={loading}
        style={{ marginTop: 24 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} entries`,
        }}
        locale={{
          emptyText: clientId ? 'No ledger entries found for this client' : 'Please select a client to view ledger entries'
        }}
        scroll={{ x: 800 }}
      />

      {ledger.length > 0 && (
        <Card style={{ marginTop: 32, background: '#f6ffed' }} bordered={false}>
          <Row gutter={24}>
            <Col span={6}>
              <Text strong>Total Invoices (Debit): </Text>
              <Text type="danger">₹ {totals.debit.toFixed(2)}</Text>
            </Col>
            <Col span={6}>
              <Text strong>Total Payments (Credit): </Text>
              <Text type="success">₹ {totals.credit.toFixed(2)}</Text>
            </Col>
            <Col span={6}>
              <Text strong>Current Balance: </Text>
              <Text 
                strong 
                style={{ 
                  color: currentBalance > 0 ? '#cf1322' : currentBalance < 0 ? '#389e0d' : '#000' 
                }}
              >
                ₹ {currentBalance.toFixed(2)}
              </Text>
            </Col>
            <Col span={6}>
              <Text strong>Total Entries: </Text>
              <Text>{ledger.length}</Text>
            </Col>
          </Row>
        </Card>
      )}
    </Card>
  );
}
