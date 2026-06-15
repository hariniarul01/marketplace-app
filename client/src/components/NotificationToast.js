import React, { useEffect, useState, useRef } from 'react';
import API from '../services/api';

function NotificationToast({ userId, onNotificationClick }) {
    const [showToast, setShowToast] = useState(false);
    const [currentNotification, setCurrentNotification] = useState(null);
    const processedNotifications = useRef(new Set());

    useEffect(() => {
        if (!userId) return;
        
        // Check for new notifications every 10 seconds (not 2 seconds)
        const interval = setInterval(fetchNewNotifications, 10000);
        fetchNewNotifications();
        
        return () => clearInterval(interval);
    }, [userId]);

    const fetchNewNotifications = async () => {
        try {
            const response = await API.get(`/chat/notifications/${userId}`);
            // Get only unread notifications
            const unreadNotifications = response.data.filter(n => !n.IsRead);
            
            // Check for new notifications (not shown before)
            for (const notification of unreadNotifications) {
                if (!processedNotifications.current.has(notification.NotificationID)) {
                    // Mark as processed
                    processedNotifications.current.add(notification.NotificationID);
                    
                    // Show popup
                    setCurrentNotification(notification);
                    setShowToast(true);
                    
                    // Auto hide after 5 seconds
                    setTimeout(() => {
                        setShowToast(false);
                    }, 5000);
                    
                    // Only show ONE popup at a time
                    break;
                }
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleClick = () => {
        if (currentNotification && onNotificationClick) {
            onNotificationClick(currentNotification);
        }
        setShowToast(false);
    };

    if (!showToast || !currentNotification) return null;

    return (
        <div 
            className="position-fixed bottom-0 end-0 p-3" 
            style={{ zIndex: 1050, cursor: 'pointer' }}
            onClick={handleClick}
        >
            <div className="toast show" role="alert" style={{ minWidth: '300px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                <div className="toast-header" style={{ background: 'linear-gradient(135deg, #8b6dd4 0%, #c9a5e0 100%)', color: 'white' }}>
                    <strong className="me-auto">📩 New Message</strong>
                    <small>Just now</small>
                    <button type="button" className="btn-close btn-close-white" onClick={(e) => {
                        e.stopPropagation();
                        setShowToast(false);
                    }}></button>
                </div>
                <div className="toast-body">
                    {currentNotification.Message}
                </div>
            </div>
        </div>
    );
}

export default NotificationToast;