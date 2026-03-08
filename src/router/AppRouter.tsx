import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout';
import DashboardPage from '../pages/dashboard';
import LicenseManagementPage from '../pages/license-management';
import NavigationRulesPage from '../pages/navigation-rules';
import SettingsPage from '../pages/settings-profile';
import SettingsUsersPage from '../pages/settings-users';
import UserDetailsPage from '../pages/user-details';
import UsersPage from '../pages/users-management';
import { API_ROLES } from '../config/roles';
import ProtectedRoute from './ProtectedRoute';
import RequireNavPath from './RequireNavPath';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/unauthorized" element={<Navigate to="/" replace />} />

        <Route
          element={
            <ProtectedRoute
              allowedRoles={[API_ROLES.ADMINISTRATOR, API_ROLES.ADMIN, API_ROLES.EDITOR, API_ROLES.VIEWER]}
            />
          }
        >
          <Route element={<DashboardLayout />}>
            <Route
              path="/"
              element={
                <RequireNavPath requiredPath="/">
                  <DashboardPage />
                </RequireNavPath>
              }
            />
            <Route
              path="/settings/profile"
              element={
                <RequireNavPath requiredPath="/settings/profile">
                  <SettingsPage />
                </RequireNavPath>
              }
            />
            <Route
              path="/settings/access-control/users/details"
              element={
                <RequireNavPath requiredPath="/settings/access-control/users/details">
                  <SettingsUsersPage />
                </RequireNavPath>
              }
            />

            <Route element={<ProtectedRoute allowedRoles={[API_ROLES.ADMINISTRATOR, API_ROLES.ADMIN]} />}>
              <Route
                path="/settings/access-control/users"
                element={
                  <RequireNavPath requiredPath="/settings/access-control/users">
                    <UsersPage />
                  </RequireNavPath>
                }
              />
              <Route
                path="/management/users/:id"
                element={
                  <RequireNavPath requiredPath="/settings/access-control/users">
                    <UserDetailsPage />
                  </RequireNavPath>
                }
              />
              <Route
                path="/settings/access-control/navigation"
                element={
                  <RequireNavPath requiredPath="/settings/access-control/navigation">
                    <NavigationRulesPage />
                  </RequireNavPath>
                }
              />
              <Route
                path="/settings/access-control/license"
                element={
                  <RequireNavPath requiredPath="/settings/access-control/license">
                    <LicenseManagementPage />
                  </RequireNavPath>
                }
              />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
