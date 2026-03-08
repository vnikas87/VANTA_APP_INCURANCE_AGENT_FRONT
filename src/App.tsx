import { useEffect, useRef } from 'react';
import AppRouter from './router/AppRouter';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { fetchNavigationMenu } from './store/slices/navigationSlice';
import { fetchCurrentUser } from './store/slices/usersSlice';

function App() {
  const dispatch = useAppDispatch();
  const menu = useAppSelector((state) => state.navigation.menu);
  const loading = useAppSelector((state) => state.navigation.loading);
  const menuLoaded = useAppSelector((state) => state.navigation.menuLoaded);
  const menuError = useAppSelector((state) => state.navigation.error);
  const accessHandledRef = useRef(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await dispatch(fetchCurrentUser()).unwrap();
        console.log('[APP] User sync with backend completed');
      } catch (error) {
        console.error('[APP] Failed to sync user with backend', error);
        return;
      }

      try {
        await dispatch(fetchNavigationMenu()).unwrap();
      } catch (error) {
        console.error('[APP] Failed to load navigation menu', error);
      }
    };

    void bootstrap();
  }, [dispatch]);

  useEffect(() => {
    if (loading || !menuLoaded || accessHandledRef.current) return;
    if (menuError) return;
    if (menu.length > 0) return;
    accessHandledRef.current = true;
  }, [menu, loading, menuLoaded, menuError]);

  return <AppRouter />;
}

export default App;
