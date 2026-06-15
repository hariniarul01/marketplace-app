import React, { useEffect, useState } from 'react';
import API from './services/api';
import Login from './components/Login';
import ProductDetail from './components/ProductDetail';
import MyOrders from './components/MyOrders';
import Chat from './components/Chat';
import Wishlist from './components/Wishlist';
import NotificationToast from './components/NotificationToast';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [user, setUser] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showOrders, setShowOrders] = useState(false);
    const [showConversations, setShowConversations] = useState(false);
    const [showWishlist, setShowWishlist] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedProductForImage, setSelectedProductForImage] = useState(null);
    const [uploadImage, setUploadImage] = useState(null);
    const [uploadPreview, setUploadPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [showAuthPage, setShowAuthPage] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [wishlist, setWishlist] = useState([]);
    
    // Price filter states
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    
    const [newProduct, setNewProduct] = useState({
        ProductName: '',
        Description: '',
        Price: '',
        Category: '',
        Condition: 'Good',
        Location: '',
        images: [],
        imagePreviews: [],
        video: null,
        videoPreview: null
    });

    // Horizontal Categories List
    const categoryList = [
        { name: 'Mobiles', icon: '📱', value: 'Mobiles' },
        { name: 'Cars', icon: '🚗', value: 'Cars' },
        { name: 'Bikes', icon: '🏍️', value: 'Bikes' },
        { name: 'Properties', icon: '🏠', value: 'Properties' },
        { name: 'Electronics', icon: '💻', value: 'Electronics' },
        { name: 'Furniture', icon: '🛋️', value: 'Furniture' },
        { name: 'Fashion', icon: '👕', value: 'Fashion' },
        { name: 'Books & Sports', icon: '📚', value: 'Books & Sports' },
        { name: 'Pets', icon: '🐕', value: 'Pets' },
        { name: 'Services', icon: '🛠️', value: 'Services' }
    ];

    // Load wishlist from localStorage on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        const savedWishlist = localStorage.getItem('wishlist');
        if (savedWishlist) {
            setWishlist(JSON.parse(savedWishlist));
        }
        fetchProducts();
    }, []);

    // Save wishlist to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }, [wishlist]);

    useEffect(() => {
        if (user) {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    // Updated fetchProducts with price filter support
    const fetchProducts = async () => {
        try {
            const params = new URLSearchParams();
            
            if (searchTerm) {
                params.append('search', searchTerm);
            }
            if (selectedCategory && selectedCategory !== '') {
                params.append('category', selectedCategory);
            }
            if (minPrice && minPrice !== '') {
                params.append('minPrice', minPrice);
            }
            if (maxPrice && maxPrice !== '') {
                params.append('maxPrice', maxPrice);
            }
            
            const url = `/products${params.toString() ? `?${params.toString()}` : ''}`;
            console.log('Fetching products with filters:', url);
            
            const response = await API.get(url);
            setProducts(response.data);
            const uniqueCategories = [...new Set(response.data.map(p => p.Category).filter(c => c))];
            setCategories(uniqueCategories);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching products:', error);
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        if (!user) return;
        try {
            const response = await API.get(`/chat/unread/${user.id}`);
            setUnreadMessageCount(response.data.unreadCount);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const fetchConversations = async () => {
        if (!user) return;
        try {
            const response = await API.get(`/chat/conversations/${user.id}`);
            setConversations(response.data);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    // Apply price filter
    const applyPriceFilter = () => {
        if (minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice)) {
            alert('Min price cannot be greater than max price');
            return;
        }
        fetchProducts();
    };

    // Clear all filters
    const clearAllFilters = () => {
        setSearchTerm('');
        setSelectedCategory('');
        setMinPrice('');
        setMaxPrice('');
        fetchProducts();
    };

    // Quick price range buttons
    const setPriceRange = (min, max) => {
        setMinPrice(min);
        setMaxPrice(max);
        setTimeout(fetchProducts, 100);
    };

    const filteredProducts = products; // Price filter is now done on backend

    const handleCategoryClick = (categoryValue) => {
        setSelectedCategory(categoryValue);
        setSearchTerm('');
        setMinPrice('');
        setMaxPrice('');
        fetchProducts();
    };

    const handleLogoClick = () => {
        setSelectedCategory('');
        setSearchTerm('');
        setMinPrice('');
        setMaxPrice('');
        fetchProducts();
    };

    const toggleWishlist = (productId) => {
        if (wishlist.includes(productId)) {
            setWishlist(wishlist.filter(id => id !== productId));
        } else {
            setWishlist([...wishlist, productId]);
        }
    };

    const handleViewWishlist = () => {
        if (!user) {
            setPendingAction('wishlist');
            setShowAuthPage(true);
            return;
        }
        setShowWishlist(true);
        setShowOrders(false);
        setShowConversations(false);
        setSelectedProduct(null);
        setSelectedConversation(null);
    };

    const handleBackToList = () => {
        setSelectedProduct(null);
        setShowOrders(false);
        setShowConversations(false);
        setShowWishlist(false);
        setSelectedConversation(null);
    };

    // Handle multiple images selection
    const handleMultipleImages = (e) => {
        const files = Array.from(e.target.files);
        console.log('Selected files:', files.length);
        
        const validFiles = [];
        const validPreviews = [];
        
        for (const file of files) {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                alert(`Skip ${file.name}: Only images allowed`);
                continue;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert(`Skip ${file.name}: Max size 5MB`);
                continue;
            }
            validFiles.push(file);
            validPreviews.push(URL.createObjectURL(file));
        }
        
        setNewProduct(prev => ({
            ...prev,
            images: [...prev.images, ...validFiles],
            imagePreviews: [...prev.imagePreviews, ...validPreviews]
        }));
    };

    // Remove image from list
    const removeImage = (index) => {
        const updatedImages = [...newProduct.images];
        const updatedPreviews = [...newProduct.imagePreviews];
        updatedImages.splice(index, 1);
        updatedPreviews.splice(index, 1);
        setNewProduct({
            ...newProduct,
            images: updatedImages,
            imagePreviews: updatedPreviews
        });
    };

    // Handle video selection
    const handleVideo = (e) => {
        const file = e.target.files[0];
        if (file) {
            const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
            if (!allowedTypes.includes(file.type)) {
                alert('Only MP4, WebM, MOV videos allowed');
                return;
            }
            if (file.size > 30 * 1024 * 1024) {
                alert('Video too large. Max 30MB');
                return;
            }
            setNewProduct({
                ...newProduct,
                video: file,
                videoPreview: URL.createObjectURL(file)
            });
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        if (!user) {
            setPendingAction('addProduct');
            setShowAuthPage(true);
            return;
        }
        if (!newProduct.ProductName || !newProduct.Price) {
            alert('Product Name and Price are required!');
            return;
        }
        
        const formData = new FormData();
        formData.append('SellerID', user?.id || 1);
        formData.append('ProductName', newProduct.ProductName);
        formData.append('Description', newProduct.Description || '');
        formData.append('Price', parseFloat(newProduct.Price));
        formData.append('Category', newProduct.Category || 'Other');
        formData.append('Condition', newProduct.Condition);
        formData.append('Location', newProduct.Location || '');
        
        // Add multiple images - field name must be 'images'
        if (newProduct.images && newProduct.images.length > 0) {
            for (const image of newProduct.images) {
                formData.append('images', image);
            }
        }
        
        // Add video
        if (newProduct.video) {
            formData.append('video', newProduct.video);
        }
        
        try {
            console.log('Sending form data with', newProduct.images.length, 'images');
            const response = await API.post('/products/media', formData, { 
                headers: { 'Content-Type': 'multipart/form-data' }, 
                timeout: 120000 
            });
            console.log('Response:', response.data);
            alert('Product added successfully!');
            fetchProducts();
            setShowForm(false);
            setNewProduct({ 
                ProductName: '', 
                Description: '', 
                Price: '', 
                Category: '', 
                Condition: 'Good', 
                Location: '', 
                images: [], 
                imagePreviews: [], 
                video: null, 
                videoPreview: null 
            });
        } catch (error) {
            console.error('Error adding product:', error);
            if (error.response) {
                alert('Failed to add product: ' + (error.response.data?.message || error.response.statusText));
            } else if (error.request) {
                alert('No response from server. Please check if backend is running on port 5000');
            } else {
                alert('Failed to add product: ' + error.message);
            }
        }
    };

    const handleImageUploadClick = (product) => {
        if (!user) { setPendingAction('uploadImage'); setShowAuthPage(true); return; }
        setSelectedProductForImage(product);
        setShowImageModal(true);
        setUploadImage(null);
        setUploadPreview(null);
    };

    const handleImageFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) { alert('Only images are allowed (JPEG, PNG, GIF, WEBP)'); return; }
            if (file.size > 5 * 1024 * 1024) { alert('File too large. Max size is 5MB'); return; }
            setUploadImage(file);
            setUploadPreview(URL.createObjectURL(file));
        }
    };

    const handleUploadImage = async () => {
        if (!uploadImage) { alert('Please select an image'); return; }
        setUploading(true);
        const formData = new FormData();
        formData.append('image', uploadImage);
        try {
            await API.post(`/products/${selectedProductForImage.ProductID}/upload-image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            alert('Image uploaded successfully!');
            fetchProducts();
            setShowImageModal(false);
            setUploadImage(null);
            setUploadPreview(null);
        } catch (error) { console.error('Error uploading image:', error); alert('Failed to upload image'); }
        finally { setUploading(false); }
    };

    const handleDelete = async (id) => {
        if (!user) { setPendingAction('delete'); setShowAuthPage(true); return; }
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await API.delete(`/products/${id}`);
                alert('Product deleted successfully!');
                fetchProducts();
            } catch (error) { console.error('Error deleting product:', error); alert('Failed to delete product'); }
        }
    };

    const handleLoginSuccess = (userData) => {
        setUser(userData);
        setShowAuthPage(false);
        if (pendingAction) setPendingAction(null);
        fetchProducts();
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        setSelectedProduct(null);
        setShowOrders(false);
        setShowConversations(false);
        setShowWishlist(false);
        setSelectedConversation(null);
    };

    const handleProductClick = (product) => {
        setSelectedProduct(product);
        setShowOrders(false);
        setShowConversations(false);
        setShowWishlist(false);
    };

    const handleViewOrders = () => {
        if (!user) { setPendingAction('orders'); setShowAuthPage(true); return; }
        setShowOrders(true);
        setSelectedProduct(null);
        setShowConversations(false);
        setShowWishlist(false);
        setSelectedConversation(null);
    };

    const handleViewMessages = async () => {
        if (!user) { setPendingAction('messages'); setShowAuthPage(true); return; }
        await fetchConversations();
        setShowConversations(true);
        setShowOrders(false);
        setShowWishlist(false);
        setSelectedProduct(null);
        setSelectedConversation(null);
    };

    const handleOpenConversation = (conversation) => {
        setSelectedConversation(conversation);
        markConversationAsRead(conversation.ConversationID);
    };

    const markConversationAsRead = async (conversationId) => {
        if (!user) return;
        try {
            const response = await API.put(`/chat/read/${conversationId}/${user.id}`);
            setConversations(prev => prev.map(conv => conv.ConversationID === conversationId ? { ...conv, UnreadCount: 0 } : conv));
            if (response.data.totalUnreadCount !== undefined) setUnreadMessageCount(response.data.totalUnreadCount);
            else await fetchUnreadCount();
        } catch (error) { console.error('Error marking conversation as read:', error); }
    };

    const handleMessageRead = async (newTotalUnread) => {
        setUnreadMessageCount(newTotalUnread);
        await fetchConversations();
    };

    const handleNotificationClick = (notification) => {
        if (!user) { setShowAuthPage(true); return; }
        if (notification.RelatedID) {
            handleViewMessages();
            setTimeout(() => {
                const conversation = conversations.find(c => c.ConversationID === notification.RelatedID);
                if (conversation) setSelectedConversation(conversation);
            }, 500);
        }
    };

    // If login page is requested, show Login component
    if (showAuthPage) {
        return <Login onLogin={handleLoginSuccess} />;
    }

    if (selectedProduct) {
        return <ProductDetail product={selectedProduct} onBack={handleBackToList} userId={user?.id} />;
    }

    if (showOrders && user) {
        return <MyOrders userId={user.id} onBack={handleBackToList} />;
    }

    if (showConversations && user) {
        return (
            <div className="container mt-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 style={{ color: '#2c3e50' }}>💬 Messages</h1>
                    <button className="btn btn-secondary" onClick={handleBackToList}>← Back to Marketplace</button>
                </div>
                {conversations.length === 0 ? (
                    <div className="alert alert-info text-center">No conversations yet. Start chatting with sellers from product pages!</div>
                ) : (
                    <div className="row">
                        <div className="col-md-4">
                            <div className="list-group">
                                {conversations.map(conv => (
                                    <button key={conv.ConversationID}
                                        className={`list-group-item list-group-item-action ${selectedConversation?.ConversationID === conv.ConversationID ? 'active' : ''}`}
                                        onClick={() => handleOpenConversation(conv)}
                                        style={{ backgroundColor: '#8b6dd4', border: '1px solid #a17ac9', borderRadius: '12px', marginBottom: '8px', color: 'white', textAlign: 'left' }}>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div><strong>{conv.OtherUserName}</strong><div className="small">{conv.ProductName}</div><div className="small text-muted">{conv.LastMessage?.substring(0, 50)}</div></div>
                                            <div className="text-end"><div className="small">{conv.LastMessageTime && new Date(conv.LastMessageTime).toLocaleDateString()}</div>{conv.UnreadCount > 0 && <span className="badge bg-danger rounded-pill">{conv.UnreadCount}</span>}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="col-md-8">
                            {selectedConversation ? (
                                <Chat key={selectedConversation.ConversationID}
                                    product={{ ProductID: selectedConversation.ProductID, ProductName: selectedConversation.ProductName, SellerID: selectedConversation.SellerID, BuyerID: selectedConversation.BuyerID, SellerName: selectedConversation.OtherUserName }}
                                    userId={user.id} onClose={() => setSelectedConversation(null)} isModal={false}
                                    onMessageRead={handleMessageRead} conversationId={selectedConversation.ConversationID} />
                            ) : (
                                <div className="card"><div className="card-body text-center text-muted">Select a conversation to start messaging</div></div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (showWishlist && user) {
        return <Wishlist wishlistItems={wishlist} products={products} onRemoveFromWishlist={toggleWishlist} onBack={handleBackToList} />;
    }

    if (loading) {
        return (
            <div className="text-center mt-5">
                <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                <p className="mt-2">Loading products...</p>
            </div>
        );
    }

    // Main Home Page - No Login Required
    return (
        <div className="container mt-4">
            {/* Image Upload Modal */}
            {showImageModal && selectedProductForImage && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header"><h5 className="modal-title">Upload Photo for {selectedProductForImage.ProductName}</h5><button type="button" className="btn-close" onClick={() => setShowImageModal(false)}></button></div>
                            <div className="modal-body">
                                {selectedProductForImage.ImageUrl && (<div className="mb-3 text-center"><img src={selectedProductForImage.ImageUrl} alt="Current" style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px' }} /><p className="mt-2 text-muted">Current Image</p></div>)}
                                <div className="mb-3"><label className="form-label">Select New Image</label><input type="file" className="form-control" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleImageFileChange} /></div>
                                {uploadPreview && (<div className="text-center"><img src={uploadPreview} alt="Preview" style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px' }} /><p className="mt-2 text-muted">New Image Preview</p></div>)}
                            </div>
                            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowImageModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleUploadImage} disabled={uploading}>{uploading ? 'Uploading...' : 'Upload Photo'}</button></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
                <div className="d-flex align-items-center">
                    <h1 style={{ color: '#2c3e50', cursor: 'pointer', marginBottom: 0, marginRight: '20px' }} onClick={handleLogoClick}>🛍️ Marketplace</h1>
                </div>
                <div className="flex-grow-1 mx-3">
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="🔍 Search products by name..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && fetchProducts()}
                        style={{ borderRadius: '25px', padding: '10px 20px' }} 
                    />
                </div>
                <div>
                    {user ? (
                        <div className="d-flex gap-3 align-items-center">
                            <button className="btn btn-success btn-sm" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Sell'}</button>
                            <div className="text-center"><button className="btn btn-outline-warning btn-sm position-relative" onClick={handleViewMessages}>💬{unreadMessageCount > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">{unreadMessageCount}</span>}</button><div style={{ fontSize: '12px', marginTop: '4px' }}>Messages</div></div>
                            <div className="text-center"><button className="btn btn-outline-info btn-sm" onClick={handleViewOrders}>📦</button><div style={{ fontSize: '12px', marginTop: '4px' }}>Orders</div></div>
                            <div className="text-center position-relative">
                                <button className="btn btn-outline-danger btn-sm" onClick={handleViewWishlist}>❤️</button>
                                {wishlist.length > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">{wishlist.length}</span>}
                                <div style={{ fontSize: '12px', marginTop: '4px' }}>Wishlist</div>
                            </div>
                            <div className="dropdown">
                                <button className="btn btn-outline-secondary btn-sm dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">👤 {user.name?.split(' ')[0]}</button>
                                <ul className="dropdown-menu dropdown-menu-end"><li><button className="dropdown-item" onClick={handleLogout}>🚪 Logout</button></li></ul>
                            </div>
                        </div>
                    ) : (
                        <button className="btn btn-primary btn-sm" onClick={() => setShowAuthPage(true)}>Login / Register</button>
                    )}
                </div>
            </div>

            {/* Horizontal Categories */}
            <div className="categories-wrapper mb-4" style={{ overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '10px' }}>
                {categoryList.map((cat, idx) => (
                    <button key={idx} onClick={() => handleCategoryClick(cat.value)} className={`btn me-2 ${selectedCategory === cat.value ? 'btn-primary' : 'btn-outline-secondary'}`} style={{ borderRadius: '25px', padding: '8px 20px' }}><span style={{ marginRight: '5px' }}>{cat.icon}</span> {cat.name}</button>
                ))}
            </div>

            {/* Search and Filter Section with Price Range */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row mb-3">
                        <div className="col-md-12">
                            <button className="btn btn-secondary w-100" onClick={clearAllFilters}>
                                Clear All Filters
                            </button>
                        </div>
                    </div>
                    
                    {/* Price Filter Section */}
                    <div className="row">
                        <div className="col-md-12">
                            <div className="d-flex align-items-center flex-wrap gap-3">
                                <span className="fw-bold">💰 Price Range:</span>
                                <div className="d-flex align-items-center gap-2">
                                    <span>₹</span>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        placeholder="Min"
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(e.target.value)}
                                        style={{ width: '120px' }}
                                    />
                                    <span>-</span>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        placeholder="Max"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(e.target.value)}
                                        style={{ width: '120px' }}
                                    />
                                    <button className="btn btn-primary btn-sm" onClick={applyPriceFilter}>
                                        Apply
                                    </button>
                                </div>
                                
                                {/* Quick Price Ranges */}
                                <div className="d-flex gap-2 ms-3 flex-wrap">
                                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setPriceRange('0', '10000')}>
                                        Under ₹10K
                                    </button>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setPriceRange('10000', '25000')}>
                                        ₹10K - ₹25K
                                    </button>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setPriceRange('25000', '50000')}>
                                        ₹25K - ₹50K
                                    </button>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setPriceRange('50000', '100000')}>
                                        ₹50K - ₹1L
                                    </button>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setPriceRange('100000', '')}>
                                        Above ₹1L
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Active Filters Display */}
                    {(searchTerm || selectedCategory || minPrice || maxPrice) && (
                        <div className="row mt-3">
                            <div className="col-md-12">
                                <div className="d-flex flex-wrap gap-2 align-items-center">
                                    <span className="text-muted">Active Filters:</span>
                                    {searchTerm && (
                                        <span className="badge bg-primary">
                                            Search: {searchTerm}
                                            <button className="btn-close btn-close-white ms-1" style={{ fontSize: '8px' }} onClick={() => {
                                                setSearchTerm('');
                                                fetchProducts();
                                            }}></button>
                                        </span>
                                    )}
                                    {selectedCategory && (
                                        <span className="badge bg-primary">
                                            Category: {selectedCategory}
                                            <button className="btn-close btn-close-white ms-1" style={{ fontSize: '8px' }} onClick={() => {
                                                setSelectedCategory('');
                                                fetchProducts();
                                            }}></button>
                                        </span>
                                    )}
                                    {(minPrice || maxPrice) && (
                                        <span className="badge bg-primary">
                                            Price: {minPrice || '0'} - {maxPrice || '∞'}
                                            <button className="btn-close btn-close-white ms-1" style={{ fontSize: '8px' }} onClick={() => {
                                                setMinPrice('');
                                                setMaxPrice('');
                                                fetchProducts();
                                            }}></button>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Product Form (only for logged in) */}
            {showForm && user && (
                <div className="card mb-4">
                    <div className="card-header bg-primary text-white"><h5 className="mb-0">List New Product</h5></div>
                    <div className="card-body">
                        <form onSubmit={handleAddProduct}>
                            <div className="row">
                                <div className="col-md-6 mb-3"><label className="form-label">Product Name *</label><input type="text" className="form-control" value={newProduct.ProductName} onChange={(e) => setNewProduct({...newProduct, ProductName: e.target.value})} required /></div>
                                <div className="col-md-6 mb-3"><label className="form-label">Price *</label><input type="number" className="form-control" value={newProduct.Price} onChange={(e) => setNewProduct({...newProduct, Price: e.target.value})} required /></div>
                                <div className="col-md-6 mb-3"><label className="form-label">Category</label><input type="text" className="form-control" placeholder="e.g., Electronics, Furniture" value={newProduct.Category} onChange={(e) => setNewProduct({...newProduct, Category: e.target.value})} /></div>
                                <div className="col-md-6 mb-3"><label className="form-label">Condition</label><select className="form-control" value={newProduct.Condition} onChange={(e) => setNewProduct({...newProduct, Condition: e.target.value})}><option value="New">New</option><option value="Like New">Like New</option><option value="Good">Good</option><option value="Fair">Fair</option></select></div>
                                <div className="col-md-12 mb-3"><label className="form-label">Location</label><input type="text" className="form-control" placeholder="City, State" value={newProduct.Location} onChange={(e) => setNewProduct({...newProduct, Location: e.target.value})} /></div>
                                <div className="col-12 mb-3"><label className="form-label">Description</label><textarea className="form-control" rows="3" value={newProduct.Description} onChange={(e) => setNewProduct({...newProduct, Description: e.target.value})} /></div>
                                
                                {/* Multiple Images Upload */}
                                <div className="col-12 mb-3">
                                    <label className="form-label">Product Images (Max 10 images)</label>
                                    <input 
                                        type="file" 
                                        className="form-control"
                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                        multiple
                                        onChange={handleMultipleImages}
                                        name="images"
                                    />
                                    <small className="text-muted">You can select up to 10 images. Max 5MB each.</small>
                                    
                                    {/* Image Previews Grid */}
                                    {newProduct.imagePreviews.length > 0 && (
                                        <div className="mt-2 d-flex flex-wrap gap-2">
                                            {newProduct.imagePreviews.map((preview, idx) => (
                                                <div key={idx} className="position-relative">
                                                    <img 
                                                        src={preview} 
                                                        alt={`Preview ${idx + 1}`}
                                                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }}
                                                    />
                                                    <button 
                                                        type="button"
                                                        className="btn btn-sm btn-danger position-absolute top-0 end-0"
                                                        style={{ borderRadius: '50%', padding: '0 5px', fontSize: '12px' }}
                                                        onClick={() => removeImage(idx)}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Video Upload */}
                                <div className="col-12 mb-3">
                                    <label className="form-label">Product Video (Optional, Max 30 sec)</label>
                                    <input 
                                        type="file" 
                                        className="form-control"
                                        accept="video/mp4,video/webm,video/quicktime"
                                        onChange={handleVideo}
                                    />
                                    <small className="text-muted">MP4, WebM, MOV format. Max 30MB.</small>
                                    
                                    {newProduct.videoPreview && (
                                        <div className="mt-2">
                                            <video controls style={{ width: '200px', maxHeight: '150px' }}>
                                                <source src={newProduct.videoPreview} type={newProduct.video?.type} />
                                            </video>
                                            <button 
                                                type="button"
                                                className="btn btn-sm btn-danger ms-2"
                                                onClick={() => setNewProduct({...newProduct, video: null, videoPreview: null})}
                                            >
                                                Remove Video
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="col-12"><button type="submit" className="btn btn-primary">Save Product</button></div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
                <div className="alert alert-info text-center">No products found. Try a different search or category!</div>
            ) : (
                <div className="row">
                    {filteredProducts.map((product) => {
                        const isInWishlist = wishlist.includes(product.ProductID);
                        const images = product.Images ? product.Images.split(',') : [];
                        const firstImage = images[0];
                        const displayImage = firstImage ? `http://localhost:5000/uploads/${firstImage}` : (product.ImageUrl || null);
                        
                        return (
                            <div className="col-md-4 mb-4" key={product.ProductID}>
                                <div className="card h-100 shadow-sm">
                                    {displayImage ? (
                                        <img 
                                            src={displayImage} 
                                            className="card-img-top" 
                                            alt={product.ProductName}
                                            style={{ height: '200px', objectFit: 'cover', cursor: 'pointer' }}
                                            onClick={() => handleProductClick(product)}
                                            onError={(e) => e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'}
                                        />
                                    ) : (
                                        <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: '200px', cursor: 'pointer' }} onClick={() => handleProductClick(product)}>
                                            <span className="text-muted">No Image</span>
                                        </div>
                                    )}
                                    
                                    {images.length > 1 && (
                                        <div className="position-absolute top-0 end-0 m-2">
                                            <span className="badge bg-primary">+{images.length - 1} more</span>
                                        </div>
                                    )}
                                    
                                    {product.VideoUrl && (
                                        <div className="position-absolute bottom-0 end-0 m-2">
                                            <span className="badge bg-danger">📹 Video</span>
                                        </div>
                                    )}
                                    
                                    <div className="card-body">
                                        <h5 className="card-title text-primary" style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => handleProductClick(product)}>
                                            {product.ProductName}
                                        </h5>
                                        
                                        <p className="card-text text-muted">
                                            {product.Description?.substring(0, 80)}
                                            {product.Description?.length > 80 ? '...' : ''}
                                        </p>
                                        
                                        <h4 className="text-success">₹{product.Price?.toLocaleString()}</h4>
                                        
                                        <div className="mt-2">
                                            {product.AvgRating > 0 ? (
                                                <div className="d-flex align-items-center">
                                                    <span className="text-warning" style={{ fontSize: '16px' }}>★</span>
                                                    <span className="ms-1 fw-bold">{Number(product.AvgRating).toFixed(1)}</span>
                                                    <span className="text-muted ms-1">({product.ReviewCount || 0} {product.ReviewCount === 1 ? 'review' : 'reviews'})</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted" style={{ fontSize: '13px' }}>No reviews yet</span>
                                            )}
                                        </div>
                                        
                                        <div className="mt-2">
                                            {product.Category && <span className="badge bg-secondary me-1">{product.Category}</span>}
                                            {product.Condition && <span className="badge bg-info">{product.Condition}</span>}
                                        </div>
                                        
                                        <p className="mt-2 mb-0">
                                            <small className="text-muted">
                                                📍 {product.Location || 'Location not specified'} | 👁️ {product.ViewCount || 0} views
                                            </small>
                                        </p>
                                        
                                        <div className="mt-3 d-flex gap-2">
                                            <button className={`btn btn-sm ${isInWishlist ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => toggleWishlist(product.ProductID)}>
                                                {isInWishlist ? '❤️' : '🤍'} Wishlist
                                            </button>
                                            {user && (user?.type === 'Seller' || user?.type === 'Both' || user?.type === 'Admin') && (
                                                <button className="btn btn-warning btn-sm flex-grow-1" onClick={() => handleImageUploadClick(product)}>
                                                    📷 Upload Photo
                                                </button>
                                            )}
                                            {user && (
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(product.ProductID)}>
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Notification Toast */}
            {user && <NotificationToast userId={user.id} onNotificationClick={handleNotificationClick} />}
        </div>
    );
}

export default App;