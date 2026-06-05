import { createContext, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function removeToast(id) {
    setToasts(current => current.filter(toast => toast.id !== id));
  }

  function showToast(message, type = 'info') {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const toast = { id, message, type };
    setToasts(current => [...current, toast]);
    window.setTimeout(() => removeToast(id), 3500);
  }

  const value = useMemo(() => ({ showToast, removeToast }), []);

  return <ToastContext.Provider value={value}>
    {children}
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map(toast => <div key={toast.id} className={`toast toast-${toast.type}`}>
        <span>{toast.message}</span>
        <button type="button" onClick={() => removeToast(toast.id)} aria-label="Dismiss notification">×</button>
      </div>)}
    </div>
  </ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
