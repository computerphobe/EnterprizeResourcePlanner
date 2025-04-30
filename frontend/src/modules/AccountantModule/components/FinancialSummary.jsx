import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, LoadingOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import { useMoney } from '@/settings';
import { selectMoneyFormat } from '@/redux/settings/selectors';
import { useSelector } from 'react-redux';
import { request } from '@/request';

function FinancialSummary() {
  const translate = useLanguage();
  const { moneyFormatter } = useMoney();
  const money_format_settings = useSelector(selectMoneyFormat);
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    revenueChange: 0,
    totalExpenses: 0,
    expensesChange: 0,
    netProfit: 0,
    netProfitChange: 0,
    taxLiability: 0,
    taxLiabilityChange: 0
  });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await request.getFinancialData();
        if (response.success) {
          setFinancialData(response.result.summary);
        }
      } catch (error) {
        console.error("Error fetching financial data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  return (
    <Card title={translate('Financial Summary')}>
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title={translate('Total Revenue')}
            value={moneyFormatter({ 
              amount: financialData.totalRevenue, 
              currency_code: money_format_settings?.default_currency_code 
            })}
            precision={2}
            valueStyle={{ color: '#3f8600' }}
            prefix={<ArrowUpOutlined />}
            suffix={<small style={{ fontSize: '12px', color: '#3f8600' }}>{financialData.revenueChange}%</small>}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title={translate('Total Expenses')}
            value={moneyFormatter({ 
              amount: financialData.totalExpenses, 
              currency_code: money_format_settings?.default_currency_code 
            })}
            precision={2}
            valueStyle={{ color: '#cf1322' }}
            prefix={<ArrowUpOutlined />}
            suffix={<small style={{ fontSize: '12px', color: '#cf1322' }}>{financialData.expensesChange}%</small>}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title={translate('Net Profit')}
            value={moneyFormatter({ 
              amount: financialData.netProfit, 
              currency_code: money_format_settings?.default_currency_code 
            })}
            precision={2}
            valueStyle={{ color: '#3f8600' }}
            prefix={<ArrowUpOutlined />}
            suffix={<small style={{ fontSize: '12px', color: '#3f8600' }}>{financialData.netProfitChange}%</small>}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title={translate('Tax Liability')}
            value={moneyFormatter({ 
              amount: financialData.taxLiability, 
              currency_code: money_format_settings?.default_currency_code 
            })}
            precision={2}
            valueStyle={{ color: financialData.taxLiabilityChange < 0 ? '#3f8600' : '#cf1322' }}
            prefix={financialData.taxLiabilityChange < 0 ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
            suffix={<small style={{ fontSize: '12px', color: financialData.taxLiabilityChange < 0 ? '#3f8600' : '#cf1322' }}>{Math.abs(financialData.taxLiabilityChange)}%</small>}
          />
        </Col>
      </Row>
    </Card>
  );
}

export default FinancialSummary;