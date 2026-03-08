import { useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
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
    void Swal.fire({
      icon: 'warning',
      title: 'No Access',
      text: 'You do not have permission for this page.',
      timer: 2000,
      showConfirmButton: false,
    });
  }, [hasAccess, loading, menuLoaded]);

  if (!menuLoaded || loading) return null;

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default RequireNavPath;
