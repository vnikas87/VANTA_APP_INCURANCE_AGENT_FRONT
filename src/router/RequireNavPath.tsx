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
      await Swal.fire({
        icon: 'warning',
        title: tStatic('route.no_access'),
        text: tStatic('route.no_permission'),
        timer: 2000,
        showConfirmButton: false,
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
