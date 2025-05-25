// components/ui/use-toast.js
import { useState } from "react";

const toasts = [];
let listeners = [];

const addToast = (toast) => {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast = { id, ...toast };
  toasts.push(newToast);

  listeners.forEach((listener) => listener([...toasts]));

  // Auto remove after 5 seconds
  setTimeout(() => {
    const index = toasts.findIndex((t) => t.id === id);
    if (index > -1) {
      toasts.splice(index, 1);
      listeners.forEach((listener) => listener([...toasts]));
    }
  }, 5000);

  return id;
};

const removeToast = (id) => {
  const index = toasts.findIndex((t) => t.id === id);
  if (index > -1) {
    toasts.splice(index, 1);
    listeners.forEach((listener) => listener([...toasts]));
  }
};

export const toast = ({ title, description, variant = "default" }) => {
  return addToast({ title, description, variant });
};

export const useToast = () => {
  const [toastList, setToastList] = useState([...toasts]);

  useState(() => {
    listeners.push(setToastList);
    return () => {
      const index = listeners.indexOf(setToastList);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    toasts: toastList,
    toast,
    dismiss: removeToast,
  };
};
