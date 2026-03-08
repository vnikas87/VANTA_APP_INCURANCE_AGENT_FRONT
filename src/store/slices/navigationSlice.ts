import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../api/client';
import type {
  CreateFolderPayload,
  CreateGroupPayload,
  CreateNavigationRolePayload,
  CreateRulePayload,
  CreateSubFolderPayload,
  NavigationGroup,
  NavigationRole,
} from '../../types/navigation';
import { sweetAlert, toastError, toastSuccess } from '../../utils/alerts';

type NavigationState = {
  menu: NavigationGroup[];
  adminTree: NavigationGroup[];
  navRoles: NavigationRole[];
  loading: boolean;
  menuLoaded: boolean;
  error: string | null;
};

const initialState: NavigationState = {
  menu: [],
  adminTree: [],
  navRoles: [],
  loading: false,
  menuLoaded: false,
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

async function refreshAll(dispatch: any): Promise<void> {
  await dispatch(fetchNavigationAdminTree());
  await dispatch(fetchNavigationRoles());
  await dispatch(fetchNavigationMenu());
}

export const fetchNavigationMenu = createAsyncThunk('navigation/fetchMenu', async () => {
  const response = await api.get<NavigationGroup[]>('/navigation/menu');
  return response.data;
});

export const fetchNavigationAdminTree = createAsyncThunk('navigation/fetchAdmin', async () => {
  const response = await api.get<NavigationGroup[]>('/navigation/admin');
  return response.data;
});

export const fetchNavigationRoles = createAsyncThunk('navigation/fetchRoles', async () => {
  const response = await api.get<NavigationRole[]>('/navigation/roles');
  return response.data;
});

export const createNavigationGroup =
  (payload: CreateGroupPayload) => async (dispatch: any): Promise<void> => {
    try {
      await api.post('/navigation/groups', payload);
      toastSuccess('Group created');
      await refreshAll(dispatch);
    } catch (error) {
      toastError(`Create group failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

export const updateNavigationGroup =
  (id: number, payload: Partial<CreateGroupPayload>) => async (dispatch: any): Promise<void> => {
    try {
      await api.patch(`/navigation/groups/${id}`, payload);
      toastSuccess('Group updated');
      await refreshAll(dispatch);
    } catch (error) {
      toastError(`Update group failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

export const deleteNavigationGroup =
  (id: number) => async (dispatch: any): Promise<void> => {
    try {
      const ok = await sweetAlert();
      if (!ok) return;
      await api.delete(`/navigation/groups/${id}`);
      toastSuccess('Group deleted');
      await refreshAll(dispatch);
    } catch (error) {
      toastError(`Delete group failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

export const createNavigationFolder =
  (payload: CreateFolderPayload) => async (dispatch: any): Promise<void> => {
    try {
      await api.post('/navigation/folders', payload);
      toastSuccess('Folder created');
      await refreshAll(dispatch);
    } catch (error) {
      toastError(`Create folder failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

export const updateNavigationFolder =
  (id: number, payload: Partial<CreateFolderPayload>) => async (dispatch: any): Promise<void> => {
    try {
      await api.patch(`/navigation/folders/${id}`, payload);
      toastSuccess('Folder updated');
      await refreshAll(dispatch);
    } catch (error) {
      toastError(`Update folder failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

export const deleteNavigationFolder =
  (id: number) => async (dispatch: any): Promise<void> => {
    try {
      const ok = await sweetAlert();
      if (!ok) return;
      await api.delete(`/navigation/folders/${id}`);
      toastSuccess('Folder deleted');
      await refreshAll(dispatch);
    } catch (error) {
      toastError(`Delete folder failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

export const moveNavigationFolder =
  (id: number, payload: { targetGroupId: number; targetIndex: number }) =>
  async (dispatch: any): Promise<void> => {
    try {
      await api.patch(`/navigation/folders/${id}/move`, payload);
      toastSuccess('Folder moved');
      await refreshAll(dispatch);
    } catch (error) {
      toastError(`Move folder failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

export const createNavigationSubFolder =
  (payload: CreateSubFolderPayload) => async (dispatch: any): Promise<void> => {
    try {
      await api.post('/navigation/sub-folders', payload);
      toastSuccess('Sub folder created');
      await refreshAll(dispatch);
    } catch (error) {
      toastError(`Create sub folder failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

export const updateNavigationSubFolder =
  (id: number, payload: Partial<CreateSubFolderPayload>) => async (dispatch: any): Promise<void> => {
    try {
      await api.patch(`/navigation/sub-folders/${id}`, payload);
      toastSuccess('Sub folder updated');
      await refreshAll(dispatch);
    } catch (error) {
      toastError(`Update sub folder failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

export const deleteNavigationSubFolder =
  (id: number) => async (dispatch: any): Promise<void> => {
    try {
      const ok = await sweetAlert();
      if (!ok) return;
      await api.delete(`/navigation/sub-folders/${id}`);
      toastSuccess('Sub folder deleted');
      await refreshAll(dispatch);
    } catch (error) {
      toastError(`Delete sub folder failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

export const moveNavigationSubFolder =
  (id: number, payload: { targetFolderId: number; targetIndex: number }) =>
  async (dispatch: any): Promise<void> => {
    try {
      await api.patch(`/navigation/sub-folders/${id}/move`, payload);
      toastSuccess('Sub folder moved');
      await refreshAll(dispatch);
    } catch (error) {
      toastError(`Move sub folder failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

export const createNavigationRule =
  (payload: CreateRulePayload) => async (dispatch: any): Promise<void> => {
    try {
      await api.post('/navigation/rules', payload);
      toastSuccess('Access rule saved');
      await refreshAll(dispatch);
    } catch (error) {
      toastError(`Create rule failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

export const bulkUpsertNavigationRules =
  (payload: { subFolderId: number; roleNames: string[]; canAccess: boolean }) =>
  async (dispatch: any): Promise<void> => {
    const roles = Array.from(new Set(payload.roleNames.map((role) => role.trim().toUpperCase()).filter(Boolean)));
    if (roles.length === 0) {
      toastError('Select at least one role');
      return;
    }

    const results = await Promise.allSettled(
      roles.map((roleName) =>
        api.post('/navigation/rules', {
          subFolderId: payload.subFolderId,
          roleName,
          canAccess: payload.canAccess,
        })
      )
    );

    const failed = results.filter((result) => result.status === 'rejected').length;
    const created = results.length - failed;

    if (created > 0) {
      toastSuccess(`${created} access rule(s) saved`);
      await refreshAll(dispatch);
    }

    if (failed > 0) {
      toastError(`${failed} rule(s) failed (already exists or invalid role)`);
    }
  };

export const updateNavigationRule =
  (id: number, payload: Partial<CreateRulePayload>) => async (dispatch: any): Promise<void> => {
    try {
      await api.patch(`/navigation/rules/${id}`, payload);
      toastSuccess('Access rule updated');
      await refreshAll(dispatch);
    } catch (error) {
      toastError(`Update rule failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

export const deleteNavigationRule =
  (id: number) => async (dispatch: any): Promise<void> => {
    try {
      const ok = await sweetAlert();
      if (!ok) return;
      await api.delete(`/navigation/rules/${id}`);
      toastSuccess('Access rule deleted');
      await refreshAll(dispatch);
    } catch (error) {
      toastError(`Delete rule failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

export const bulkDeleteNavigationRules =
  (payload: number[] | { ids: number[]; confirm?: boolean }) => async (dispatch: any): Promise<void> => {
    const ids = Array.isArray(payload) ? payload : payload.ids;
    const confirmRequired = Array.isArray(payload) ? true : payload.confirm !== false;
    const uniqueIds = Array.from(new Set(ids.filter((id) => Number.isInteger(id) && id > 0)));
    if (uniqueIds.length === 0) {
      toastError('Select at least one rule to delete');
      return;
    }

    if (confirmRequired) {
      const ok = await sweetAlert();
      if (!ok) return;
    }

    const results = await Promise.allSettled(uniqueIds.map((id) => api.delete(`/navigation/rules/${id}`)));
    const failed = results.filter((result) => result.status === 'rejected').length;
    const removed = results.length - failed;

    if (removed > 0) {
      toastSuccess(`${removed} access rule(s) deleted`);
      await refreshAll(dispatch);
    }

    if (failed > 0) {
      toastError(`${failed} rule(s) could not be deleted`);
    }
  };

export const bulkSetNavigationRulesAccess =
  (payload: { ids: number[]; canAccess: boolean }) => async (dispatch: any): Promise<void> => {
    const uniqueIds = Array.from(new Set(payload.ids.filter((id) => Number.isInteger(id) && id > 0)));
    if (uniqueIds.length === 0) {
      toastError('Select at least one rule');
      return;
    }

    const rulesResponse = await api.get<NavigationGroup[]>('/navigation/admin');
    const allRules = rulesResponse.data
      .flatMap((group) => group.folders)
      .flatMap((folder) => folder.subFolders)
      .flatMap((subFolder) => subFolder.rules);

    const ruleMap = new Map(allRules.map((rule) => [rule.id, rule]));
    const patchList = uniqueIds.flatMap((id) => {
      const rule = ruleMap.get(id);
      if (!rule) return [];
      return [
        api.patch(`/navigation/rules/${id}`, {
          roleName: rule.roleName,
          canAccess: payload.canAccess,
        }),
      ];
    });

    const results = await Promise.allSettled(patchList);
    const failed = results.filter((result) => result.status === 'rejected').length;
    const updated = results.length - failed;

    if (updated > 0) {
      toastSuccess(`${updated} rule(s) updated`);
      await refreshAll(dispatch);
    }

    if (failed > 0) {
      toastError(`${failed} rule(s) failed to update`);
    }
  };

export const createNavigationRole =
  (payload: CreateNavigationRolePayload) => async (dispatch: any): Promise<void> => {
    try {
      await api.post('/navigation/roles', payload);
      toastSuccess('Navigation role created');
      await refreshAll(dispatch);
    } catch (error) {
      toastError(`Create navigation role failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

export const updateNavigationRole =
  (id: number, payload: Partial<CreateNavigationRolePayload>) => async (dispatch: any): Promise<void> => {
    try {
      await api.patch(`/navigation/roles/${id}`, payload);
      toastSuccess('Navigation role updated');
      await refreshAll(dispatch);
    } catch (error) {
      toastError(`Update navigation role failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

export const deleteNavigationRole =
  (id: number) => async (dispatch: any): Promise<void> => {
    try {
      const ok = await sweetAlert();
      if (!ok) return;
      await api.delete(`/navigation/roles/${id}`);
      toastSuccess('Navigation role deleted');
      await refreshAll(dispatch);
    } catch (error) {
      toastError(`Delete navigation role failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNavigationMenu.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.menuLoaded = false;
      })
      .addCase(fetchNavigationMenu.fulfilled, (state, action) => {
        state.loading = false;
        state.menu = action.payload;
        state.menuLoaded = true;
      })
      .addCase(fetchNavigationMenu.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch navigation menu';
        state.menuLoaded = true;
      })
      .addCase(fetchNavigationAdminTree.fulfilled, (state, action) => {
        state.adminTree = action.payload;
      })
      .addCase(fetchNavigationRoles.fulfilled, (state, action) => {
        state.navRoles = action.payload;
      });
  },
});

export default navigationSlice.reducer;
