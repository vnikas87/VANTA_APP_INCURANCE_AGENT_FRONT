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
      let timerInterval: ReturnType<typeof setInterval> | undefined;
      await Swal.fire({
        icon: 'warning',
        title: tStatic('route.no_access'),
        html: `<div>${tStatic('route.no_permission')}</div><div style="margin-top:8px;font-size:12px;opacity:0.9;">${tStatic('api.logout_in')} <strong id="route-logout-seconds">30</strong>s</div><div style="margin-top:6px;font-size:12px;opacity:0.9;">${tStatic('api.click_ok_logout')}</div>`,
        showConfirmButton: true,
        confirmButtonText: 'OK',
        timer: 30000,
        timerProgressBar: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          const secondsNode = Swal.getHtmlContainer()?.querySelector('#route-logout-seconds');
          timerInterval = setInterval(() => {
            const leftMs = Swal.getTimerLeft() ?? 0;
            const leftSeconds = Math.max(0, Math.ceil(leftMs / 1000));
            if (secondsNode) {
              secondsNode.textContent = String(leftSeconds);
            }
          }, 250);
        },
        willClose: () => {
          if (timerInterval) clearInterval(timerInterval);
        },
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
