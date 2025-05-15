import { useEffect } from 'react';
import { useLocation, useRoutes } from 'react-router-dom';
import { useAppContext } from '@/context/appContext';

import routes from './routes';

export default function AppRouter() {
  const location = useLocation();
  const { state: stateApp, appContextAction } = useAppContext();
  const { app } = appContextAction;

  const routesList = [];

  Object.entries(routes).forEach(([key, value]) => {
    routesList.push(...value);
  });

  function getAppNameByPath(path) {
    for (let key in routes) {
      for (let i = 0; i < routes[key].length; i++) {
        if (routes[key][i].path === path) {
          return key;
        }
      }
    }

    // Handle delivery routes
    if (path.startsWith('/delivery')) return 'delivery';

    return 'default';
  }

  useEffect(() => {
    if (location.pathname === '/') {
      app.default();
    } else {
      const path = getAppNameByPath(location.pathname);
      app.open(path);
    }
  }, [location.pathname]);

  const element = useRoutes(routesList);

  return element;
}
