import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { useAppSelector } from '../../store/hooks';

type AppSidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

function getGroupIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('dash')) return 'ri-bar-chart-box-line';
  if (n.includes('setting')) return 'ri-settings-3-line';
  if (n.includes('manage')) return 'ri-layout-grid-line';
  return 'ri-folder-line';
}

function getFolderIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('access')) return 'ri-shield-keyhole-line';
  if (n.includes('user')) return 'ri-team-line';
  return 'ri-folder-2-line';
}

function getSubFolderIcon(path: string): string {
  const p = path.toLowerCase();
  if (p === '/' || p.includes('dashboard')) return 'ri-dashboard-2-line';
  if (p.includes('user')) return 'ri-user-3-line';
  if (p.includes('navigation')) return 'ri-compass-3-line';
  return 'ri-file-list-3-line';
}

function isPathMatch(pathname: string, navPath: string): boolean {
  const p = pathname.trim();
  const n = navPath.trim();
  if (n === '/') return p === '/';
  return p === n || p.startsWith(`${n}/`);
}

function buildActiveOpenKeys(pathname: string, menu: Array<any>): Record<string, boolean> {
  const next: Record<string, boolean> = {};
  for (const group of menu) {
    const groupKey = `group-${group.id}`;
    for (const folder of group.folders) {
      const folderKey = `folder-${folder.id}`;
      const hasActiveSub = folder.subFolders.some((sub: any) => isPathMatch(pathname, sub.path));
      if (hasActiveSub) {
        next[groupKey] = true;
        next[folderKey] = true;
        return next;
      }
    }
  }
  return next;
}

function AppSidebar({ collapsed, mobileOpen, onCloseMobile }: AppSidebarProps) {
  const { t } = useI18n();
  const menu = useAppSelector((state) => state.navigation.menu);
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({});
  const asideRef = useRef<HTMLElement | null>(null);
  const location = useLocation();

  const asideClassName = useMemo(() => {
    const classes = ['app-sidebar', 'p-3'];
    if (collapsed) classes.push('collapsed');
    if (mobileOpen) classes.push('mobile-open');
    return classes.join(' ');
  }, [collapsed, mobileOpen]);

  const toggleGroup = (groupId: number) => {
    const groupKey = `group-${groupId}`;
    setOpenKeys((prev) => {
      const currentlyOpen = Boolean(prev[groupKey]);
      if (currentlyOpen) return {};
      const next: Record<string, boolean> = { [groupKey]: true };
      return next;
    });
  };

  const toggleFolder = (groupId: number, folderId: number) => {
    const groupKey = `group-${groupId}`;
    const folderKey = `folder-${folderId}`;
    setOpenKeys((prev) => {
      const currentlyOpen = Boolean(prev[folderKey]);
      const next: Record<string, boolean> = { [groupKey]: true };
      if (!currentlyOpen) {
        next[folderKey] = true;
      }
      return next;
    });
  };

  const selectPath = (path: string) => {
    setOpenKeys(buildActiveOpenKeys(path, menu));
    onCloseMobile();
  };

  useEffect(() => {
    setOpenKeys(buildActiveOpenKeys(location.pathname, menu));
  }, [location.pathname, menu]);

  useLayoutEffect(() => {
    const aside = asideRef.current;
    if (!aside) return;
    const rafId = window.requestAnimationFrame(() => {
      const activeLink = aside.querySelector(
        '.menu-link.active, .menu-icon-only-link.active'
      ) as HTMLElement | null;
      if (!activeLink) return;

      const target = activeLink.offsetTop - aside.clientHeight / 2 + activeLink.clientHeight / 2;
      aside.scrollTo({
        top: Math.max(0, target),
        behavior: 'smooth',
      });
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [location.pathname, collapsed, mobileOpen, openKeys, menu.length]);

  if (collapsed && !mobileOpen) {
    return (
      <aside className={asideClassName} ref={asideRef}>
        <div className="menu-brand menu-brand-collapsed">
          <div className="menu-brand-mark">BG</div>
        </div>

        <div className="collapsed-icons-wrap">
          {menu.map((group) => {
            const firstSub = group.folders.flatMap((folder) => folder.subFolders)[0];
            const iconClass = getGroupIcon(group.name);
            const groupLabel = t(`nav.${group.name}`);

            return firstSub ? (
              <NavLink
                key={group.id}
                to={firstSub.path}
                className="menu-icon-only-link"
                title={groupLabel}
                onClick={() => selectPath(firstSub.path)}
              >
                <i className={iconClass} />
              </NavLink>
            ) : (
              <div key={group.id} className="menu-icon-only-link disabled" title={groupLabel}>
                <i className={iconClass} />
              </div>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside className={asideClassName} ref={asideRef}>
      <div className="menu-brand">
        <div className="menu-brand-mark">VA</div>
        <div className="menu-title fs10 text-center">VANTA</div>
      </div>

      {menu.map((group) => {
        const groupKey = `group-${group.id}`;
        const isGroupOpen = openKeys[groupKey] ?? false;

        return (
          <div className="menu-group mt-3" key={group.id}>
            <button type="button" className="menu-group-toggle" onClick={() => toggleGroup(group.id)}>
              <span className="d-flex align-items-center gap-2">
                <span className="menu-icon-badge">
                  <i className={getGroupIcon(group.name)} />
                </span>
                <span>{t(`nav.${group.name}`)}</span>
              </span>
              <span>{isGroupOpen ? '−' : '+'}</span>
            </button>

            {isGroupOpen && (
              <div className="submenu-wrap nested-level-1">
                {group.folders.map((folder) => {
                  const folderKey = `folder-${folder.id}`;
                  const isFolderOpen = openKeys[folderKey] ?? false;

                  return (
                    <div key={folder.id} className="menu-group mt-2">
                      <button
                        type="button"
                        className="menu-group-toggle menu-group-toggle-sub"
                        onClick={() => toggleFolder(group.id, folder.id)}
                      >
                        <span className="d-flex align-items-center gap-2">
                          <i className={getFolderIcon(folder.name)} />
                          <span>{t(`nav.${folder.name}`)}</span>
                        </span>
                        <span>{isFolderOpen ? '−' : '+'}</span>
                      </button>

                      {isFolderOpen && (
                        <div className="submenu-wrap nested-level-2">
                          {folder.subFolders.map((subFolder) => (
                            <NavLink
                              key={subFolder.id}
                              to={subFolder.path}
                              className="menu-link"
                              onClick={() => selectPath(subFolder.path)}
                            >
                              <span className="d-flex align-items-center gap-2">
                                <i className={getSubFolderIcon(subFolder.path)} />
                                <span>{t(`nav.${subFolder.name}`)}</span>
                              </span>
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
}

export default AppSidebar;
