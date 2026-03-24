import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth } from "./use-auth";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning";
  timestamp: Date;
  read: boolean;
  intendedRole?: "student" | "instructor" | "admin" | "all";
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (title: string, message: string, type?: Notification["type"], intendedRole?: Notification["intendedRole"]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [allNotifications, setAllNotifications] = useState<Notification[]>(() => {
    try {
      const saved = localStorage.getItem("app_notifications");
      if (saved) {
        return JSON.parse(saved).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("app_notifications", JSON.stringify(allNotifications));
  }, [allNotifications]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "app_notifications" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue).map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp)
          }));
          setAllNotifications(parsed);
        } catch (err) {
          console.error("Failed to parse cross-tab notification", err);
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const addNotification = (title: string, message: string, type: Notification["type"] = "info", intendedRole: Notification["intendedRole"] = "all") => {
    const newNotification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      timestamp: new Date(),
      read: false,
      intendedRole
    };
    setAllNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setAllNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setAllNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setAllNotifications(prev => prev.filter(n => 
      n.intendedRole !== "all" && n.intendedRole !== user?.role 
    ));
  };

  const notifications = allNotifications.filter(n => n.intendedRole === "all" || n.intendedRole === user?.role);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
