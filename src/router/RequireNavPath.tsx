import { useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import type { ReactElement } from 'react';
import { logoutAllTabs } from '../auth/keycloak';
import { tStatic } from '../i18n';
import { useAppSelector } from '../store/hooks';

type RequireNavPathProps = {
  children: ReactElement;
  requiredPath: string;
};

function hasPathAccess(allowedPaths: string[], requiredPath: string): boolean {
  const normalizedRequired = requiredPath.trim();
  if (normalizedRequired === '/') return true;
  return allowedPaths.some((path) => {
    const normalized = path.trim();
    if (normalized === normalizedRequired) return true;
    return normalizedRequired.startsWith(`${normalized}/`);
  });
}

function RequireNavPath({ children, requiredPath }: RequireNavPathProps) {
  const menu = useAppSelector((state) => state.navigation.menu);
  const menuLoaded = useAppSelector((state) => state.navigation.menuLoaded);
  const loading = useAppSelector((state) => state.navigation.loading);
  const handledRef = useRef(false);

  const allowedPaths = menu.flatMap((group) =>
    group.folders.flatMap((folder) => folder.subFolders.map((subFolder) => subFolder.path))
  );
  const hasAccess = hasPathAccess(allowedPaths, requiredPath);

  useEffect(() => {
    if (!menuLoaded || loading) return;
    if (hasAccess) {
      handledRef.current = false;
      return;
    }
    if (handledRef.current) return;

    handledRef.current = true;
    void (async () => {
      let timerInterval: ReturnType<typeof setInterval> | undefined;
      await Swal.fire({
        icon: 'warning',
        title: tStatic('route.no_access'),
        html: `<div>${tStatic('route.no_permission')}</div><div style="margin-top:8px;font-size:12px;opacity:0.9;">${tStatic('api.logout_in')} <strong id="nav-logout-seconds">30</strong>s</div><div style="margin-top:6px;font-size:12px;opacity:0.9;">${tStatic('api.click_ok_logout')}</div>`,
        showConfirmButton: true,
        confirmButtonText: 'OK',
        timer: 30000,
        timerProgressBar: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          const secondsNode = Swal.getHtmlContainer()?.querySelector('#nav-logout-seconds');
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
  }, [hasAccess, loading, menuLoaded]);

  if (!menuLoaded || loading) return null;

  if (!hasAccess) {
    return null;
  }

  return children;
}

export default RequireNavPath;
