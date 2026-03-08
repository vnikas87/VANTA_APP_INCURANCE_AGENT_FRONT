import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppFooter from '../components/layout/AppFooter';
import AppHeader from '../components/layout/AppHeader';
import AppSidebar from '../components/layout/AppSidebar';
import { useAppSelector } from '../store/hooks';

function DashboardLayout() {
  const currentUser = useAppSelector((state) => state.users.currentUser);
  const notifications = useAppSelector((state) => state.users.notifications);
  const username = currentUser?.name ?? 'user';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 992) {
        setMobileOpen(false);
      }
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleToggleSidebar = () => {
    if (window.innerWidth <= 992) {
      setMobileOpen((prev) => !prev);
      return;
    }

    setSidebarCollapsed((prev) => !prev);
  };

  const rootClass = `layout-root${sidebarCollapsed ? ' sidebar-collapsed' : ''}`;

  return (
    <div className={rootClass}>
      {mobileOpen ? <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} /> : null}

      <AppSidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="layout-content-wrap">
        <AppHeader
          username={username}
          currentUser={currentUser}
          notifications={notifications}
          onToggleSidebar={handleToggleSidebar}
        />
        <main className="layout-content p-3 p-md-4">
          <Outlet />
        </main>
        <AppFooter />
      </div>
    </div>
  );
}

export default DashboardLayout;
