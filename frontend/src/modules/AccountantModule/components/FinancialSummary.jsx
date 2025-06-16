import { useState, useEffect, memo } from 'react';
import { Row, Col, Card, Statistic, Spin } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, LoadingOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import { useMoney } from '@/settings';
import { selectMoneyFormat } from '@/redux/settings/selectors';
import { useSelector } from 'react-redux';
import { request } from '@/request';

function FinancialSummaryComponent({ preloadedData = null, isLoading = false }) {
  const translate = useLanguage();
  const { moneyFormatter } = useMoney();
  const money_format_settings = useSelector(selectMoneyFormat);
  const [loading, setLoading] = useState(preloadedData ? false : true);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const [financialData, setFinancialData] = useState(
    preloadedData?.summary || {
      totalRevenue: 0,
      revenueChange: 0,
      totalExpenses: 0,
      expensesChange: 0,
      netProfit: 0,
      netProfitChange: 0,
      taxLiability: 0,
      taxLiabilityChange: 0
    }
  );
  
  // Single data fetching effect
  useEffect(() => {
    let isMounted = true;
    
    // If we already have preloaded data, use it
    if (preloadedData && preloadedData.summary) {
      if (isMounted) {
        setFinancialData(preloadedData.summary);
        setLoading(false);
      }
      return;
    }
    
    // Only fetch if no preloaded data and we haven't already tried
    if (!preloadedData && !fetchAttempted && !isLoading) {
      const fetchData = async () => {
        try {
          if (isMounted) setLoading(true);
          const response = await request.getFinancialData();
          
          if (response.success && response.result && response.result.summary && isMounted) {
            setFinancialData(response.result.summary);
            console.log('Financial summary fetched data directly');
          } else if (isMounted) {
            console.error('Failed to fetch financial summary data');
          }
        } catch (error) {
          if (isMounted) {
            console.error("Error fetching financial data:", error);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
            setFetchAttempted(true);
          }
        }
      };
      
      fetchData();
    }
    
    return () => {
      isMounted = false;
    };
  }, [preloadedData, fetchAttempted, isLoading]);
  
  // Update when preloadedData changes
  useEffect(() => {
    if (preloadedData?.summary) {
      setFinancialData(preloadedData.summary);
      setLoading(false);
    }
  }, [preloadedData]);
  
  // Determine the actual loading state
  const isCurrentlyLoading = isLoading || loading;
  
  return (
    <Card 
      title={translate('Financial Summary')}
      loading={isCurrentlyLoading}
    >
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title={translate('Total Revenue')}
            value={moneyFormatter({ 
              amount: financialData.totalRevenue || 0, 
              currency_code: money_format_settings?.default_currency_code 
            })}
            precision={2}
            valueStyle={{ color: '#3f8600' }}
            prefix={financialData.revenueChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            suffix={<small style={{ 
              fontSize: '12px', 
              color: financialData.revenueChange >= 0 ? '#3f8600' : '#cf1322' 
            }}>{financialData.revenueChange}%</small>}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title={translate('Total Expenses')}
            value={moneyFormatter({ 
              amount: financialData.totalExpenses || 0, 
              currency_code: money_format_settings?.default_currency_code 
            })}
            precision={2}
            valueStyle={{ color: '#cf1322' }}
            prefix={financialData.expensesChange > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            suffix={<small style={{ 
              fontSize: '12px', 
              color: financialData.expensesChange > 0 ? '#cf1322' : '#3f8600' 
            }}>{Math.abs(financialData.expensesChange)}%</small>}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title={translate('Net Profit')}
            value={moneyFormatter({ 
              amount: financialData.netProfit || 0, 
              currency_code: money_format_settings?.default_currency_code 
            })}
            precision={2}
            valueStyle={{ color: financialData.netProfit >= 0 ? '#3f8600' : '#cf1322' }}
            prefix={financialData.netProfitChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            suffix={<small style={{ 
              fontSize: '12px', 
              color: financialData.netProfitChange >= 0 ? '#3f8600' : '#cf1322' 
            }}>{financialData.netProfitChange}%</small>}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title={translate('Tax Liability')}
            value={moneyFormatter({ 
              amount: financialData.taxLiability || 0, 
              currency_code: money_format_settings?.default_currency_code 
            })}
            precision={2}
            valueStyle={{ color: financialData.taxLiabilityChange < 0 ? '#3f8600' : '#cf1322' }}
            prefix={financialData.taxLiabilityChange < 0 ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
            suffix={<small style={{ 
              fontSize: '12px', 
              color: financialData.taxLiabilityChange < 0 ? '#3f8600' : '#cf1322' 
            }}>{Math.abs(financialData.taxLiabilityChange)}%</small>}
          />
        </Col>
      </Row>
    </Card>
  );
}

// Use React.memo to prevent unnecessary re-renders
const FinancialSummary = memo(FinancialSummaryComponent);

export default FinancialSummary;