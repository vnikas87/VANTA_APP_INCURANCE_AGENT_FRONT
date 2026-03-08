import { useState } from 'react';
import { Button } from 'reactstrap';
import { logoutAllTabs } from '../../auth/keycloak';
import type { User, UserNotification } from '../../types/user';

type AppHeaderProps = {
  username: string;
  currentUser: User | null;
  notifications: UserNotification[];
  onToggleSidebar: () => void;
};

function formatTime(value: string): string {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function AppHeader({ username, currentUser, notifications, onToggleSidebar }: AppHeaderProps) {
  const [openNotif, setOpenNotif] = useState(false);
  const [openUser, setOpenUser] = useState(false);

  return (
    <header className="app-header d-flex align-items-center justify-content-between px-3 px-md-4 py-3">
      <div className="d-flex align-items-center gap-2">
        <Button color="dark" outline size="sm" onClick={onToggleSidebar} className="nav-toggle-btn">
          <i className="ri-menu-2-line" />
        </Button>
        <div>
          <div className="fw-bold">BlueGame Console</div>
          <div className="text-muted fs-12">Role-driven control panel</div>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2 gap-md-3 position-relative">
        <div className="header-menu-wrap">
          <Button color="light" className="header-icon-btn" onClick={() => setOpenNotif((v) => !v)}>
            <i className="ri-notification-3-line" />
            {notifications.length > 0 ? <span className="notif-dot">{notifications.length}</span> : null}
          </Button>

          {openNotif ? (
            <div className="header-popover">
              <div className="popover-title">Notifications</div>
              {notifications.length === 0 ? <div className="popover-empty">No notifications</div> : null}
              {notifications.map((item) => (
                <div className="popover-item" key={item.id}>
                  <div className="fw-semibold fs-12">{item.eventType}</div>
                  <div className="text-muted fs-12">{item.details ?? '-'}</div>
                  <div className="text-muted fs-12">{formatTime(item.createdAt)}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="header-menu-wrap">
          <button type="button" className="header-user-btn" onClick={() => setOpenUser((v) => !v)}>
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt="avatar" className="avatar-photo" />
            ) : (
              <div className="avatar-chip">
                <span>{username.slice(0, 1).toUpperCase()}</span>
              </div>
            )}
            <div className="d-none d-md-block text-start">
              <div className="fw-semibold">{username}</div>
              <div className="text-muted fs-12">{currentUser?.companyRole ?? 'User'}</div>
            </div>
            <i className="ri-arrow-down-s-line" />
          </button>

          {openUser ? (
            <div className="header-popover user-popover">
              <div className="popover-item">
                <div className="fw-semibold">{currentUser?.name ?? username}</div>
                <div className="text-muted fs-12">{currentUser?.email ?? '-'}</div>
                <div className="text-muted fs-12">{currentUser?.phone ?? '-'}</div>
                <div className="text-muted fs-12">{currentUser?.mobilePhone ?? '-'}</div>
                <div className="text-muted fs-12">{currentUser?.companyRole ?? '-'}</div>
                <div className="text-muted fs-12">{currentUser?.signature ?? '-'}</div>
              </div>
              <button type="button" className="logout-btn" onClick={() => void logoutAllTabs()}>
                <i className="ri-logout-box-r-line" /> Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
