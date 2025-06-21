import { Form, Select, Input, Switch, InputNumber } from 'antd';

import useLanguage from '@/locale/useLanguage';

import { currencyOptions } from '@/utils/currencyList';

export default function SettingsForm() {
  const translate = useLanguage();

  return (
    <div>
      <Form.Item
        label={translate('Currency')}
        name="default_currency_code"
        rules={[
          {
            required: true,
          },
        ]}
      >        <Select
          showSearch
          filterOption={(input, option) => {
            const label = option?.label || '';
            const searchString = typeof label === 'string' ? label : String(label || '');
            const inputString = typeof input === 'string' ? input : String(input || '');
            return searchString.toLowerCase().includes(inputString.toLowerCase());
          }}
          filterSort={(optionA, optionB) => {
            const labelA = optionA?.label || '';
            const labelB = optionB?.label || '';
            const stringA = typeof labelA === 'string' ? labelA : String(labelA || '');
            const stringB = typeof labelB === 'string' ? labelB : String(labelB || '');
            return stringA.toLowerCase().startsWith(stringB.toLowerCase());
          }}
          options={currencyOptions()}
        ></Select>
      </Form.Item>
      <Form.Item
        label={translate('Currency Symbol')}
        name="currency_symbol"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label={translate('Currency Position')}
        name="currency_position"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Select>
          <Select.Option value="before">{translate('before')}</Select.Option>
          <Select.Option value="after">{translate('after')}</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        label={translate('Decimal Separator')}
        name="decimal_sep"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Input autoComplete="off" />
      </Form.Item>
      <Form.Item
        label={translate('Thousand Separator')}
        name="thousand_sep"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Input autoComplete="off" />
      </Form.Item>
      <Form.Item
        label={translate('Cent precision')}
        name="cent_precision"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <InputNumber min={0} />
      </Form.Item>
      <Form.Item
        label={translate('Zero Format')}
        name="zero_format"
        rules={[
          {
            required: true,
          },
        ]}
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
    </div>
  );
}
