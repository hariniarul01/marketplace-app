import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';

function Chat({ product, userId, onClose, isModal = true, onMessageRead, conversationId: propConversationId }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [conversationId, setConversationId] = useState(propConversationId || null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const otherUserId = product.SellerID === userId ? product.BuyerID : product.SellerID;
    const otherUserName = product.SellerName || (product.SellerID === userId ? 'Buyer' : 'Seller');

    // Reset state when product changes
    useEffect(() => {
        setConversationId(propConversationId || null);
        setMessages([]);
        setLoading(true);
        initializeChat();
        
        const interval = setInterval(() => {
            if (conversationId) {
                fetchMessages();
            }
        }, 3000);
        
        return () => clearInterval(interval);
    }, [product.ProductID]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const initializeChat = async () => {
        try {
            let convId = conversationId;
            
            if (!convId) {
                const response = await API.post('/chat/conversation', {
                    productId: product.ProductID,
                    buyerId: userId === product.SellerID ? (product.BuyerID || userId) : userId,
                    sellerId: product.SellerID
                });
                convId = response.data.conversationId;
                setConversationId(convId);
            }
            
            await fetchMessages(convId);
            await handleMarkAsRead(convId);
            setLoading(false);
        } catch (error) {
            console.error('Error initializing chat:', error);
            setLoading(false);
        }
    };

    const fetchMessages = async (convId = conversationId) => {
        if (!convId) return;
        try {
            const response = await API.get(`/chat/messages/${convId}?userId=${userId}`);
            setMessages(response.data.messages);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleMarkAsRead = async (convId = conversationId) => {
        if (!convId) return;
        try {
            const response = await API.put(`/chat/read/${convId}/${userId}`);
            if (onMessageRead) {
                onMessageRead(response.data.totalUnreadCount);
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;
        
        setSending(true);
        try {
            await API.post('/chat/send', {
                conversationId,
                senderId: userId,
                receiverId: otherUserId,
                message: newMessage
            });
            
            await fetchMessages();
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center p-3">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p>Loading conversation...</p>
            </div>
        );
    }

    const chatContent = (
        <>
            <div className="chat-header border-bottom pb-2 mb-3">
                <h6 className="mb-0">💬 Chat with {otherUserName} about {product.ProductName}</h6>
            </div>
            <div className="chat-messages" style={{ height: '350px', overflowY: 'auto', marginBottom: '15px' }}>
                {messages.length === 0 ? (
                    <div className="text-center text-muted">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.MessageID}
                            className={`d-flex mb-3 ${msg.SenderID === userId ? 'justify-content-end' : 'justify-content-start'}`}
                        >
                            <div
                                className={`p-3 rounded ${msg.SenderID === userId ? 'bg-primary text-white' : 'bg-white border'}`}
                                style={{ maxWidth: '70%', borderRadius: '18px' }}
                            >
                                <small className={msg.SenderID === userId ? 'text-white-50' : 'text-muted'}>
                                    {msg.SenderName}
                                </small>
                                <p className="mb-0">{msg.Message}</p>
                                <small className={msg.SenderID === userId ? 'text-white-50' : 'text-muted'}>
                                    {new Date(msg.CreatedAt).toLocaleTimeString()}
                                </small>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="d-flex gap-2">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending}
                />
                <button type="submit" className="btn btn-primary" disabled={sending}>
                    {sending ? 'Sending...' : 'Send'}
                </button>
            </form>
        </>
    );

    if (!isModal) {
        return <div className="card p-3">{chatContent}</div>;
    }

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">💬 Chat</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        {chatContent}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Chat;