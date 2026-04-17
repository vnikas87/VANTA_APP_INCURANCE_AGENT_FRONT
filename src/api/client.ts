import axios from 'axios';
import keycloak from '../auth/keycloak';
import Swal from 'sweetalert2';
import { logoutAllTabs } from '../auth/keycloak';
import { tStatic } from '../i18n';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? '/api';

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

let handlingLicenseLogout = false;

api.interceptors.request.use((config) => {
  if (keycloak.token) {
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  }
  console.log('[API][REQ]', config.method?.toUpperCase(), config.url);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('[API][RES]', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('[API][ERR]', error?.response?.status ?? 'NO_STATUS', error?.config?.url, error);
    const status = error?.response?.status;
    const code = error?.response?.data?.code;
    const message = error?.response?.data?.error;

    if (status === 403 && code === 'LICENSE_LIMIT_REACHED' && !handlingLicenseLogout) {
      handlingLicenseLogout = true;
      let timerInterval: ReturnType<typeof setInterval> | undefined;
      await Swal.fire({
        icon: 'error',
        title: tStatic('api.license_blocked'),
        html: `<div>${message ?? tStatic('api.license_no_valid_seat')}</div><div style="margin-top:8px;font-size:12px;opacity:0.9;">${tStatic('api.logout_in')} <strong id="license-logout-seconds">30</strong>s</div><div style="margin-top:6px;font-size:12px;opacity:0.9;">${tStatic('api.click_ok_logout')}</div>`,
        background: '#07173f',
        color: '#e9eefc',
        backdrop: '#07173f',
        customClass: {
          popup: 'license-block-popup',
          timerProgressBar: 'license-block-timer',
        },
        showConfirmButton: true,
        confirmButtonText: 'OK',
        timer: 30000,
        timerProgressBar: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          const secondsNode = Swal.getHtmlContainer()?.querySelector('#license-logout-seconds');
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
      handlingLicenseLogout = false;
    }

    return Promise.reject(error);
  }
);

export default api;
