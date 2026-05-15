import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, Trash2, ExternalLink } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const NotificationBell = () => {
    const { notifications, unreadCount, markAsRead, deleteNotification } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = () => setIsOpen(!isOpen);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="relative p-2 text-gray-500 hover:text-black transition-colors duration-200 focus:outline-none"
            >
                <Bell size={22} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                        <h3 className="text-sm font-bold text-slate-900">Thông báo</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAsRead()}
                                className="text-[11px] font-medium text-blue-500 hover:text-blue-600 transition-colors"
                            >
                                Đánh dấu tất cả đã đọc
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`group relative border-b border-gray-50 transition-all duration-200 hover:bg-gray-50 ${
                                        !notification.read_at ? 'bg-blue-50/30' : ''
                                    }`}
                                >
                                    <div className="flex">
                                        <Link
                                            to={notification.data?.action_url || '#'}
                                            onClick={(e) => {
                                                if (!notification.data?.action_url) {
                                                    e.preventDefault();
                                                }
                                                markAsRead(notification.id);
                                                setIsOpen(false);
                                            }}
                                            className="flex-1 flex gap-4 p-4 min-w-0"
                                        >
                                            <div className="flex-shrink-0 mt-1">
                                                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center text-xl shadow-sm ${
                                                    notification.data?.color === 'red' ? 'bg-red-50 text-red-500' :
                                                    notification.data?.color === 'green' ? 'bg-green-50 text-green-500' :
                                                    'bg-blue-50 text-blue-500'
                                                }`}>
                                                    {notification.data?.icon || (notification.data?.type === 'review_replied' ? '💬' : '🔔')}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className={`text-sm font-bold truncate ${!notification.read_at ? 'text-slate-900' : 'text-slate-500'}`}>
                                                        {notification.data?.title || (notification.data?.type === 'review_replied' ? 'Phản hồi đánh giá' : 'Thông báo')}
                                                    </p>
                                                    {!notification.read_at && (
                                                        <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                                    {notification.data?.message}
                                                </p>
                                                <div className="flex items-center justify-between mt-3">
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: vi })}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>

                                        {/* Actions overlay */}
                                        <div className="absolute right-4 bottom-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            {!notification.read_at && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notification.id);
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-all bg-white shadow-sm border border-gray-100"
                                                >
                                                    <Check size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(notification.id);
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all bg-white shadow-sm border border-gray-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center">
                                <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bell size={32} className="text-gray-200" />
                                </div>
                                <p className="text-gray-400 text-sm font-medium">Không có thông báo nào mới</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-gray-50/50 text-center border-t border-gray-50">
                        <button className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-wider">
                            Xem tất cả thông báo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
