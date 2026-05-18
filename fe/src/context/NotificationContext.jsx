import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import echo from '../services/echo';
import axios from 'axios';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Fetch notifications từ API
    const fetchNotifications = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(response.data.data.data);
            
            const countResponse = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/notifications/unread-count`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUnreadCount(countResponse.data.unread_count);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Mark as read
    const markAsRead = async (id = null) => {
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/notifications/mark-read`, { id }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (id) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date() } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } else {
                setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date() })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    // Xóa thông báo
    const deleteNotification = async (id) => {
        try {
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.filter(n => n.id !== id));
            // Cập nhật lại count nếu thông báo đó chưa đọc
            const wasUnread = !notifications.find(n => n.id === id)?.read_at;
            if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    // Subscribe WebSocket
    useEffect(() => {
        if (!user || !token) return;

        // Cập nhật token mới nhất cho Echo trước khi subscribe (Đã được xử lý tự động trong echo.js custom authorizer)
        if (echo.options.auth?.headers) {
            echo.options.auth.headers.Authorization = `Bearer ${token}`;
        }
        
        // 1. Lắng nghe thông báo (Persistent - qua Database channel)
        // Laravel gửi thông báo qua kênh App.Models.User.{id} mặc định của Notification
        const notificationChannel = echo.private(`user.${user.id}`)
            .stopListening('.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated');
        
        notificationChannel.notification((notification) => {
            console.log('New Database Notification Received:', notification);
            
            setNotifications(prev => {
                // Nếu ID này đã có trong danh sách (vừa nhận được qua API hoặc Event khác), bỏ qua
                if (prev.some(n => n.id === notification.id)) return prev;
                
                // Tránh lặp toast nếu là tin nhắn chat mới và admin đã ở trong trang support
                const isSupportPage = window.location.pathname === '/admin/support';
                const isSupportMessage = notification.type === 'support_message';

                if (!(isSupportMessage && isSupportPage)) {
                    toast.success(
                        <div onClick={() => window.location.href = notification.action_url || '#'} className="cursor-pointer">
                            <strong>{notification.title}</strong>
                            <p className="text-xs">{notification.message}</p>
                        </div>,
                        { 
                            duration: 5000, 
                            icon: notification.icon || '🔔',
                            id: notification.id // Sử dụng ID của thông báo làm Toast ID để tránh bị lặp
                        }
                    );
                }

                return [
                    {
                        id: notification.id,
                        data: notification,
                        read_at: null,
                        created_at: new Date().toISOString()
                    },
                    ...prev
                ];
            });
            setUnreadCount(prev => prev + 1);
        });

        // 2. Lắng nghe Events (Instant - cho Admin hoặc Customer)
        // Kênh Admin
        const isAdminUser = user.role?.code === 'admin' || user.role?.name === 'admin';
        if (isAdminUser) {
            const adminChannel = echo.private('admin');
            
            adminChannel.stopListening('.order.placed').listen('.order.placed', (e) => {
                toast.success(`Đơn hàng mới: ${e.code} - ${e.customer}`, { icon: '🛍️' });
                fetchNotifications(); // Refresh list
            });

            adminChannel.stopListening('.order.return.requested').listen('.order.return.requested', (e) => {
                toast.error(`Yêu cầu hoàn trả mới cho đơn ${e.order_code}`, { icon: '🔄' });
                fetchNotifications();
            });

            adminChannel.stopListening('.stock.low').listen('.stock.low', (e) => {
                toast.error(`Cảnh báo tồn kho: ${e.product_name} (${e.stock} còn lại)`, { icon: '⚠️' });
                fetchNotifications();
            });

            adminChannel.stopListening('.order.status.updated').listen('.order.status.updated', (e) => {
                toast.info(`Đơn hàng ${e.code} thay đổi trạng thái: ${e.status_label}`, { icon: 'ℹ️' });
                fetchNotifications();
            });

            adminChannel.stopListening('.support.message.sent').listen('.support.message.sent', (data) => {
                const incomingMsg = data.message;
                // Chỉ thông báo nếu tin nhắn đến từ khách hàng và admin đang không ở trong trang support
                if (incomingMsg.sender_id === incomingMsg.customer_id && window.location.pathname !== '/admin/support') {
                    // Phát âm thanh chime thông báo
                    try {
                        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                        const osc = audioCtx.createOscillator();
                        const gain = audioCtx.createGain();
                        osc.connect(gain);
                        gain.connect(audioCtx.destination);
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
                        gain.gain.setValueAtTime(0, audioCtx.currentTime);
                        gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
                        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
                        osc.start(audioCtx.currentTime);
                        osc.stop(audioCtx.currentTime + 0.4);
                        
                        setTimeout(() => {
                            const osc2 = audioCtx.createOscillator();
                            const gain2 = audioCtx.createGain();
                            osc2.connect(gain2);
                            gain2.connect(audioCtx.destination);
                            osc2.type = 'sine';
                            osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
                            gain2.gain.setValueAtTime(0, audioCtx.currentTime);
                            gain2.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
                            gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
                            osc2.start(audioCtx.currentTime);
                            osc2.stop(audioCtx.currentTime + 0.5);
                        }, 80);
                    } catch (e) {
                        console.warn("Chime failed", e);
                    }

                    // Hiển thị toast click được
                    toast.success(
                        <div onClick={() => window.location.href = '/admin/support'} className="cursor-pointer">
                            <strong>Tin nhắn mới từ {incomingMsg.sender?.name || 'Khách hàng'}</strong>
                            <p className="text-xs truncate">{incomingMsg.message}</p>
                        </div>,
                        { 
                            duration: 5000, 
                            icon: '💬',
                        }
                    );
                }
            });
        }

        return () => {
            echo.leave(`user.${user.id}`);
            if (isAdminUser) echo.leave('admin');
        };
    }, [user, token, fetchNotifications]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    return (
        <NotificationContext.Provider value={{ 
            notifications, 
            unreadCount, 
            loading, 
            markAsRead, 
            deleteNotification,
            fetchNotifications 
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
