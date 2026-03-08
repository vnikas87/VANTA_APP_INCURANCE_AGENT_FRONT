import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../api/client';
import type { CurrentUserResponse, User, UserNotification, UserPayload } from '../../types/user';
import { successDeleteAlert, sweetAlert, toastError, toastSuccess } from '../../utils/alerts';
import type { AppDispatch } from '../index';

type UsersState = {
  items: User[];
  currentUser: User | null;
  notifications: UserNotification[];
  loading: boolean;
  error: string | null;
};

const initialState: UsersState = {
  items: [],
  currentUser: null,
  notifications: [],
  loading: false,
  error: null,
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const maybeAxios = error as { response?: { data?: { error?: string; message?: string } } };
    const apiMessage = maybeAxios.response?.data?.error ?? maybeAxios.response?.data?.message;
    if (apiMessage) return apiMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
  const response = await api.get<User[]>('/users');
  return response.data;
});

export const fetchCurrentUser = createAsyncThunk('users/fetchCurrentUser', async () => {
  const response = await api.get<CurrentUserResponse>('/users/me');
  return response.data;
});

export const updateMyProfile = createAsyncThunk(
  'users/updateMyProfile',
  async (payload: {
    name?: string;
    email?: string;
    phone?: string;
    mobilePhone?: string;
    companyRole?: string;
    signature?: string;
  }) => {
    const response = await api.patch<User>('/users/me/profile', payload);
    return response.data;
  }
);

export const uploadMyAvatar = createAsyncThunk(
  'users/uploadMyAvatar',
  async (imageDataUrl: string) => {
    const response = await api.post<User>('/users/me/avatar', { imageDataUrl });
    return response.data;
  }
);

export const createUser = createAsyncThunk('users/createUser', async (payload: UserPayload) => {
  const response = await api.post<User>('/users', payload);
  return response.data;
});

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, payload }: { id: number; payload: Partial<UserPayload> }) => {
    const response = await api.patch<User>(`/users/${id}`, payload);
    return response.data;
  }
);

export const deleteUser = createAsyncThunk('users/deleteUser', async (id: number) => {
  await api.delete(`/users/${id}`);
  return id;
});

export const deleteUserWithConfirm =
  (id: number) =>
  async (dispatch: AppDispatch): Promise<void> => {
    try {
      const alertStatus = await sweetAlert();
      if (!alertStatus) return;

      await dispatch(deleteUser(id)).unwrap();
      successDeleteAlert();
      toastSuccess('User deleted successfully');
    } catch (error) {
      toastError(`Delete failed: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch users';
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.currentUser = action.payload.user;
        state.notifications = action.payload.notifications;
      })
      .addCase(updateMyProfile.fulfilled, (state, action) => {
        state.currentUser = action.payload;
        state.items = state.items.map((user) => (user.id === action.payload.id ? action.payload : user));
      })
      .addCase(uploadMyAvatar.fulfilled, (state, action) => {
        state.currentUser = action.payload;
        state.items = state.items.map((user) => (user.id === action.payload.id ? action.payload : user));
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.items = state.items.map((user) => (user.id === action.payload.id ? action.payload : user));
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.items = state.items.filter((user) => user.id !== action.payload);
      });
  },
});

export default usersSlice.reducer;
