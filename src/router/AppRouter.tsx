import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout';
import InsuranceCustomersPage from '../pages/insurance-customers';
import InsuranceLookupsPage from '../pages/insurance-lookups';
import InsurancePoliciesPage from '../pages/insurance-policies';
import DashboardPage from '../pages/dashboard';
import InsuranceProductionPage from '../pages/insurance-production';
import InsuranceProductionDetailPage from '../pages/insurance-production-detail';
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
              allowedRoles={[
                API_ROLES.ADMINISTRATOR,
                API_ROLES.OPS_USER,
              ]}
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
            <Route
              path="/insurance/production"
              element={
                <RequireNavPath requiredPath="/insurance/production">
                  <InsuranceProductionPage />
                </RequireNavPath>
              }
            />
            <Route
              path="/insurance/production/:id"
              element={
                <RequireNavPath requiredPath="/insurance/production">
                  <InsuranceProductionDetailPage />
                </RequireNavPath>
              }
            />
            <Route
              path="/settings/insurance/lookups"
              element={<Navigate to="/settings/insurance/partners" replace />}
            />
            <Route
              path="/settings/insurance/partners"
              element={
                <RequireNavPath requiredPath="/settings/insurance/partners">
                  <InsuranceLookupsPage lookupKey="partners" />
                </RequireNavPath>
              }
            />
            <Route
              path="/settings/insurance/companies"
              element={
                <RequireNavPath requiredPath="/settings/insurance/companies">
                  <InsuranceLookupsPage lookupKey="companies" />
                </RequireNavPath>
              }
            />
            <Route
              path="/settings/insurance/branches"
              element={
                <RequireNavPath requiredPath="/settings/insurance/branches">
                  <InsuranceLookupsPage lookupKey="branches" />
                </RequireNavPath>
              }
            />
            <Route
              path="/settings/insurance/contract-types"
              element={
                <RequireNavPath requiredPath="/settings/insurance/contract-types">
                  <InsuranceLookupsPage lookupKey="contract-types" />
                </RequireNavPath>
              }
            />
            <Route
              path="/settings/insurance/document-types"
              element={
                <RequireNavPath requiredPath="/settings/insurance/document-types">
                  <InsuranceLookupsPage lookupKey="document-types" />
                </RequireNavPath>
              }
            />
            <Route
              path="/settings/insurance/production-types"
              element={
                <RequireNavPath requiredPath="/settings/insurance/production-types">
                  <InsuranceLookupsPage lookupKey="production-types" />
                </RequireNavPath>
              }
            />
            <Route
              path="/settings/insurance/payment-frequencies"
              element={
                <RequireNavPath requiredPath="/settings/insurance/payment-frequencies">
                  <InsuranceLookupsPage lookupKey="payment-frequencies" />
                </RequireNavPath>
              }
            />
            <Route
              path="/settings/insurance/customers"
              element={
                <RequireNavPath requiredPath="/settings/insurance/customers">
                  <InsuranceCustomersPage />
                </RequireNavPath>
              }
            />
            <Route
              path="/settings/insurance/policies"
              element={
                <RequireNavPath requiredPath="/settings/insurance/policies">
                  <InsurancePoliciesPage />
                </RequireNavPath>
              }
            />

            <Route element={<ProtectedRoute allowedRoles={[API_ROLES.ADMINISTRATOR]} />}>
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
