import bcrypt from 'bcrypt';
import { dbManager } from '../db.js';
import { generateToken } from '../middleware/auth.js';

const SALT_ROUNDS = 10;

// Authentication always uses Company 1's database (central user store)
const AUTH_DB_ID = 1;


/**
 * Register a new user
 */
export async function registerUser(req, res) {
    const { username, email, password, full_name, role = 'viewer' } = req.body;

    // Validation
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const client = await dbManager.getPool(AUTH_DB_ID).getConnection();

    try {
        await client.beginTransaction();

        // Check if user already exists
        const [existing] = await client.query(
            'SELECT user_id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existing.length > 0) {
            await client.rollback();
            return res.status(409).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

        // Insert user
        const [result] = await client.query(
            `INSERT INTO users (username, email, password_hash, full_name, role, is_active)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
            [username, email, password_hash, full_name, role]
        );

        await client.commit();

        return res.status(201).json({
            success: true,
            user: {
                user_id: result.insertId,
                username,
                email,
                full_name,
                role
            }
        });

    } catch (error) {
        await client.rollback();
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
}

/**
 * Login user
 */
export async function loginUser(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const client = await dbManager.getPool(AUTH_DB_ID).getConnection();

    try {
        await client.beginTransaction();

        // Get user
        const [users] = await client.query(
            `SELECT user_id, username, email, password_hash, full_name, role, is_active
       FROM users
       WHERE username = ? OR email = ?`,
            [username, username]
        );

        if (users.length === 0) {
            await client.rollback();
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // Check if account is active
        if (!user.is_active) {
            await client.rollback();
            return res.status(403).json({ error: 'Account is disabled' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            await client.rollback();
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = generateToken(user);

        // Update last login
        await client.query(
            'UPDATE users SET last_login = NOW() WHERE user_id = ?',
            [user.user_id]
        );

        // Store session
        const ip_address = req.ip || req.connection.remoteAddress;
        const user_agent = req.headers['user-agent'];
        const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await client.query(
            `INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
            [user.user_id, token, ip_address, user_agent, expires_at]
        );

        await client.commit();

        return res.status(200).json({
            success: true,
            token,
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        });

    } catch (error) {
        await client.rollback();
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
}

/**
 * Logout user
 */
export async function logoutUser(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(200).json({ success: true, message: 'Logged out' });
    }

    const token = authHeader.split(' ')[1];

    try {
        await dbManager.getPool(AUTH_DB_ID).query('DELETE FROM sessions WHERE token = ?', [token]);
        return res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Get current user info
 */
export async function getCurrentUser(req, res) {
    try {
        const [users] = await dbManager.getPool(AUTH_DB_ID).query(
            `SELECT user_id, username, email, full_name, role, last_login, created_at
       FROM users
       WHERE user_id = ?`,
            [req.user.user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({ user: users[0] });

    } catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Change password
 */
export async function changePassword(req, res) {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
        return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (new_password.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const client = await dbManager.getPool(AUTH_DB_ID).getConnection();

    try {
        await client.beginTransaction();

        // Get current password hash
        const [users] = await client.query(
            'SELECT password_hash FROM users WHERE user_id = ?',
            [req.user.user_id]
        );

        if (users.length === 0) {
            await client.rollback();
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isValid = await bcrypt.compare(current_password, users[0].password_hash);

        if (!isValid) {
            await client.rollback();
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const new_hash = await bcrypt.hash(new_password, SALT_ROUNDS);

        // Update password
        await client.query(
            'UPDATE users SET password_hash = ? WHERE user_id = ?',
            [new_hash, req.user.user_id]
        );

        // Invalidate all sessions for this user
        await client.query('DELETE FROM sessions WHERE user_id = ?', [req.user.user_id]);

        await client.commit();

        return res.status(200).json({
            success: true,
            message: 'Password changed successfully. Please login again.'
        });

    } catch (error) {
        await client.rollback();
        console.error('Change password error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
}
