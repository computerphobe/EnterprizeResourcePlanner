import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';
import DashboardModule from '@/modules/DashboardModule';
import DoctorDashboard from '@/modules/DashboardModule/DoctorDashboard';
// Import role-specific dashboard components
import HospitalDashboard from '@/pages/Dashboards/hospital';
import DistributorDashboard from '@/pages/Dashboards/distributor';
import DelivererDashboard from '@/pages/Dashboards/deliverer';

export default function Dashboard() {
  const { current: currentUser } = useSelector(selectAuth);
  const userRole = currentUser?.role || 'guest';
  
  console.log('Dashboard component rendering for role:', userRole);
  
  // Render the appropriate dashboard based on user role
  switch(userRole) {
    case 'doctor':
      return <DoctorDashboard />;
    case 'admin':
    case 'owner':
      // Use the standard DashboardModule for admin/owner users
      return <DashboardModule />;
    case 'hospital':
      return <HospitalDashboard />;
    case 'distributor':
      return <DistributorDashboard />;
    case 'deliverer':
      return <DelivererDashboard />;
    default:
      // For any other role or if role is undefined, show the default dashboard
      return <DashboardModule />;
  }
}
