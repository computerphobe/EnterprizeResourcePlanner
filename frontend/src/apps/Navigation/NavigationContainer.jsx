import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Drawer, Layout, Menu } from 'antd';
import { useSelector } from 'react-redux';

import { useAppContext } from '@/context/appContext';
import { selectAuth } from '@/redux/auth/selectors';

import useLanguage from '@/locale/useLanguage';
import logoIcon from '@/style/images/logo-icon.svg';
import logoText from '@/style/images/logo-text.svg';

import useResponsive from '@/hooks/useResponsive';

import {
  SettingOutlined,
  CustomerServiceOutlined,
  ContainerOutlined,
  FileSyncOutlined,
  DashboardOutlined,
  TagOutlined,
  TagsOutlined,
  UserOutlined,
  CreditCardOutlined,
  MenuOutlined,
  FileOutlined,
  ShopOutlined,
  FilterOutlined,
  WalletOutlined,
  ReconciliationOutlined,
  SwapOutlined,
  ShoppingCartOutlined,
  LinuxOutlined,
  OrderedListOutlined,
  QuestionCircleFilled,
  LinkedinFilled,
  HistoryOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

export default function Navigation() {
  const { isMobile } = useResponsive();

  return isMobile ? <MobileSidebar /> : <Sidebar collapsible={false} />;
}

function Sidebar({ collapsible, isMobile = false }) {
  let location = useLocation();

  const { state: stateApp, appContextAction } = useAppContext();
  const { isNavMenuClose } = stateApp;
  const { navMenu } = appContextAction;
  const [showLogoApp, setLogoApp] = useState(isNavMenuClose);
  const [currentPath, setCurrentPath] = useState(location.pathname.slice(1));

  const { current: currentUser } = useSelector(selectAuth);
  const userRole = currentUser?.role || 'guest';

  const translate = useLanguage();
  const navigate = useNavigate();

  // Define menu items by role
  const getMenuItemsForRole = (role) => {
    // Common menu items for all logged-in users
    const commonItems = [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: <Link to={'/'}>{translate('dashboard')}</Link>,
      },
      {
        key: 'about',
        label: <Link to={'/about'}>{translate('about')}</Link>,
        icon: <ReconciliationOutlined />,
      },
      {
        key: 'profile',
        label: <Link to={'/profile'}>{translate('profile')}</Link>,
        icon: <UserOutlined />,
      },
    ];

    // Role-specific menu items
    const roleMenuItems = {
      owner: [
        {
          key:'register',
          icon: <LinuxOutlined />,
          label: <Link to={'/register'}>{translate('register')}</Link>
        },
        {
          key: 'customer',
          icon: <CustomerServiceOutlined />,
          label: <Link to={'/customer'}>{translate('customers')}</Link>,
        },
        {
          key: 'invoice',
          icon: <ContainerOutlined />,
          label: <Link to={'/invoice'}>{translate('invoices')}</Link>,
        },
        {
          key: 'quote',
          icon: <FileSyncOutlined />,
          label: <Link to={'/quote'}>{translate('quote')}</Link>,
        },
        {
          key: 'payment',
          icon: <CreditCardOutlined />,
          label: <Link to={'/payment'}>{translate('payments')}</Link>,
        },
        {
          key: 'paymentMode',
          label: <Link to={'/payment/mode'}>{translate('payments_mode')}</Link>,
          icon: <WalletOutlined />,
        },
        {
          key: 'taxes',
          label: <Link to={'/taxes'}>{translate('taxes')}</Link>,
          icon: <ShopOutlined />,
        },
        {
          key: 'generalSettings',
          label: <Link to={'/settings'}>{translate('settings')}</Link>,
          icon: <SettingOutlined />,
        },
        {
          key: 'inventory',
          label: <Link to={'/inventory'}>{translate('inventory')}</Link>,
          icon: <TagsOutlined />,
        },
        {
          key: 'returns',
          label: <Link to={'/returns'}>{translate('returns')}</Link>,
          icon: <SwapOutlined />,
        },
        {
          key: 'supplier',
          label: <Link to={'/supplier'}>{translate('suppliers')}</Link>,
          icon: <UserOutlined />
        },
        {
          key: 'purchase',
          label: <Link to={'/purchase'}>{translate('purchases')}</Link>,
          icon: <ShoppingCartOutlined />
        },        {
          key: 'Orders',
          label: <Link to={'/order'}>{translate('order')}</Link>,
          icon: <OrderedListOutlined />
        },
        {
          key: 'history',
          label: <Link to={'/system-history'}>{translate('System History')}</Link>,
          icon: <HistoryOutlined />
        },
      ],
      doctor: [
        {
          key: 'orders',
          icon: <ContainerOutlined />,
          label: <Link to={'/orders'}>{translate('orders')}</Link>,
        },
        {
          key: 'new-order',
          icon: <FileSyncOutlined />,
          label: <Link to={'/orders/new'}>{translate('new_order')}</Link>,
        },
        {
          key: 'returns',
          label: <Link to={'/returns'}>{translate('returns')}</Link>,
          icon: <SwapOutlined />,
        },
        {
          key: 'new-return',
          label: <Link to={'/returns/new'}>{translate('new_return')}</Link>,
          icon: <FileOutlined />,
        }
      ],
      hospital: [
        {
          key: 'orders',
          icon: <ContainerOutlined />,
          label: <Link to={'/orders'}>{translate('orders')}</Link>,
        },
        {
          key: 'inventory',
          label: <Link to={'/inventory'}>{translate('inventory')}</Link>,
          icon: <TagsOutlined />,
        }
      ],
      distributor: [
        {
          key: 'orders',
          icon: <ContainerOutlined />,
          label: <Link to={'/orders'}>{translate('orders')}</Link>,
        },
        {
          key: 'inventory',
          label: <Link to={'/inventory'}>{translate('inventory')}</Link>,
          icon: <TagsOutlined />,
        },
        {
          key: 'supplier',
          label: <Link to={'/supplier'}>{translate('suppliers')}</Link>,
          icon: <UserOutlined />
        }
      ],
      deliverer: [
        // Removed 'deliverer-dashboard' entry to avoid duplicate dashboard
        {
          key: 'delivery-current',
          icon: <ContainerOutlined />,
          label: <Link to={'/current-orders'}>{translate('current_orders')}</Link>,
        },
        {
          key: 'delivery-pickup',
          icon: <FileSyncOutlined />,
          label: <Link to={'/pickup'}>{translate('pickup_confirmation')}</Link>,
        },
        {
          key: 'delivery-confirmation',
          icon: <ReconciliationOutlined />,
          label: <Link to={'/confirmation'}>{translate('delivery_confirmation')}</Link>,
        },
        {
          key: 'delivery-history',
          icon: <FileOutlined />,
          label: <Link to={'/history'}>{translate('delivery_history')}</Link>,
        }
      ],
      accountant: [
        {
          key: 'customer',
          icon: <CustomerServiceOutlined />,
          label: <Link to={'/customer'}>{translate('customers')}</Link>,
        },
        {
          key: 'invoices',
          icon: <ContainerOutlined />,
          label: <Link to={'/invoice'}>{translate('invoices')}</Link>,
        },
        {
          key: 'payments',
          icon: <CreditCardOutlined />,
          label: <Link to={'/payment'}>{translate('payments')}</Link>,
        },
        {
          key: 'Client Ledger',
          icon: <LinkedinFilled />,
          label: <Link to={'/ledger'}>{ translate('Client Ledger') }</Link>
        },
        {
          key: 'expenses',
          icon: <WalletOutlined />,
          label: <Link to={'/expenses'}>{translate('expenses')}</Link>,
        },
        {
          key: 'reports',
          icon: <ReconciliationOutlined />,
          label: <Link to={'/reports'}>{translate('financial_reports')}</Link>,
        },        {
          key: 'pendingOrders',
          icon : <QuestionCircleFilled />,
          label: <Link to={'/pending'}>{translate('Pending Invoices')}</Link>
        },
        {
          key: 'history',
          label: <Link to={'/system-history'}>{translate('System History')}</Link>,
          icon: <HistoryOutlined />
        },
      ],
      // Default role (if role not found)
      default: []
    };

    const roleItems = roleMenuItems[role] || roleMenuItems.default;
    return [...commonItems, ...roleItems];
  };

  // Get menu items based on user role
  const items = getMenuItemsForRole(userRole);

  // Handle path change without causing infinite loops
  useEffect(() => {
    if (location) {
      let newPath = location.pathname.slice(1); // e.g. 'deliverer' or 'delivery/current-orders'

      // Normalize root path
      if (location.pathname === '/') {
        newPath = 'dashboard';
      }

      // Normalize delivery-related paths
      if (newPath.startsWith('delivery/current-orders')) newPath = 'delivery-current';
      else if (newPath.startsWith('delivery/pickup')) newPath = 'delivery-pickup';
      else if (newPath.startsWith('delivery/confirmation')) newPath = 'delivery-confirmation';
      else if (newPath.startsWith('delivery/history')) newPath = 'delivery-history';

      // Removed deliverer-dashboard mapping to avoid error since that dashboard was deleted
      // if (newPath === 'deliverer') newPath = 'deliverer-dashboard';

      if (currentPath !== newPath) {
        setCurrentPath(newPath);
      }
    }
  }, [location]);

  // Handle logo animation without causing infinite loops
  useEffect(() => {
    if (isNavMenuClose) {
      setLogoApp(true);
    } else {
      const timer = setTimeout(() => {
        setLogoApp(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isNavMenuClose]);

  const onCollapse = () => {
    navMenu.collapse();
  };

  return (
    <Sider
      collapsible={collapsible}
      collapsed={collapsible ? isNavMenuClose : collapsible}
      onCollapse={onCollapse}
      className="navigation"
      width={256}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: isMobile ? 'absolute' : 'relative',
        bottom: '20px',
        ...(!isMobile && {
          left: '20px',
          top: '20px',
        }),
      }}
      theme={'light'}
    >
      <div
        className="logo"
        onClick={() => navigate('/')}
        style={{ cursor: 'pointer' }}
      >
        <img src={logoIcon} alt="Logo" style={{ marginLeft: '-5px', height: '40px' }} />

        {!showLogoApp && (
          <img
            src={logoText}
            alt="Logo"
            style={{ marginTop: '3px', marginLeft: '10px', height: '38px' }}
          />
        )}
      </div>
      <Menu
        items={items}
        mode="inline"
        theme={'light'}
        selectedKeys={[currentPath]}
        style={{ width: 256 }}
      />
    </Sider>
  );
}

function MobileSidebar() {
  const [visible, setVisible] = useState(false);
  const showDrawer = () => setVisible(true);
  const onClose = () => setVisible(false);

  return (
    <>
      <Button
        type="text"
        size="large"
        onClick={showDrawer}
        className="mobile-sidebar-btn"
        style={{ marginLeft: 25 }}
      >
        <MenuOutlined style={{ fontSize: 18 }} />
      </Button>
      <Drawer
        width={250}
        placement={'left'}
        closable={false}
        onClose={onClose}
        open={visible}
      >
        <Sidebar collapsible={false} isMobile={true} />
      </Drawer>
    </>
  );
}
