import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Notification {
    id: number;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    time: string;
    timestamp: string;
    read: boolean;
}

interface NotificationContextProps {
    notifications: Notification[];
    addNotification: (type: 'info' | 'success' | 'warning' | 'error', title: string, message: string) => void;
    markAsRead: (id: number) => void;
    markAllAsRead: () => void;
    deleteNotification: (id: number) => void;
    unreadCount: number;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

const STORAGE_KEY = 'ourcrm_notifications';

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        // Load from local storage
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setNotifications(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse notifications", e);
            }
        } else {
            // Provide some initial mock dataset if completely empty
            setNotifications([
                { id: 1, type: 'info', title: 'System Updated', message: 'CRM version 2.4 has been deployed successfully.', time: '2h ago', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), read: false }
            ]);
        }
    }, []);

    useEffect(() => {
        // Save to local storage whenever notifications change
        if (notifications.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
        }
    }, [notifications]);

    const addNotification = (type: 'info' | 'success' | 'warning' | 'error', title: string, message: string) => {
        const newNotif: Notification = {
            id: Date.now(),
            type,
            title,
            message,
            time: 'Just now',
            timestamp: new Date().toISOString(),
            read: false
        };
        // Add to the front of the list
        setNotifications(prev => [newNotif, ...prev]);
    };

    const markAsRead = (id: number) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, markAllAsRead, deleteNotification, unreadCount }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
