import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
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

function AppSidebar({ collapsed, mobileOpen, onCloseMobile }: AppSidebarProps) {
  const menu = useAppSelector((state) => state.navigation.menu);
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({});

  const asideClassName = useMemo(() => {
    const classes = ['app-sidebar', 'p-3'];
    if (collapsed) classes.push('collapsed');
    if (mobileOpen) classes.push('mobile-open');
    return classes.join(' ');
  }, [collapsed, mobileOpen]);

  const toggleKey = (key: string) => {
    setOpenKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (collapsed && !mobileOpen) {
    return (
      <aside className={asideClassName}>
        <div className="menu-brand menu-brand-collapsed">
          <div className="menu-brand-mark">BG</div>
        </div>

        <div className="collapsed-icons-wrap">
          {menu.map((group) => {
            const firstSub = group.folders.flatMap((folder) => folder.subFolders)[0];
            const iconClass = getGroupIcon(group.name);

            return firstSub ? (
              <NavLink
                key={group.id}
                to={firstSub.path}
                className="menu-icon-only-link"
                title={group.name}
                onClick={onCloseMobile}
              >
                <i className={iconClass} />
              </NavLink>
            ) : (
              <div key={group.id} className="menu-icon-only-link disabled" title={group.name}>
                <i className={iconClass} />
              </div>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside className={asideClassName}>
      <div className="menu-brand">
        <div className="menu-brand-mark">BG</div>
        <div className="menu-title fs10 text-center">BLUEGAME</div>
      </div>

      {menu.map((group) => {
        const groupKey = `group-${group.id}`;
        const isGroupOpen = openKeys[groupKey] ?? true;

        return (
          <div className="menu-group mt-3" key={group.id}>
            <button type="button" className="menu-group-toggle" onClick={() => toggleKey(groupKey)}>
              <span className="d-flex align-items-center gap-2">
                <span className="menu-icon-badge">
                  <i className={getGroupIcon(group.name)} />
                </span>
                <span>{group.name}</span>
              </span>
              <span>{isGroupOpen ? '−' : '+'}</span>
            </button>

            {isGroupOpen && (
              <div className="submenu-wrap nested-level-1">
                {group.folders.map((folder) => {
                  const folderKey = `folder-${folder.id}`;
                  const isFolderOpen = openKeys[folderKey] ?? true;

                  return (
                    <div key={folder.id} className="menu-group mt-2">
                      <button
                        type="button"
                        className="menu-group-toggle menu-group-toggle-sub"
                        onClick={() => toggleKey(folderKey)}
                      >
                        <span className="d-flex align-items-center gap-2">
                          <i className={getFolderIcon(folder.name)} />
                          <span>{folder.name}</span>
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
                              onClick={onCloseMobile}
                            >
                              <span className="d-flex align-items-center gap-2">
                                <i className={getSubFolderIcon(subFolder.path)} />
                                <span>{subFolder.name}</span>
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
