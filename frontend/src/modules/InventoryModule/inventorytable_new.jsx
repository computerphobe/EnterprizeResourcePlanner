import React, { useState, useMemo } from 'react';
import { 
  Table, Button, Space, Popconfirm, message, Empty, Card, Tag, 
  Input, Select, Row, Col, Statistic, Alert, Tooltip, Badge 
} from 'antd';
import { 
  PlusOutlined, ReloadOutlined, SearchOutlined,
  ExclamationCircleOutlined, WarningOutlined, CheckCircleOutlined,
  DeleteOutlined, EditOutlined, EyeOutlined
} from '@ant-design/icons';
import InventoryForm from './inventoryForm';
import { deleteinventory } from './service';
import moment from 'moment';

const { Search } = Input;
const { Option } = Select;

export default function InventoryTable(props = {}) {
  const { loading = false, refresh, summary = {} } = props;
  const inventoryData = Array.isArray(props.data) ? props.data : [];
  
  const [formVisible, setFormVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStock, setFilterStock] = useState('all');

  // Filter and search functionality
  const filteredData = useMemo(() => {
    let filtered = inventoryData;

    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(item => 
        item.itemName?.toLowerCase().includes(searchLower) ||
        item.productCode?.toLowerCase().includes(searchLower) ||
        item.nameAlias?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (filterCategory && filterCategory !== 'all') {
      filtered = filtered.filter(item => item.category === filterCategory);
    }

    // Apply stock status filter
    if (filterStock && filterStock !== 'all') {
      filtered = filtered.filter(item => {
        const stockStatus = item.quantity === 0 ? 'out_of_stock' : 
                           item.quantity <= (item.minimumStock || 10) ? 'low_stock' :
                           item.quantity >= (item.maximumStock || 1000) ? 'overstock' : 'in_stock';
        return stockStatus === filterStock;
      });
    }

    return filtered;
  }, [inventoryData, searchText, filterCategory, filterStock]);

  // Calculate statistics from filtered data
  const stats = useMemo(() => {
    const total = filteredData.length;
    const lowStock = filteredData.filter(item => 
      item.quantity <= (item.minimumStock || 10) && item.quantity > 0
    ).length;
    const outOfStock = filteredData.filter(item => item.quantity === 0).length;
    const totalValue = filteredData.reduce((sum, item) => 
      sum + (item.quantity * item.price), 0
    );

    return { total, lowStock, outOfStock, totalValue };
  }, [filteredData]);

  // Get stock status color and icon
  const getStockStatus = (item) => {
    if (item.quantity === 0) {
      return { status: 'error', text: 'Out of Stock', icon: <ExclamationCircleOutlined /> };
    }
    if (item.quantity <= (item.minimumStock || 10)) {
      return { status: 'warning', text: 'Low Stock', icon: <WarningOutlined /> };
    }
    if (item.quantity >= (item.maximumStock || 1000)) {
      return { status: 'processing', text: 'Overstock', icon: <WarningOutlined /> };
    }
    return { status: 'success', text: 'In Stock', icon: <CheckCircleOutlined /> };
  };

  // Handle delete
  const handleDelete = async (id, itemName) => {
    try {
      await deleteinventory(id);
      message.success(`"${itemName}" deleted successfully`);
      if (refresh) refresh();
    } catch (err) {
      console.error('Delete error:', err);
      message.error(err.message || 'Failed to delete item');
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select items to delete');
      return;
    }

    try {
      for (const id of selectedRowKeys) {
        await deleteinventory(id);
      }
      message.success(`${selectedRowKeys.length} items deleted successfully`);
      setSelectedRowKeys([]);
      if (refresh) refresh();
    } catch (err) {
      console.error('Bulk delete error:', err);
      message.error('Some items failed to delete');
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Item Details',
      key: 'itemDetails',
      width: 250,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
            {record.itemName}
          </div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            Code: {record.productCode}
          </div>
          {record.nameAlias && record.nameAlias !== record.itemName && (
            <div style={{ color: '#999', fontSize: '11px' }}>
              Alias: {record.nameAlias}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => (
        <Tag color="blue">{category?.charAt(0).toUpperCase() + category?.slice(1)}</Tag>
      ),
    },
    {
      title: 'Stock',
      key: 'stock',
      width: 150,
      render: (_, record) => {
        const stockInfo = getStockStatus(record);
        return (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
              {record.quantity} {record.unit || 'pcs'}
            </div>
            <Badge 
              status={stockInfo.status} 
              text={stockInfo.text}
              style={{ fontSize: '11px' }}
            />
          </div>
        );
      },
    },
    {
      title: 'Price',
      key: 'price',
      width: 120,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
            ₹{record.price?.toFixed(2)}
          </div>
          <div style={{ color: '#666', fontSize: '11px' }}>
            GST: {record.gstRate || 5}%
          </div>
        </div>
      ),
    },
    {
      title: 'Stock Value',
      key: 'stockValue',
      width: 120,
      render: (_, record) => (
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
          ₹{((record.quantity || 0) * (record.price || 0)).toFixed(2)}
        </div>
      ),
    },
    {
      title: 'Stock Limits',
      key: 'limits',
      width: 120,
      render: (_, record) => (
        <div style={{ fontSize: '11px' }}>
          <div>Min: {record.minimumStock || 10}</div>
          <div>Max: {record.maximumStock || 1000}</div>
        </div>
      ),
    },
    {
      title: 'Last Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      render: (date) => date ? moment(date).format('MMM DD, YYYY') : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => {
                // Could open a detailed view modal
                message.info('Detail view coming soon');
              }}
            />
          </Tooltip>
          
          <Tooltip title="Edit Item">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => {
                setEditingItem(record);
                setFormVisible(true);
              }}
            />
          </Tooltip>
          
          <Popconfirm
            title={`Delete "${record.itemName}"?`}
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record._id, record.itemName)}
            okText="Delete"
            cancelText="Cancel"
            okType="danger"
          >
            <Tooltip title="Delete Item">
              <Button 
                type="text" 
                icon={<DeleteOutlined />} 
                size="small"
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Row selection configuration
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  };

  // Get unique categories for filter
  const categories = [...new Set(inventoryData.map(item => item.category).filter(Boolean))];

  return (
    <>
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Items"
              value={stats.total}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Low Stock"
              value={stats.lowStock}
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Out of Stock"
              value={stats.outOfStock}
              prefix={<ExclamationCircleOutlined style={{ color: '#f5222d' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Value"
              value={stats.totalValue}
              precision={2}
              prefix="₹"
            />
          </Card>
        </Col>
      </Row>

      {/* Alerts for low stock */}
      {stats.lowStock > 0 && (
        <Alert
          message={`${stats.lowStock} items are running low on stock`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button 
              size="small" 
              type="text"
              onClick={() => setFilterStock('low_stock')}
            >
              View Items
            </Button>
          }
        />
      )}

      {stats.outOfStock > 0 && (
        <Alert
          message={`${stats.outOfStock} items are out of stock`}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button 
              size="small" 
              type="text"
              onClick={() => setFilterStock('out_of_stock')}
            >
              View Items
            </Button>
          }
        />
      )}

      {/* Controls */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingItem(null);
                  setFormVisible(true);
                }}
              >
                Add Item
              </Button>
              
              <Button
                icon={<ReloadOutlined />}
                onClick={refresh}
                loading={loading}
              >
                Refresh
              </Button>

              {selectedRowKeys.length > 0 && (
                <Popconfirm
                  title={`Delete ${selectedRowKeys.length} selected items?`}
                  onConfirm={handleBulkDelete}
                  okText="Delete All"
                  cancelText="Cancel"
                  okType="danger"
                >
                  <Button danger>
                    Delete Selected ({selectedRowKeys.length})
                  </Button>
                </Popconfirm>
              )}
            </Space>
          </Col>
          
          <Col>
            <Space>
              <Search
                placeholder="Search items..."
                allowClear
                style={{ width: 200 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<SearchOutlined />}
              />
              
              <Select
                value={filterCategory}
                onChange={setFilterCategory}
                style={{ width: 120 }}
                placeholder="Category"
              >
                <Option value="all">All Categories</Option>
                {categories.map(cat => (
                  <Option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Option>
                ))}
              </Select>
              
              <Select
                value={filterStock}
                onChange={setFilterStock}
                style={{ width: 120 }}
                placeholder="Stock Status"
              >
                <Option value="all">All Stock</Option>
                <Option value="in_stock">In Stock</Option>
                <Option value="low_stock">Low Stock</Option>
                <Option value="out_of_stock">Out of Stock</Option>
                <Option value="overstock">Overstock</Option>
              </Select>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={filteredData}
        rowKey="_id"
        loading={loading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        scroll={{ x: 1200 }}
        locale={{
          emptyText: inventoryData.length === 0 ? (
            <Empty
              description="No inventory items found"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingItem(null);
                  setFormVisible(true);
                }}
              >
                Add First Item
              </Button>
            </Empty>
          ) : (
            <Empty
              description="No items match your filters"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button onClick={() => {
                setSearchText('');
                setFilterCategory('all');
                setFilterStock('all');
              }}>
                Clear Filters
              </Button>
            </Empty>
          )
        }}
      />

      {/* Form Modal */}
      <InventoryForm
        open={formVisible}
        onClose={() => {
          setFormVisible(false);
          setEditingItem(null);
        }}
        initialValues={editingItem}
        refresh={refresh}
      />
    </>
  );
}
