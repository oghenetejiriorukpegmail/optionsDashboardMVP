"use client"

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";

// Simplified Toast interface
interface Toast {
  id: string;
  title: string;
  description?: string;
  type?: "success" | "error" | "info";
}

// Create a simple ToasterProps type to replace sonner's
type ToasterProps = {
  theme?: string;
  position?: string;
  className?: string;
  style?: React.CSSProperties;
  // Add other props as needed
};

// Global state to store toasts
let toasts: Toast[] = [];
let listeners: Function[] = [];

// Function to add a toast
const addToast = (toast: Omit<Toast, "id">) => {
  const newToast = {
    id: Math.random().toString(36).substring(2, 9),
    ...toast,
  };
  toasts = [...toasts, newToast];
  listeners.forEach((listener) => listener(toasts));
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    dismissToast(newToast.id);
  }, 5000);
};

// Function to dismiss a toast
const dismissToast = (id: string) => {
  toasts = toasts.filter((toast) => toast.id !== id);
  listeners.forEach((listener) => listener(toasts));
};

// Toast component
const Toast = ({ toast }: { toast: Toast }) => {
  const { id, title, description, type = "info" } = toast;
  
  return (
    <div 
      className={`rounded-md border p-4 mb-2 ${
        type === "success" ? "bg-green-50 border-green-200 text-green-800" :
        type === "error" ? "bg-red-50 border-red-200 text-red-800" :
        "bg-blue-50 border-blue-200 text-blue-800"
      }`}
      role="alert"
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium">{title}</div>
          {description && <div className="text-sm mt-1">{description}</div>}
        </div>
        <button
          type="button"
          className="ml-3 -mt-1 text-gray-400 hover:text-gray-900"
          onClick={() => dismissToast(id)}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Simple toast context for managing toasts
export const toast = {
  success: (title: string, description?: string) => 
    addToast({ title, description, type: "success" }),
  error: (title: string, description?: string) => 
    addToast({ title, description, type: "error" }),
  info: (title: string, description?: string) => 
    addToast({ title, description, type: "info" }),
};

// Toaster component
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const [localToasts, setLocalToasts] = useState<Toast[]>([]);
  
  useEffect(() => {
    // Subscribe to toast updates
    const updateToasts = (newToasts: Toast[]) => {
      setLocalToasts([...newToasts]);
    };
    
    listeners.push(updateToasts);
    
    // Initial toasts
    setLocalToasts([...toasts]);
    
    return () => {
      listeners = listeners.filter(listener => listener !== updateToasts);
    };
  }, []);
  
  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-md ${props.className || ''}`}
      style={{
        ...props.style,
      }}
      data-theme={theme}
    >
      {localToasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export { Toaster };
