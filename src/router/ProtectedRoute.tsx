import { useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { Navigate, Outlet } from 'react-router-dom';
import { hasAnyRole } from '../auth/keycloak';

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
      title: 'No Access',
      text: 'You do not have permission for this page.',
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
