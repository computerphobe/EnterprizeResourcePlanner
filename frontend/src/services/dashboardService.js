import { request } from '@/request';

// Hospital Dashboard Service
export const getHospitalDashboardData = async () => {
  try {
    const token = localStorage.getItem('authToken');
    
    const [ordersRes, invoicesRes, returnsRes] = await Promise.all([
      fetch(`${import.meta.env.VITE_BACKEND_SERVER}api/hospital/orders`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }),
      fetch(`${import.meta.env.VITE_BACKEND_SERVER}api/hospital/sales-bills`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }),
      fetch(`${import.meta.env.VITE_BACKEND_SERVER}api/returns/list`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
    ]);

    const [ordersData, invoicesData, returnsData] = await Promise.all([
      ordersRes.json(),
      invoicesRes.json(),
      returnsRes.json()
    ]);

    // Process orders data
    const orders = ordersData.success ? (ordersData.result || []) : [];
    const completedOrders = orders.filter(order => order.status === 'completed' || order.status === 'delivered');
    const pendingOrders = orders.filter(order => ['pending', 'processing', 'picked_up'].includes(order.status));
    const totalOrders = orders.length;

    // Calculate order amounts
    const completedAmount = completedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const pendingAmount = pendingOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalOrderValue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Process invoices data
    const invoices = invoicesData.success ? (invoicesData.result || []) : [];
    const paidInvoices = invoices.filter(invoice => invoice.status === 'paid');
    const unpaidInvoices = invoices.filter(invoice => invoice.status === 'unpaid' || invoice.status === 'pending');
    const totalInvoices = invoices.length;

    // Calculate invoice amounts
    const paidAmount = paidInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
    const unpaidAmount = unpaidInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
    const totalInvoiceValue = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);

    // Process returns data
    const returns = returnsData.success ? (returnsData.result || []) : [];
    const totalReturns = returns.length;
    const returnValue = returns.reduce((sum, returnItem) => {
      return sum + ((returnItem.returnedQuantity || 0) * (returnItem.unitPrice || 0));
    }, 0);

    return {
      success: true,
      data: {
        orders: {
          total: totalOrders,
          completed: completedOrders.length,
          pending: pendingOrders.length,
          completedAmount,
          pendingAmount,
          totalValue: totalOrderValue
        },
        invoices: {
          total: totalInvoices,
          paid: paidInvoices.length,
          unpaid: unpaidInvoices.length,
          paidAmount,
          unpaidAmount,
          totalValue: totalInvoiceValue
        },
        returns: {
          total: totalReturns,
          value: returnValue
        },
        summary: {
          totalRevenue: paidAmount,
          pendingRevenue: unpaidAmount,
          totalOrderValue,
          averageOrderValue: totalOrders > 0 ? totalOrderValue / totalOrders : 0
        }
      }
    };

  } catch (error) {
    console.error('Error fetching hospital dashboard data:', error);
    return {
      success: false,
      error: error.message,
      data: {
        orders: { total: 0, completed: 0, pending: 0, completedAmount: 0, pendingAmount: 0, totalValue: 0 },
        invoices: { total: 0, paid: 0, unpaid: 0, paidAmount: 0, unpaidAmount: 0, totalValue: 0 },
        returns: { total: 0, value: 0 },
        summary: { totalRevenue: 0, pendingRevenue: 0, totalOrderValue: 0, averageOrderValue: 0 }
      }
    };
  }
};

// Doctor Dashboard Service
export const getDoctorDashboardData = async () => {
  try {
    const token = localStorage.getItem('authToken');
    
    const [ordersRes, invoicesRes, returnsRes] = await Promise.all([
      fetch(`${import.meta.env.VITE_BACKEND_SERVER}api/doctor/orders`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }),
      fetch(`${import.meta.env.VITE_BACKEND_SERVER}api/doctor/sales-bills`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }),
      fetch(`${import.meta.env.VITE_BACKEND_SERVER}api/returns/list`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
    ]);

    const [ordersData, invoicesData, returnsData] = await Promise.all([
      ordersRes.json(),
      invoicesRes.json(),
      returnsRes.json()
    ]);

    // Process orders data (same logic as hospital)
    const orders = ordersData.success ? (ordersData.result || []) : [];
    const completedOrders = orders.filter(order => order.status === 'completed' || order.status === 'delivered');
    const pendingOrders = orders.filter(order => ['pending', 'processing', 'picked_up'].includes(order.status));
    const totalOrders = orders.length;

    // Calculate order amounts
    const completedAmount = completedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const pendingAmount = pendingOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalOrderValue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Process invoices data
    const invoices = invoicesData.success ? (invoicesData.result || []) : [];
    const paidInvoices = invoices.filter(invoice => invoice.status === 'paid');
    const unpaidInvoices = invoices.filter(invoice => invoice.status === 'unpaid' || invoice.status === 'pending');
    const totalInvoices = invoices.length;

    // Calculate invoice amounts
    const paidAmount = paidInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
    const unpaidAmount = unpaidInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
    const totalInvoiceValue = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);

    // Process returns data (filter by doctor if possible)
    const returns = returnsData.success ? (returnsData.result || []) : [];
    const totalReturns = returns.length;
    const returnValue = returns.reduce((sum, returnItem) => {
      return sum + ((returnItem.returnedQuantity || 0) * (returnItem.unitPrice || 0));
    }, 0);

    return {
      success: true,
      data: {
        orders: {
          total: totalOrders,
          completed: completedOrders.length,
          pending: pendingOrders.length,
          completedAmount,
          pendingAmount,
          totalValue: totalOrderValue
        },
        invoices: {
          total: totalInvoices,
          paid: paidInvoices.length,
          unpaid: unpaidInvoices.length,
          paidAmount,
          unpaidAmount,
          totalValue: totalInvoiceValue
        },
        returns: {
          total: totalReturns,
          value: returnValue
        },
        summary: {
          totalRevenue: paidAmount,
          pendingRevenue: unpaidAmount,
          totalOrderValue,
          averageOrderValue: totalOrders > 0 ? totalOrderValue / totalOrders : 0
        }
      }
    };

  } catch (error) {
    console.error('Error fetching doctor dashboard data:', error);
    return {
      success: false,
      error: error.message,
      data: {
        orders: { total: 0, completed: 0, pending: 0, completedAmount: 0, pendingAmount: 0, totalValue: 0 },
        invoices: { total: 0, paid: 0, unpaid: 0, paidAmount: 0, unpaidAmount: 0, totalValue: 0 },
        returns: { total: 0, value: 0 },
        summary: { totalRevenue: 0, pendingRevenue: 0, totalOrderValue: 0, averageOrderValue: 0 }
      }
    };
  }
};
