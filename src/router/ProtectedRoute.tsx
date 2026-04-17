import { useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { Navigate, Outlet } from 'react-router-dom';
import { hasAnyRole } from '../auth/keycloak';
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

    void Swal.fire({
      icon: 'warning',
      title: tStatic('route.no_access'),
      text: tStatic('route.no_permission'),
      timer: 2000,
      showConfirmButton: false,
    });
  }, [allowedRoles]);

  if (!hasAnyRole(allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
