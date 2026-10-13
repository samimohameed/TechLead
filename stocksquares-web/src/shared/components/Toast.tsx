import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, title: string, message?: string) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const lastToastRef = React.useRef<{ key: string; time: number }>({ key: '', time: 0 });
  const DEDUP_MS = 1000;

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const now = Date.now();
    const key = `${type}:${title}:${message || ''}`;
    if (key === lastToastRef.current.key && now - lastToastRef.current.time < DEDUP_MS) {
      return; // Deduplicate rapid identical toasts
    }
    lastToastRef.current = { key, time: now };

    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { id, type, title, message };
    setToasts(prev => [...prev.slice(-4), newToast]); // keep at most 5 toasts

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const showSuccess = useCallback((title: string, message?: string) => showToast('success', title, message), [showToast]);
  const showError = useCallback((title: string, message?: string) => showToast('error', title, message), [showToast]);
  const showWarning = useCallback((title: string, message?: string) => showToast('warning', title, message), [showToast]);
  const showInfo = useCallback((title: string, message?: string) => showToast('info', title, message), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      {/* Toast container floating overlay */}
      <div style={{
        position: 'fixed',
        top: '20px',
        insetInlineEnd: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '380px',
        width: '100%',
        pointerEvents: 'none'
      }}>
        {toasts.map(toast => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          const borderColor = isSuccess ? 'rgba(16, 185, 129, 0.4)' : isError ? 'rgba(244, 63, 94, 0.4)' : isWarning ? 'rgba(245, 158, 11, 0.4)' : 'rgba(59, 130, 246, 0.4)';
          const bgColor = isSuccess ? 'rgba(16, 185, 129, 0.12)' : isError ? 'rgba(244, 63, 94, 0.12)' : isWarning ? 'rgba(245, 158, 11, 0.12)' : 'rgba(59, 130, 246, 0.12)';
          const iconColor = isSuccess ? 'var(--color-up)' : isError ? 'var(--color-down)' : isWarning ? 'var(--color-warning)' : 'var(--color-brand)';

          return (
            <div
              key={toast.id}
              className="glass-panel"
              style={{
                pointerEvents: 'auto',
                padding: '12px 16px',
                border: `1px solid ${borderColor}`,
                background: `linear-gradient(135deg, ${bgColor} 0%, rgba(18, 24, 38, 0.95) 100%)`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                animation: 'slideIn 0.25s ease-out'
              }}
            >
              <div style={{ color: iconColor, marginTop: '2px', flexShrink: 0 }}>
                {isSuccess && <CheckCircle2 size={18} />}
                {isError && <XCircle size={18} />}
                {isWarning && <AlertTriangle size={18} />}
                {toast.type === 'info' && <Info size={18} />}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#fff' }}>
                  {toast.title}
                </div>
                {toast.message && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {toast.message}
                  </div>
                )}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px'
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
