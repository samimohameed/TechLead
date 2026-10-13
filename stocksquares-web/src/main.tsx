import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { I18nProvider } from './shared/i18n/I18nContext';
import { ToastProvider } from './shared/components/Toast';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </I18nProvider>
  </React.StrictMode>
);
