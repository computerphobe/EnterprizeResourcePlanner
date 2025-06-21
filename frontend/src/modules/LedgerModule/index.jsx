// 📁 modules/ClientLedgerModule/index.jsx
import { useState, useMemo } from 'react';
import { Card, Table, Typography, message, Row, Col } from 'antd';
import SelectAsync from '@/components/SelectAsync';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function ClientLedgerModule() {
  const [clientId, setClientId] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLedger = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/ledger/client/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setLedger(data.result);
      } else {
        message.error(data.message || 'Could not fetch ledger');
      }
    } catch (err) {
      message.error('API error while fetching ledger');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      render: (val) => dayjs(val).format('DD MMM YYYY'),
    },
    {
      title: 'Type',
      dataIndex: 'type',
    },
    {
      title: 'Ref No',
      dataIndex: 'number',
    },
    {
      title: 'Amount (₹)',
      dataIndex: 'amount',
      render: (val) => val.toFixed(2),
    },
    {
      title: 'Running Balance',
      render: (_, __, index) => {
        const balance = ledger.slice(0, index + 1).reduce((acc, e) => acc + e.amount, 0);
        return balance.toFixed(2);
      },
    },
  ];

  // 🔢 Compute total credit and debit
  const totals = useMemo(() => {
    let credit = 0;
    let debit = 0;
    ledger.forEach(entry => {
      if (entry.amount > 0) credit += entry.amount;
      else debit += Math.abs(entry.amount);
    });
    return {
      credit,
      debit,
      balance: credit - debit,
    };
  }, [ledger]);

  return (
    <Card title={<Title level={4}>Client Ledger</Title>}>
      <SelectAsync
        placeholder="Select Client"
        entity="client"
        displayLabels={['name']}
        outputValue="_id"
        onChange={(val) => {
          setClientId(val);
          fetchLedger(val);
        }}
      />

      <Table
        columns={columns}
        dataSource={ledger}
        rowKey={(row, i) => `${row.type}-${i}`}
        loading={loading}
        style={{ marginTop: 24 }}
        pagination={false}
      />

      {ledger.length > 0 && (
        <Card style={{ marginTop: 32, background: '#f6ffed' }} bordered={false}>
          <Row gutter={24}>
            <Col span={8}>
              <Text strong>Total Credit (Payments): </Text>
              <Text type="success">₹ {totals.credit.toFixed(2)}</Text>
            </Col>
            <Col span={8}>
              <Text strong>Total Debit (Invoices): </Text>
              <Text type="danger">₹ {totals.debit.toFixed(2)}</Text>
            </Col>
            <Col span={8}>
              <Text strong>Closing Balance: </Text>
              <Text>₹ {totals.balance.toFixed(2)}</Text>
            </Col>
          </Row>
        </Card>
      )}
    </Card>
  );
}
