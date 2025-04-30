import { useEffect, useState } from 'react';
import { Card, Row, Col, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import { request } from '@/request';

// Helper function to generate a conic gradient based on expense categories
const generateConicGradient = (categories) => {
  const colors = ['#ff4d4f', '#faad14', '#722ed1', '#52c41a', '#1890ff'];
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

function ExpensesChart() {
  const translate = useLanguage();
  const [chartLoaded, setChartLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expenseCategories, setExpenseCategories] = useState([
    { name: 'Salaries and Benefits', value: 35 },
    { name: 'Operations and Maintenance', value: 20 },
    { name: 'Marketing and Advertising', value: 15 },
    { name: 'Office Supplies and Equipment', value: 15 },
    { name: 'Other Expenses', value: 15 }
  ]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await request.getFinancialData();
        
        if (response.success && response.result && response.result.expenseCategories) {
          setExpenseCategories(response.result.expenseCategories);
        }
      } catch (error) {
        console.error("Error fetching expense data:", error);
      } finally {
        setLoading(false);
        setChartLoaded(true);
      }
    };
    
    fetchData();
  }, []);
  
  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>          <Card 
            title={translate('Expense Distribution')} 
            bordered={false}
            loading={loading}
          >            
            <div 
              style={{ height: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              {loading ? (
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
              ) : !chartLoaded ? (
                <div>{translate('Loading chart...')}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '300px', height: '300px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {/* Dynamically generate the conic gradient based on the expense categories */}
                    {expenseCategories.length > 0 && (
                      <div 
                        style={{ 
                          position: 'absolute', 
                          width: '100%', 
                          height: '100%', 
                          borderRadius: '50%', 
                          background: generateConicGradient(expenseCategories) 
                        }}
                      ></div>
                    )}
                    <div style={{ position: 'absolute', width: '60%', height: '60%', borderRadius: '50%', background: 'white' }}></div>
                  </div>
                  
                  <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px' }}>
                    {expenseCategories.map((category, index) => {
                      // Array of colors for the categories
                      const colors = ['#ff4d4f', '#faad14', '#722ed1', '#52c41a', '#1890ff'];
                      return (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
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
        
        <Col xs={24} lg={12}>          <Card 
            title={translate('Expense Analysis')} 
            bordered={false}
            loading={loading}
          >
            {!loading && (
              <>
                <div className="mb-4">
                  <h4 className="text-lg font-medium mb-2">{translate('Top Expense Categories')}</h4>
                  <ul className="list-disc pl-5">
                    {expenseCategories.map((category, index) => (
                      <li key={index} className="mb-2">
                        {translate(category.name)}: {category.value}%
                      </li>
                    ))}
                  </ul>
                </div>
                  <div>
                  <h4 className="text-lg font-medium mb-2">{translate('Expense Trends')}</h4>
                  {/* Dynamically calculate these values based on the actual data */}                  <p>
                    {translate('Overall expenses compared to the previous quarter:')}
                  </p>
                    {/* Always show these insights based on available data */}
                  <p>
                    {translate(`Largest category: ${
                      [...expenseCategories].sort((a, b) => b.value - a.value)[0]?.name
                    } (${
                      [...expenseCategories].sort((a, b) => b.value - a.value)[0]?.value
                    }%)`)}
                  </p>
                  
                  <p>
                    {translate(`Smallest category: ${
                      [...expenseCategories].sort((a, b) => a.value - b.value)[0]?.name
                    } (${
                      [...expenseCategories].sort((a, b) => a.value - b.value)[0]?.value
                    }%)`)}
                  </p>
                </div>
              </>
            )}          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default ExpensesChart;