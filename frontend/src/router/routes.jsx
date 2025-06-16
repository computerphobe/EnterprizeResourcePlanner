import { lazy } from 'react';
import ProtectedRoute from '@/components/Protectedroutes';

// Lazy Imports
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const About = lazy(() => import('@/pages/About'));
const Logout = lazy(() => import('@/pages/Logout.jsx'));
const NotFound = lazy(() => import('@/pages/NotFound.jsx'));
const RegisterUser = lazy(() => import('@/pages/RegisterUsers.jsx'));
const Customer = lazy(() => import('@/pages/Customer'));
const OrderList = lazy(() => import('@/pages/OrderArray'));
const Profile = lazy(() => import('@/pages/Profile'));
const Inventory = lazy(() => import('@/pages/inventoryTable'));
const Returns = lazy(() => import('@/pages/returns'));
const PurchasePage = lazy(() => import('@/pages/purchase'));
const SupplierPage = lazy(() => import('@/pages/supplier'));
const ExpensesPage = lazy(() => import('@/pages/Expenses'));

// Invoice
const Invoice = lazy(() => import('@/pages/Invoice'));
const InvoiceCreate = lazy(() => import('@/pages/Invoice/InvoiceCreate'));
const InvoiceRead = lazy(() => import('@/pages/Invoice/InvoiceRead'));
const InvoiceUpdate = lazy(() => import('@/pages/Invoice/InvoiceUpdate'));
const InvoiceRecordPayment = lazy(() => import('@/pages/Invoice/InvoiceRecordPayment'));

// Quote
const Quote = lazy(() => import('@/pages/Quote/index'));
const QuoteCreate = lazy(() => import('@/pages/Quote/QuoteCreate'));
const QuoteRead = lazy(() => import('@/pages/Quote/QuoteRead'));
const QuoteUpdate = lazy(() => import('@/pages/Quote/QuoteUpdate'));

// Payment
const Payment = lazy(() => import('@/pages/Payment/index'));
const PaymentRead = lazy(() => import('@/pages/Payment/PaymentRead'));
const PaymentUpdate = lazy(() => import('@/pages/Payment/PaymentUpdate'));
const PaymentMode = lazy(() => import('@/pages/PaymentMode'));

// Settings
const Settings = lazy(() => import('@/pages/Settings/Settings'));
const Taxes = lazy(() => import('@/pages/Taxes'));

// Role-Based Dashboards
const DoctorDashboard = lazy(() => import('@/pages/Dashboards/doctor'));
const DistributorDashboard = lazy(() => import('@/pages/Dashboards/distributor'));
const HospitalDashboard = lazy(() => import('@/pages/Dashboards/hospital'));
const DelivererDashboard = lazy(() => import('@/pages/Dashboards/deliverer'));

// Deliverer Routes
const CurrentOrders = lazy(() => import('@/pages/delivery/CurrentOrders'));
const PickupConfirmation = lazy(() => import('@/pages/delivery/PickupConfirmation'));
const DeliveryConfirmation = lazy(() => import('@/pages/delivery/DeliveryConfirmation'));
const History = lazy(() => import('@/pages/delivery/History'));

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
  // Public Routes
  { path: '/', element: <Dashboard /> },
  { path: '/about', element: <About /> },
  { path: '/logout', element: <Logout /> },
  { path: '/register', element: <RegisterUser /> },

  // General Pages
  { path: '/customer', element: <Customer /> },
  { path: '/order', element: <OrderList /> },
  { path: '/expenses', element: <ExpensesPage /> },
  { path: '/profile', element: <Profile /> },
  { path: '/inventory', element: <Inventory /> },
  { path: '/returns', element: <Returns /> },
  { path: '/purchase', element: <PurchasePage /> },
  { path: '/supplier', element: <SupplierPage /> },

  // Invoice Routes
  { path: '/invoice', element: <Invoice /> },
  { path: '/invoice/create', element: <InvoiceCreate /> },
  { path: '/invoice/read/:id', element: <InvoiceRead /> },
  { path: '/invoice/update/:id', element: <InvoiceUpdate /> },
  { path: '/invoice/pay/:id', element: <InvoiceRecordPayment /> },

  // Quote Routes
  { path: '/quote', element: <Quote /> },
  { path: '/quote/create', element: <QuoteCreate /> },
  { path: '/quote/read/:id', element: <QuoteRead /> },
  { path: '/quote/update/:id', element: <QuoteUpdate /> },

  // Payment Routes
  { path: '/payment', element: <Payment /> },
  { path: '/payment/read/:id', element: <PaymentRead /> },
  { path: '/payment/update/:id', element: <PaymentUpdate /> },
  { path: '/payment/mode', element: <PaymentMode /> },

  // Settings
  { path: '/settings', element: <Settings /> },
  { path: '/settings/edit/:settingsKey', element: <Settings /> },
  { path: '/taxes', element: <Taxes /> },

  // Protected Role-Based Dashboards
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

  // Deliverer-specific Pages
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
    path: '/doctor',
    element: (
      <ProtectedRoute allowedRoles={['doctor']}>
        <DoctorDashboard />
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
    path: '/doctor/delivery',
    element: (
      <ProtectedRoute allowedRoles={['doctor']}>
        <DoctorDelivery />
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
