import Keycloak from 'keycloak-js';
import { toast } from 'react-toastify';

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? 'bluegameRealm',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'myclient',
});

const authChannel = new BroadcastChannel('bluegame-auth');
let initialized = false;
let warnedExpiry = false;

export async function initKeycloak(): Promise<void> {
  if (initialized) return;

  authChannel.onmessage = async (event) => {
    if (event.data === 'logout') {
      keycloak.clearToken();
      window.location.reload();
    }
  };

  keycloak.onAuthLogout = () => {
    authChannel.postMessage('logout');
  };

  const authenticated = await keycloak.init({
    onLoad: 'check-sso',
    checkLoginIframe: true,
    pkceMethod: 'S256',
    silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
  });

  if (!authenticated) {
    await keycloak.login();
    return;
  }

  initialized = true;
}

export function getUserRoles(): string[] {
  const parsed = keycloak.tokenParsed as
    | {
        realm_access?: { roles?: string[] };
        resource_access?: Record<string, { roles?: string[] }>;
      }
    | undefined;

  const roleSet = new Set<string>();

  for (const role of parsed?.realm_access?.roles ?? []) {
    roleSet.add(role.toUpperCase());
  }

  const configuredClientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'myclient';
  const configuredClientRoles = parsed?.resource_access?.[configuredClientId]?.roles ?? [];
  for (const role of configuredClientRoles) {
    roleSet.add(role.toUpperCase());
  }

  for (const client of Object.values(parsed?.resource_access ?? {})) {
    for (const role of client.roles ?? []) {
      roleSet.add(role.toUpperCase());
    }
  }

  return Array.from(roleSet);
}

export function hasAnyRole(allowedRoles: string[]): boolean {
  if (allowedRoles.length === 0) return true;
  const roles = getUserRoles();
  return allowedRoles.some((role) => roles.includes(role.toUpperCase()));
}

export function getTokenSecondsLeft(): number {
  const exp = keycloak.tokenParsed?.exp;
  if (!exp) return 0;
  return Math.max(0, exp - Math.floor(Date.now() / 1000));
}

export function setupTokenLifecycle(): void {
  setInterval(async () => {
    try {
      await keycloak.updateToken(120);

      const left = getTokenSecondsLeft();
      if (left <= 300 && !warnedExpiry) {
        warnedExpiry = true;
        toast.warning(`Token expires in ${left}s`);
      }

      if (left > 300) {
        warnedExpiry = false;
      }
    } catch (error) {
      toast.error('Session expired. Please login again.');
      console.error('Token refresh failed', error);
      await keycloak.login();
    }
  }, 15000);
}

export async function logoutAllTabs(): Promise<void> {
  authChannel.postMessage('logout');
  await keycloak.logout();
}

export default keycloak;
