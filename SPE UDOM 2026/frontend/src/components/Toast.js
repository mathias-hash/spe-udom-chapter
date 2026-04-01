import React, { useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <span>{type === 'success' ? '✅' : '❌'} {message}</span>
      <button className="toast-close" onClick={onClose}>✕</button>
    </div>
  );
};

export default Toast;
