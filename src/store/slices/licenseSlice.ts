import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../api/client';
import type { LicenseAdminResponse } from '../../types/license';
import { toastError, toastSuccess } from '../../utils/alerts';

type LicenseState = {
  data: LicenseAdminResponse | null;
  loading: boolean;
  error: string | null;
};

const initialState: LicenseState = {
  data: null,
  loading: false,
  error: null,
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const maybeAxios = error as { response?: { status?: number; data?: { error?: string; message?: string } } };
    const msg = maybeAxios.response?.data?.error ?? maybeAxios.response?.data?.message;
    const status = maybeAxios.response?.status;
    if (msg && status) return `[${status}] ${msg}`;
    if (msg) return msg;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export const fetchLicenseAdminData = createAsyncThunk('license/fetchAdmin', async () => {
  const response = await api.get<LicenseAdminResponse>('/license');
  return response.data;
});

export const activateLicenseByCode =
  (code: string) => async (dispatch: any): Promise<void> => {
    try {
      await api.post('/license/activate', { code });
      toastSuccess('License activated');
      await dispatch(fetchLicenseAdminData());
    } catch (error) {
      toastError(`License activation failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

export const setUserLicenseSeat =
  (userId: number, isActive: boolean, notes?: string) => async (dispatch: any): Promise<void> => {
    try {
      await api.patch(`/license/users/${userId}`, { isActive, notes });
      toastSuccess(`Seat ${isActive ? 'activated' : 'deactivated'} for user ${userId}`);
      await dispatch(fetchLicenseAdminData());
    } catch (error) {
      toastError(`Seat update failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

export const deactivateCurrentLicense = () => async (dispatch: any): Promise<void> => {
  try {
    await api.post('/license/deactivate');
    toastSuccess('License deactivated. All allocated seats released.');
    await dispatch(fetchLicenseAdminData());
  } catch (error) {
    toastError(`License deactivation failed: ${getErrorMessage(error, 'Unknown error')}`);
  }
};

const licenseSlice = createSlice({
  name: 'license',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLicenseAdminData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLicenseAdminData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchLicenseAdminData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch license data';
      });
  },
});

export default licenseSlice.reducer;
