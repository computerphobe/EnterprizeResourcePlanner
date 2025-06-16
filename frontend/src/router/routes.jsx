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
const Profile = lazy(() => import('@/pages/Profile'));
const Inventory = lazy(() => import('@/pages/inventoryTable'));
const Returns = lazy(() => import('@/pages/returns'));
const PurchasePage = lazy(() => import('@/pages/purchase'));
const SupplierPage = lazy(() => import('@/pages/supplier'));

// Invoice
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
const About = lazy(() => import('@/pages/About'));

// Dashboards
const DoctorDashboard = lazy(() => import('@/pages/Dashboards/doctor'));
const DistributorDashboard = lazy(() => import('@/pages/Dashboards/distributor'));
const HospitalDashboard = lazy(() => import('@/pages/Dashboards/hospital'));
const DelivererDashboard = lazy(() => import('@/pages/Dashboards/deliverer'));

// Delivery
const CurrentOrders = lazy(() => import('@/pages/delivery/CurrentOrders'));
const PickupConfirmation = lazy(() => import('@/pages/delivery/PickupConfirmation'));
const DeliveryConfirmation = lazy(() => import('@/pages/delivery/DeliveryConfirmation'));
const History = lazy(() => import('@/pages/delivery/History'));
const SystemHistory = lazy(() => import('@/pages/History'));
const ExpensesPage = lazy(() => import('@/pages/Expenses'));

const FinancialReports = lazy(() => import('@/pages/FinancialReports'));

const HospitalOrders = lazy(() => import('@/pages/Hospital/orders'));
const HospitalDelivery = lazy(() => import('@/pages/Hospital/delivery'));
const HospitalHistory = lazy(() => import('@/pages/Hospital/history'));
const HospitalSalesBill = lazy(() => import('@/pages/Hospital/salesbill'));
const HospitalReturns = lazy(() => import('@/pages/Hospital/returns'));

const DoctorOrders = lazy(() => import('@/pages/Doctor/orders'));
const DoctorDelivery = lazy(() => import('@/pages/Doctor/delivery'));
const DoctorHistory = lazy(() => import('@/pages/Doctor/history'));
const DoctorSalesBill = lazy(() => import('@/pages/Doctor/salesbill'));
const DoctorReturns = lazy(() => import('@/pages/Doctor/returns'));

export const routes = [
  { path: '/', element: <Dashboard /> },
  { path: '/logout', element: <Logout /> },
  { path: '/about', element: <About /> },
  { path: '/customer', element: <Customer /> },
  { path: '/order', element: <OrderList /> },
  { path: '/register', element: <RegisterUser /> },

  // Inventory & Purchase
  { path: '/inventory', element: <Inventory /> },
  { path: '/returns', element: <Returns /> },
  { path: '/purchase', element: <PurchasePage /> },
  { path: '/supplier', element: <SupplierPage /> },

  // Profile
  { path: '/profile', element: <Profile /> },

  // Invoice
  { path: '/invoice', element: <Invoice /> },
  { path: '/invoice/create', element: <InvoiceCreate /> },
  { path: '/invoice/read/:id', element: <InvoiceRead /> },
  { path: '/invoice/update/:id', element: <InvoiceUpdate /> },
  { path: '/invoice/pay/:id', element: <InvoiceRecordPayment /> },

  // Quote
  { path: '/quote', element: <Quote /> },
  { path: '/quote/create', element: <QuoteCreate /> },
  { path: '/quote/read/:id', element: <QuoteRead /> },
  { path: '/quote/update/:id', element: <QuoteUpdate /> },

  // Payment
  { path: '/payment', element: <Payment /> },
  { path: '/payment/read/:id', element: <PaymentRead /> },
  { path: '/payment/update/:id', element: <PaymentUpdate /> },
  { path: '/payment/mode', element: <PaymentMode /> },

  // Settings
  { path: '/settings', element: <Settings /> },
  { path: '/settings/edit/:settingsKey', element: <Settings /> },
  { path: '/taxes', element: <Taxes /> },

  // Role-based Dashboards
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
    path: '/hospital/orders',
    element: (
      <ProtectedRoute allowedRoles={['hospital']}>
        <HospitalOrders />
      </ProtectedRoute>
    ),
  },
  {
    path: '/hospital/delivery',
    element: (
      <ProtectedRoute allowedRoles={['hospital']}>
        <HospitalDelivery />
      </ProtectedRoute>
    ),
  },
  {
    path: '/hospital/history',
    element: (
      <ProtectedRoute allowedRoles={['hospital']}>
        <HospitalHistory />
      </ProtectedRoute>
    ),
  },
  {
    path: '/hospital/salesbill',
    element: (
      <ProtectedRoute allowedRoles={['hospital']}>
        <HospitalSalesBill />
      </ProtectedRoute>
    ),
  },
  {
    path: '/hospital/returns',
    element: (
      <ProtectedRoute allowedRoles={['hospital']}>
        <HospitalReturns />
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

  // Deliverer
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

  // Accountant
  {
    path: '/pending',
    element: (
      <ProtectedRoute allowedRoles={['accountant']}>
        <PendingOrders />
      </ProtectedRoute>
    )
  },
  {
    path: '/doctor',
    element: (
      <ProtectedRoute allowedRoles={['doctor']}>
        <DoctorDashboard />
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
    path: '/doctor/orders',
    element: (
      <ProtectedRoute allowedRoles={['doctor']}>
        <DoctorOrders />
      </ProtectedRoute>
    ),
  },
  {
    path: '/expenses',
    element: (
      <ProtectedRoute allowedRoles={['accountant', 'admin', 'owner']}>
        <ExpensesPage />
      </ProtectedRoute>
    ),  },
  // ✅ Updated route path for financial reports
  {
    path: '/reports',
    element: (
      <ProtectedRoute allowedRoles={['accountant', 'admin', 'owner']}>
        <FinancialReports />
      </ProtectedRoute>
    )
  },
  {
    path: '/doctor/delivery',
    element: (
      <ProtectedRoute allowedRoles={['doctor']}>
        <DoctorDelivery />
      </ProtectedRoute>
    ),
  },
  {
    path: '/system-history',
    element: (
      <ProtectedRoute allowedRoles={['accountant', 'admin', 'owner']}>
        <SystemHistory />
      </ProtectedRoute>
    ),
  },
  {
    path: '/doctor/history',
    element: (
      <ProtectedRoute allowedRoles={['doctor']}>
        <DoctorHistory />
      </ProtectedRoute>
    ),
  },
  {
    path: '/doctor/salesbill',
    element: (
      <ProtectedRoute allowedRoles={['doctor']}>
        <DoctorSalesBill />
      </ProtectedRoute>
    ),
  },
  {
    path: '/doctor/returns',
    element: (
      <ProtectedRoute allowedRoles={['doctor']}>
        <DoctorReturns />
      </ProtectedRoute>
    ),
  },

  { path: '*', element: <NotFound /> },
];
