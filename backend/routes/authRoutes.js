const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/db');

// Login user
router.post('/login', async (req, res) => {
    try {
        const { Email, Password } = req.body;
        
        console.log('Login attempt for:', Email);
        
        if (!Email || !Password) {
            return res.status(400).json({ message: 'Email and Password are required' });
        }
        
        const pool = await poolPromise;
        
        // Use dbo.OLX_Users (plural - matches your database)
        const result = await pool.request()
            .input('Email', sql.NVarChar, Email)
            .query('SELECT * FROM dbo.OLX_Users WHERE Email = @Email');
        
        console.log('Query result rows:', result.recordset.length);
        
        if (result.recordset.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        const user = result.recordset[0];
        console.log('User found:', user.FullName);
        
        // Check password (plain text comparison for demo)
        if (Password === user.PasswordHash) {
            res.json({
                message: 'Login successful',
                user: {
                    id: user.UserID,
                    name: user.FullName,
                    email: user.Email,
                    type: user.UserType
                }
            });
        } else {
            console.log(`Password mismatch: provided ${Password}, expected ${user.PasswordHash}`);
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error details:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { FullName, Email, Password, PhoneNumber, UserType, Address } = req.body;
        
        console.log('Registration attempt for:', Email);
        
        if (!FullName || !Email || !Password) {
            return res.status(400).json({ message: 'FullName, Email and Password are required' });
        }
        
        const pool = await poolPromise;
        
        // Check if user already exists in OLX_Users table
        const checkUser = await pool.request()
            .input('Email', sql.NVarChar, Email)
            .query('SELECT * FROM dbo.OLX_Users WHERE Email = @Email');
        
        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }
        
        // Insert new user
        await pool.request()
            .input('FullName', sql.NVarChar, FullName)
            .input('Email', sql.NVarChar, Email)
            .input('PasswordHash', sql.NVarChar, Password)
            .input('PhoneNumber', sql.NVarChar, PhoneNumber || '')
            .input('UserType', sql.NVarChar, UserType || 'Buyer')
            .input('Address', sql.NVarChar, Address || '')
            .input('IsActive', sql.Bit, 1)
            .query(`
                INSERT INTO dbo.OLX_Users (FullName, Email, PasswordHash, PhoneNumber, UserType, Address, IsActive, CreatedAt)
                VALUES (@FullName, @Email, @PasswordHash, @PhoneNumber, @UserType, @Address, @IsActive, GETDATE())
            `);
        
        console.log('User registered successfully:', Email);
        res.status(201).json({ message: 'User registered successfully! Please login.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Get all users (for testing)
router.get('/users', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT UserID, FullName, Email, UserType, PhoneNumber, Address FROM dbo.OLX_Users');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

module.exports = router;