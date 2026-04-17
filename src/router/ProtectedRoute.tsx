import { useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { Outlet } from 'react-router-dom';
import { hasAnyRole, logoutAllTabs } from '../auth/keycloak';
import { tStatic } from '../i18n';

type ProtectedRouteProps = {
  allowedRoles?: string[];
};

function ProtectedRoute({ allowedRoles = [] }: ProtectedRouteProps) {
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    if (hasAnyRole(allowedRoles)) return;
    handledRef.current = true;

    void (async () => {
      await Swal.fire({
        icon: 'warning',
        title: tStatic('route.no_access'),
        text: tStatic('route.no_permission'),
        timer: 2000,
        showConfirmButton: false,
      });
      await logoutAllTabs();
    })();
  }, [allowedRoles]);

  if (!hasAnyRole(allowedRoles)) {
    return null;
  }

  return <Outlet />;
}

export default ProtectedRoute;
