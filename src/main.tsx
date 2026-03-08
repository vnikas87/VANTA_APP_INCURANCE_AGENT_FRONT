import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'remixicon/fonts/remixicon.css';
import 'react-toastify/dist/ReactToastify.css';
import 'sweetalert2/dist/sweetalert2.min.css';
import App from './App';
import { initKeycloak, setupTokenLifecycle } from './auth/keycloak';
import './styles/theme.css';
import { store } from './store';

async function bootstrap() {
  try {
    await initKeycloak();
    setupTokenLifecycle();

    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <Provider store={store}>
          <App />
          <ToastContainer position="top-right" autoClose={3000} newestOnTop />
        </Provider>
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to initialize Keycloak', error);
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <div style={{ padding: 24, fontFamily: 'Poppins, sans-serif' }}>Authentication bootstrap failed.</div>
    );
  }
}

void bootstrap();
