import { configureStore } from '@reduxjs/toolkit';
import licenseReducer from './slices/licenseSlice';
import navigationReducer from './slices/navigationSlice';
import usersReducer from './slices/usersSlice';

export const store = configureStore({
  reducer: {
    users: usersReducer,
    navigation: navigationReducer,
    license: licenseReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
