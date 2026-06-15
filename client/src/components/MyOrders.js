import React, { useEffect, useState } from 'react';
import API from '../services/api';

function MyOrders({ userId, onBack }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await API.get(`/orders/user/${userId}`);
            setOrders(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setLoading(false);
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (window.confirm('Are you sure you want to cancel this order?')) {
            try {
                await API.patch(`/orders/${orderId}/cancel`);
                alert('Order cancelled successfully!');
                fetchOrders(); // Refresh orders
            } catch (error) {
                console.error('Error cancelling order:', error);
                alert(error.response?.data?.message || 'Failed to cancel order');
            }
        }
    };

    if (loading) {
        return (
            <div className="text-center mt-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p>Loading your orders...</p>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <button className="btn btn-secondary mb-4" onClick={onBack}>
                ← Back to Products
            </button>
            
            <h2 className="mb-4">📦 My Orders</h2>
            
            {orders.length === 0 ? (
                <div className="alert alert-info">No orders yet.</div>
            ) : (
                orders.map((order) => (
                    <div className="card mb-3 shadow-sm" key={order.OrderID}>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-8">
                                    <h5>Order #{order.OrderID}</h5>
                                    <p className="mb-1">📅 Date: {new Date(order.OrderDate).toLocaleDateString()}</p>
                                    <p className="mb-1">💰 Total: ₹{order.TotalAmount?.toLocaleString()}</p>
                                    <p className="mb-1">💳 Payment: {order.PaymentStatus}</p>
                                    <p className="mb-1">📦 Items: {order.ItemCount}</p>
                                    <p className="mb-0">📍 Shipping: {order.ShippingAddress}</p>
                                </div>
                                <div className="col-md-4 text-end">
                                    <span className={`badge ${order.OrderStatus === 'Cancelled' ? 'bg-danger' : order.OrderStatus === 'Delivered' ? 'bg-success' : 'bg-warning'} fs-6 p-2`}>
                                        {order.OrderStatus}
                                    </span>
                                    
                                    {order.OrderStatus === 'Processing' && (
                                        <button 
                                            className="btn btn-danger btn-sm mt-3 d-block w-100"
                                            onClick={() => handleCancelOrder(order.OrderID)}
                                        >
                                            Cancel Order
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

export default MyOrders;