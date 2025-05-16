import { useEffect } from 'react';
import { useLocation, useRoutes } from 'react-router-dom';
import { useAppContext } from '@/context/appContext';

import { routes } from './routes';  // <-- fixed to named import

export default function AppRouter() {
  const location = useLocation();
  const { state: stateApp, appContextAction } = useAppContext();
  const { app } = appContextAction;

  // Flatten all routes into one array for useRoutes
  const routesList = routes; // routes is already an array now

  // Get app name by matching path prefix or exact path
  function getAppNameByPath(path) {
    if (path.startsWith('/delivery')) return 'delivery';

    // Check if path exactly matches any route path
    for (const route of routesList) {
      if (route.path === path) {
        // fallback to 'default' if no special group is found
        return 'default';
      }
    }
    return 'default';
  }

  useEffect(() => {
    if (!app) return;

    if (location.pathname === '/') {
      app.default();
    } else {
      const appName = getAppNameByPath(location.pathname);
      app.open(appName);
    }
  }, [location.pathname, app]);

  if (!app) return <div>Loading application context...</div>;

  const element = useRoutes(routesList);
  return element;
}
