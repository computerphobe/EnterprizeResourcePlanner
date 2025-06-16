import { useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import {
  Form,
  Input,
  InputNumber,
  Button,
  Select,
  Divider,
  Row,
  Col,
  Spin,
  message,
  DatePicker,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import AutoCompleteAsync from '@/components/AutoCompleteAsync';
import ItemRow from '@/modules/ErpPanelModule/ItemRow';
import MoneyInputFormItem from '@/components/MoneyInputFormItem';
import { selectFinanceSettings } from '@/redux/settings/selectors';
import { useDate } from '@/settings';
import useLanguage from '@/locale/useLanguage';
import calculate from '@/utils/calculate';
import { useSelector } from 'react-redux';
import SelectAsync from '@/components/SelectAsync';

// ✅ This is now the outer component that only passes props
const InvoiceForm = ({ subTotal = 0, current = null, form }) => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { last_invoice_number } = useSelector(selectFinanceSettings);

  if (!form || last_invoice_number === undefined) {
    return null;
  }

  return (
    <LoadInvoiceForm
      subTotal={subTotal}
      current={current}
      orderId={orderId}
      form={form}
    />
  );
};

const LoadInvoiceForm = ({ subTotal = 0, current = null, orderId = null, form }) => {
  const translate = useLanguage();
  const { dateFormat } = useDate();
  const { last_invoice_number } = useSelector(selectFinanceSettings);
  const [total, setTotal] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [taxTotal, setTaxTotal] = useState(0);
  const [currentYear] = useState(() => new Date().getFullYear());
  const [lastNumber] = useState(() => last_invoice_number + 1);
  const [loading, setLoading] = useState(false);
  const [calculatedSubTotal, setCalculatedSubTotal] = useState(0);
  const addFieldButtonRef = useRef(null);

  const calculateSubTotal = (items) => {
    return items.reduce((sum, item) => {
      return calculate.add(sum, calculate.multiply(item.quantity || 0, item.price || 0));
    }, 0);
  };

  const handleTaxChange = (value) => {
    const newTaxRate = value / 100;
    setTaxRate(newTaxRate);
    const newTaxTotal = calculate.multiply(calculatedSubTotal, newTaxRate);
    const newTotal = calculate.add(calculatedSubTotal, newTaxTotal);
    setTaxTotal(Number.parseFloat(newTaxTotal));
    setTotal(Number.parseFloat(newTotal));
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !orderId || !form) return;

    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/order/${orderId}/details`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const contentType = res.headers.get('content-type') || '';
        if (!res.ok) {
          const errorData = contentType.includes('application/json')
            ? await res.json()
            : await res.text();
          throw new Error(errorData.message || 'Failed to load order details');
        }        const data = await res.json();
        if (data.success) {
          const formattedItems = data.order.items.map(item => {
            const itemName = item.inventoryItem?.name || item.inventoryItem?.itemName || '';
            const quantity = item.quantity; // This is now the "used" quantity
            const price = item.price;
            const total = calculate.multiply(quantity, price);

            return {
              itemName,
              description: item.description || '',
              quantity,
              price,
              total, // ✅ Add this to satisfy Joi schema
              // Additional info for reference
              originalQuantity: item.originalQuantity,
              returnedQuantity: item.returnedQuantity
            };
          });          // Check if any items were completely returned (filtered out)
          const hasReturns = data.order.hasReturns;
          const filteredItemCount = data.order.filteredItemCount || 0;
          
          if (hasReturns) {
            const returnMessage = filteredItemCount > 0 
              ? `Invoice adjusted for returned items. ${filteredItemCount} item(s) completely returned and excluded. Only "used" quantities are included.`
              : 'Invoice adjusted for returned items. Only "used" quantities are included.';
            message.info(returnMessage);
          }          form.setFieldsValue({
            client: data.client, // Set the full client object for AutoCompleteAsync
            doctorName: data.doctorName,
            hospitalName: data.hospitalName,
            items: formattedItems,
          });

          // If no client was auto-created/found, show a message
          if (!data.client) {
            message.warning('No existing client found for this doctor/hospital. Please select or create a client manually.');
          } else {
            message.success(`Client "${data.client.name}" automatically selected for this order.`);
          }

          const newSubTotal = calculateSubTotal(formattedItems);
          setCalculatedSubTotal(newSubTotal);
          const newTaxTotal = calculate.multiply(newSubTotal, taxRate);
          const newTotal = calculate.add(newSubTotal, newTaxTotal);
          setTaxTotal(Number.parseFloat(newTaxTotal));
          setTotal(Number.parseFloat(newTotal));
        } else {
          throw new Error(data.message || 'Failed to load order details');
        }
      } catch (err) {
        console.error('Error loading order details:', err);
        message.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, form]);

  const handleValuesChange = (changedValues, allValues) => {
    if (changedValues.items || changedValues.taxRate !== undefined) {
      const newSubTotal = calculateSubTotal(allValues.items || []);
      setCalculatedSubTotal(newSubTotal);
      const newTaxTotal = calculate.multiply(newSubTotal, taxRate);
      const newTotal = calculate.add(newSubTotal, newTaxTotal);
      setTaxTotal(Number.parseFloat(newTaxTotal));
      setTotal(Number.parseFloat(newTotal));
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>{translate('Loading order data...')}</p>
      </div>
    );
  }

  return (
    <>
      <Row gutter={[12, 0]}>
        <Col span={8}>
          <Form.Item name="client" label={translate('Client')} rules={[{ required: true }]}>            <AutoCompleteAsync
              entity="client"
              displayLabels={['name']}
              searchFields="name"
              onSelect={(client) => {
                // Handle both object and primitive values
                const clientValue = typeof client === 'object' && client !== null ? client._id : client;
                form.setFieldsValue({ client: clientValue });
              }}
              outputValue="_id"
              withRedirect
              urlToRedirect="/customer"
              redirectLabel={translate('Add New Client')}
            />
          </Form.Item>
        </Col>
        <Col span={3}>
          <Form.Item label={translate('number')} name="number" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={3}>
          <Form.Item label={translate('year')} name="year" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={5}>
          <Form.Item label={translate('status')} name="status">
            <Select
              options={[
                { value: 'draft', label: translate('Draft') },
                { value: 'pending', label: translate('Pending') },
                { value: 'sent', label: translate('Sent') },
              ]}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="date" label={translate('Date')} rules={[{ required: true, type: 'object' }]}>
            <DatePicker style={{ width: '100%' }} format={dateFormat} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="expiredDate" label={translate('Expire Date')} rules={[{ required: true, type: 'object' }]}>
            <DatePicker style={{ width: '100%' }} format={dateFormat} />
          </Form.Item>
        </Col>
        <Col span={10}>
          <Form.Item label={translate('Note')} name="notes">
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Divider dashed />

      <Row gutter={[12, 12]} style={{ position: 'relative' }}>
        <Col span={5}><p>{translate('Item')}</p></Col>
        <Col span={7}><p>{translate('Description')}</p></Col>
        <Col span={3}><p>{translate('Quantity')}</p></Col>
        <Col span={4}><p>{translate('Price')}</p></Col>
        <Col span={5}><p>{translate('Total')}</p></Col>
      </Row>

      <Form.List name="items">
        {(fields, { add, remove }) => (
          <>
            {fields.map((field) => (
              <ItemRow key={field.key} remove={remove} field={field} current={current} />
            ))}
            <Form.Item>
              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
                ref={addFieldButtonRef}
              >
                {translate('Add field')}
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>

      <Divider dashed />

      <div style={{ width: '100%', float: 'right' }}>
        <Row gutter={[12, -5]}>
          <Col span={5}>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />} block>
                {translate('Save')}
              </Button>
            </Form.Item>
          </Col>
          <Col span={4} offset={10}>
            <p style={{ paddingLeft: 12, paddingTop: 5, margin: 0, textAlign: 'right' }}>
              {translate('Sub Total')}:
            </p>
          </Col>
          <Col span={5}>
            <MoneyInputFormItem readOnly value={calculatedSubTotal} />
          </Col>
        </Row>

        <Row gutter={[12, -5]}>
          <Col span={4} offset={15}>
            <Form.Item name="taxRate" rules={[{ required: true }]}>
              <SelectAsync
                onChange={handleTaxChange}
                entity="taxes"
                outputValue="taxValue"
                displayLabels={['taxName']}
                withRedirect
                urlToRedirect="/taxes"
                redirectLabel={translate('Add New Tax')}
                placeholder={translate('Select Tax Value')}
              />
            </Form.Item>
          </Col>
          <Col span={5}>
            <MoneyInputFormItem readOnly value={taxTotal} />
          </Col>
        </Row>

        <Row gutter={[12, -5]}>
          <Col span={4} offset={15}>
            <p style={{ paddingLeft: 12, paddingTop: 5, margin: 0, textAlign: 'right' }}>
              {translate('Total')}:
            </p>
          </Col>
          <Col span={5}>
            <MoneyInputFormItem readOnly value={total} />
          </Col>
        </Row>
      </div>
    </>
  );
};

export default InvoiceForm;
