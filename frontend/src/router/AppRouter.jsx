import { useEffect } from 'react';
import { useLocation, useRoutes } from 'react-router-dom';
import { useAppContext } from '@/context/appContext';

import { routes } from './routes';

export default function AppRouter() {
  const location = useLocation();
  const { state: stateApp, appContextAction } = useAppContext();
  const { app } = appContextAction;

  // Map path prefixes to app names
  function getAppNameByPath(path) {
    if (path.startsWith('/deliverer') || path.startsWith('/deliver')) return 'delivery';
    // Add other app prefix checks here if needed
    return 'default'; // fallback
  }

  useEffect(() => {
    if (!app) return;

    if (location.pathname === '/') {
      console.log('Default app opened');
      app.default();
    } else {
      const appName = getAppNameByPath(location.pathname);
      app.open(appName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (!app) return <div>Loading application context...</div>;

  const element = useRoutes(routes);
  return element;
}
