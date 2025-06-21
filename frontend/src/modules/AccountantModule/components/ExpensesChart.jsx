import { useEffect, useState, memo } from 'react';
import { Card, Row, Col, Spin, Empty, message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import { request } from '@/request';

// Helper function to generate a conic gradient based on expense categories
const generateConicGradient = (categories) => {
  if (!categories || categories.length === 0) return '';

  const colors = ['#ff4d4f', '#faad14', '#722ed1', '#52c41a', '#1890ff', '#fa541c', '#13c2c2', '#eb2f96'];
  let gradient = '';
  let startPercentage = 0;
  
  categories.forEach((category, index) => {
    const endPercentage = startPercentage + category.value;
    gradient += `${colors[index % colors.length]} ${startPercentage}% ${endPercentage}%, `;
    startPercentage = endPercentage;
  });
  
  // Remove trailing comma and space
  gradient = gradient.slice(0, -2);
  
  return `conic-gradient(${gradient})`;
};

function ExpensesChartComponent({ preloadedData = null, isLoading = false }) {
  const translate = useLanguage();
  const [chartLoaded, setChartLoaded] = useState(false);
  const [loading, setLoading] = useState(preloadedData ? false : true);
  const [expenseCategories, setExpenseCategories] = useState(
    preloadedData?.expenseCategories || []
  );
  const [fetchAttempted, setFetchAttempted] = useState(false);
  
  // Single data fetching effect - only runs once or when dependencies explicitly change
  useEffect(() => {
    let isMounted = true;
    
    // If we already have preloaded data, use it
    if (preloadedData && preloadedData.expenseCategories) {
      if (isMounted) {
        setExpenseCategories(preloadedData.expenseCategories);
        setChartLoaded(true);
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
          
          if (response.success && response.result && response.result.expenseCategories && isMounted) {
            setExpenseCategories(response.result.expenseCategories);
            console.log('Expenses chart fetched data directly');
          } else if (isMounted) {
            console.error('Failed to fetch expense data');
          }
        } catch (error) {
          if (isMounted) {
            console.error("Error fetching expense data:", error);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
            setChartLoaded(true);
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
  
  // Update when preloadedData changes - separate effect to cleanly handle updates
  useEffect(() => {
    if (preloadedData?.expenseCategories) {
      setExpenseCategories(preloadedData.expenseCategories);
      setLoading(false);
      setChartLoaded(true);
    }
  }, [preloadedData]);
  
  // Determine the actual loading state
  const isCurrentlyLoading = isLoading || loading;
  
  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title={translate('Expense Distribution')} 
            bordered={false}
            loading={isCurrentlyLoading}
          >            
            <div 
              style={{ height: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              {isCurrentlyLoading ? (
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
              ) : !chartLoaded ? (
                <div>{translate('Loading chart...')}</div>
              ) : expenseCategories.length === 0 ? (
                <Empty description={translate('No expense data available')} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '300px', height: '300px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {/* Dynamically generate the conic gradient based on the expense categories */}
                    <div 
                      style={{ 
                        position: 'absolute', 
                        width: '100%', 
                        height: '100%', 
                        borderRadius: '50%', 
                        background: generateConicGradient(expenseCategories) 
                      }}
                    ></div>
                    <div style={{ position: 'absolute', width: '60%', height: '60%', borderRadius: '50%', background: 'white' }}></div>
                  </div>
                  
                  <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px' }}>
                    {expenseCategories.map((category, index) => {
                      // Array of colors for the categories
                      const colors = ['#ff4d4f', '#faad14', '#722ed1', '#52c41a', '#1890ff', '#fa541c', '#13c2c2', '#eb2f96'];
                      return (
                        <div key={`category-${category.name}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <div 
                            style={{ 
                              width: '15px', 
                              height: '15px', 
                              background: colors[index % colors.length], 
                              borderRadius: '2px' 
                            }}
                          ></div>
                          <span>{translate(category.name)} ({category.value}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card 
            title={translate('Expense Analysis')} 
            bordered={false}
            loading={isCurrentlyLoading}
          >
            {isCurrentlyLoading ? (
              <div className="flex justify-center items-center p-8">
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
              </div>
            ) : expenseCategories.length === 0 ? (
              <Empty description={translate('No expense data available')} />
            ) : (
              <>
                <div className="mb-4">
                  <h4 className="text-lg font-medium mb-2">{translate('Top Expense Categories')}</h4>
                  <ul className="list-disc pl-5">
                    {expenseCategories.map((category, index) => (
                      <li key={`list-${category.name}-${index}`} className="mb-2">
                        {translate(category.name)}: {category.value}%
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-medium mb-2">{translate('Expense Insights')}</h4>
                  
                  {/* Show actual insights based on the data */}
                  {expenseCategories.length > 0 && (
                    <>
                      <p>
                        {translate(`Largest expense category: ${[...expenseCategories].sort((a, b) => b.value - a.value)[0]?.name} (${[...expenseCategories].sort((a, b) => b.value - a.value)[0]?.value}%)`)}
                      </p>
                      
                      {expenseCategories.length > 1 && (
                        <p>
                          {translate(`Smallest expense category: ${[...expenseCategories].sort((a, b) => a.value - b.value)[0]?.name} (${[...expenseCategories].sort((a, b) => a.value - b.value)[0]?.value}%)`)}
                        </p>
                      )}
                      
                      {/* Calculate average expense percentage */}
                      <p>
                        {translate(`Average category value: ${(expenseCategories.reduce((acc, cat) => acc + cat.value, 0) / expenseCategories.length).toFixed(1)}%`)}
                      </p>
                    </>
                  )}
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

// Use React.memo to prevent unnecessary re-renders
const ExpensesChart = memo(ExpensesChartComponent);

export default ExpensesChart;