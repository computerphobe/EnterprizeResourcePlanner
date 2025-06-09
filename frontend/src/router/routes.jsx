import { lazy } from 'react';
import ProtectedRoute from '@/components/Protectedroutes';
import PendingOrders from '@/pages/pendingOrders';

const Ledger = lazy(() => import('@/pages/Ledger'));
const Logout = lazy(() => import('@/pages/Logout.jsx'));
const NotFound = lazy(() => import('@/pages/NotFound.jsx'));
const RegisterUser = lazy(() => import('@/pages/RegisterUsers.jsx'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Customer = lazy(() => import('@/pages/Customer'));
const OrderList = lazy(() => import('@/pages/OrderArray'));
const Invoice = lazy(() => import('@/pages/Invoice'));
const InvoiceCreate = lazy(() => import('@/pages/Invoice/InvoiceCreate'));
const InvoiceRead = lazy(() => import('@/pages/Invoice/InvoiceRead'));
const InvoiceUpdate = lazy(() => import('@/pages/Invoice/InvoiceUpdate'));
const InvoiceRecordPayment = lazy(() => import('@/pages/Invoice/InvoiceRecordPayment'));
const Quote = lazy(() => import('@/pages/Quote/index'));
const QuoteCreate = lazy(() => import('@/pages/Quote/QuoteCreate'));
const QuoteRead = lazy(() => import('@/pages/Quote/QuoteRead'));
const QuoteUpdate = lazy(() => import('@/pages/Quote/QuoteUpdate'));
const Payment = lazy(() => import('@/pages/Payment/index'));
const PaymentRead = lazy(() => import('@/pages/Payment/PaymentRead'));
const PaymentUpdate = lazy(() => import('@/pages/Payment/PaymentUpdate'));
const Settings = lazy(() => import('@/pages/Settings/Settings'));
const PaymentMode = lazy(() => import('@/pages/PaymentMode'));
const Taxes = lazy(() => import('@/pages/Taxes'));
const Returns = lazy(() => import('@/pages/returns'));
const Profile = lazy(() => import('@/pages/Profile'));
const Inventory = lazy(() => import('@/pages/inventoryTable'));
const About = lazy(() => import('@/pages/About'));
const PurchasePage = lazy(() => import('@/pages/purchase'));
const SupplierPage = lazy(() => import('@/pages/supplier'));

const DoctorDashboard = lazy(() => import('@/pages/Dashboards/doctor'));
const DistributorDashboard = lazy(() => import('@/pages/Dashboards/distributor'));
const HospitalDashboard = lazy(() => import('@/pages/Dashboards/hospital'));
const DelivererDashboard = lazy(() => import('@/pages/Dashboards/deliverer'));

const CurrentOrders = lazy(() => import('@/pages/delivery/CurrentOrders'));
const PickupConfirmation = lazy(() => import('@/pages/delivery/PickupConfirmation'));
const DeliveryConfirmation = lazy(() => import('@/pages/delivery/DeliveryConfirmation'));
const History = lazy(() => import('@/pages/delivery/History'));
const ExpensesPage = lazy(() => import('@/pages/Expenses'));

const FinancialReports = lazy(() => import('@/pages/FinancialReports'));

export const routes = [
  { path: '/logout', element: <Logout /> },
  { path: '/about', element: <About /> },
  { path: '/customer', element: <Customer /> },
  { path: '/invoice', element: <Invoice /> },
  { path: '/invoice/create', element: <InvoiceCreate /> },
  { path: '/invoice/read/:id', element: <InvoiceRead /> },
  { path: '/invoice/update/:id', element: <InvoiceUpdate /> },
  { path: '/invoice/pay/:id', element: <InvoiceRecordPayment /> },
  { path: '/quote', element: <Quote /> },
  { path: '/quote/create', element: <QuoteCreate /> },
  { path: '/quote/read/:id', element: <QuoteRead /> },
  { path: '/quote/update/:id', element: <QuoteUpdate /> },
  { path: '/payment', element: <Payment /> },
  { path: '/payment/read/:id', element: <PaymentRead /> },
  { path: '/payment/update/:id', element: <PaymentUpdate /> },
  { path: '/settings', element: <Settings /> },
  { path: '/settings/edit/:settingsKey', element: <Settings /> },
  { path: '/payment/mode', element: <PaymentMode /> },
  { path: '/taxes', element: <Taxes /> },
  { path: '/profile', element: <Profile /> },
  { path: '/inventory', element: <Inventory /> },
  { path: '/returns', element: <Returns /> },
  { path: '/purchase', element: <PurchasePage /> },
  { path: '/supplier', element: <SupplierPage /> },
  { path: '/register', element: <RegisterUser /> },
  { path: '/order', element: <OrderList /> },
  { path: '/', element: <Dashboard /> },

  {
    path: '/doctor',
    element: (
      <ProtectedRoute allowedRoles={['doctor']}>
        <DoctorDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/distributor',
    element: (
      <ProtectedRoute allowedRoles={['distributor']}>
        <DistributorDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/hospital',
    element: (
      <ProtectedRoute allowedRoles={['hospital']}>
        <HospitalDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/deliverer',
    element: (
      <ProtectedRoute allowedRoles={['deliverer']}>
        <DelivererDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/current-orders',
    element: (
      <ProtectedRoute allowedRoles={['deliverer']}>
        <CurrentOrders />
      </ProtectedRoute>
    ),
  },
  {
    path: '/pickup',
    element: (
      <ProtectedRoute allowedRoles={['deliverer']}>
        <PickupConfirmation />
      </ProtectedRoute>
    ),
  },
  {
    path: '/confirmation',
    element: (
      <ProtectedRoute allowedRoles={['deliverer']}>
        <DeliveryConfirmation />
      </ProtectedRoute>
    ),
  },
  {
    path: '/history',
    element: (
      <ProtectedRoute allowedRoles={['deliverer']}>
        <History />
      </ProtectedRoute>
    ),
  },
  {
    path: '/pending',
    element: (
      <ProtectedRoute allowedRoles={['accountant']}>
        <PendingOrders />
      </ProtectedRoute>
    ),
  },
  {
    path: '/ledger',
    element: (
      <ProtectedRoute allowedRoles={['accountant', 'admin', 'owner']}>
        <Ledger />
      </ProtectedRoute>
    ),
  },
  {
    path: '/expenses',
    element: (
      <ProtectedRoute allowedRoles={['accountant', 'admin', 'owner']}>
        <ExpensesPage />
      </ProtectedRoute>
    ),
  },
  // ✅ Updated route path for financial reports
  {
    path: '/reports',
    element: (
      <ProtectedRoute allowedRoles={['accountant', 'admin', 'owner']}>
        <FinancialReports />
      </ProtectedRoute>
    ),
  },
  { path: '*', element: <NotFound /> },
];
