import { Tag } from 'antd';
import useLanguage from '@/locale/useLanguage';

const columns = () => {
  const translate = useLanguage();

  return [
    {
      title: translate('Item Name'),
      dataIndex: 'itemName',
      key: 'itemName',
    },
    {
      title: translate('Product Code'),
      dataIndex: 'productCode',
      key: 'productCode',
    },
    {
      title: translate('Name Alias'),
      dataIndex: 'nameAlias',
      key: 'nameAlias',
    },
    {
      title: translate('Material'),
      dataIndex: 'material',
      key: 'material',
    },
    {
      title: translate('GST Rate'),
      dataIndex: 'gstRate',
      key: 'gstRate',
    },
    {
      title: translate('Quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: translate('Category'),
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: translate('Price'),
      dataIndex: 'price',
      key: 'price',
      render: (price) => `$${price}`,
    },
    {
      title: translate('Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'blue';
        if (status === 'Low Stock') color = 'orange';
        if (status === 'Out of Stock') color = 'red';
        if (status === 'In Stock') color = 'green';

        return <Tag color={color}>{status}</Tag>;
      },
    },
  ];
};

export default columns;
