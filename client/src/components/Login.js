import React, { useState } from 'react';
import API from '../services/api';
import 'bootstrap/dist/css/bootstrap.min.css';

function Login({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [userType, setUserType] = useState('Buyer');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const response = await API.post('/auth/login', { 
                Email: email, 
                Password: password 
            });
            
            if (response.data.user) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
                onLogin(response.data.user);
            } else {
                setError('Login failed: No user data received');
            }
        } catch (error) {
            console.error('Login error:', error);
            
            if (error.response) {
                setError(error.response.data?.message || `Server error: ${error.response.status}`);
            } else if (error.request) {
                setError('Cannot connect to server. Please make sure the backend is running.');
            } else {
                setError(`Error: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const response = await API.post('/auth/register', {
                FullName: fullName,
                Email: email,
                Password: password,
                PhoneNumber: phoneNumber,
                UserType: userType,
                Address: address
            });
            
            if (response.data.message) {
                alert('Registration successful! Please login.');
                setIsLogin(true);
                setFullName('');
                setEmail('');
                setPassword('');
                setPhoneNumber('');
                setAddress('');
                setUserType('Buyer');
            }
        } catch (error) {
            console.error('Signup error:', error);
            setError(error.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white text-center">
                            <h3>{isLogin ? '🔐 Login to Marketplace' : '📝 Create New Account'}</h3>
                        </div>
                        <div className="card-body">
                            {error && <div className="alert alert-danger">{error}</div>}
                            
                            <form onSubmit={isLogin ? handleLogin : handleSignup}>
                                {!isLogin && (
                                    <div className="mb-3">
                                        <label className="form-label">Full Name *</label>
                                        <input 
                                            type="text" 
                                            className="form-control"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required
                                        />
                                    </div>
                                )}
                                
                                <div className="mb-3">
                                    <label className="form-label">Email Address *</label>
                                    <input 
                                        type="email" 
                                        className="form-control"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                
                                <div className="mb-3">
                                    <label className="form-label">Password *</label>
                                    <input 
                                        type="password" 
                                        className="form-control"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                
                                {!isLogin && (
                                    <>
                                        <div className="mb-3">
                                            <label className="form-label">Phone Number</label>
                                            <input 
                                                type="tel" 
                                                className="form-control"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                            />
                                        </div>
                                        
                                        <div className="mb-3">
                                            <label className="form-label">User Type</label>
                                            <select 
                                                className="form-control"
                                                value={userType}
                                                onChange={(e) => setUserType(e.target.value)}
                                            >
                                                <option value="Buyer">Buyer (I want to buy)</option>
                                                <option value="Seller">Seller (I want to sell)</option>
                                                <option value="Both">Both (Buy & Sell)</option>
                                            </select>
                                        </div>
                                        
                                        <div className="mb-3">
                                            <label className="form-label">Address</label>
                                            <textarea 
                                                className="form-control"
                                                rows="2"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                placeholder="Your full address"
                                            />
                                        </div>
                                    </>
                                )}
                                
                                <button 
                                    type="submit" 
                                    className="btn btn-primary w-100"
                                    disabled={loading}
                                >
                                    {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
                                </button>
                            </form>
                            
                            <div className="text-center mt-3">
                                <button 
                                    className="btn btn-link"
                                    onClick={() => {
                                        setIsLogin(!isLogin);
                                        setError('');
                                    }}
                                >
                                    {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;