import bcrypt from 'bcrypt';
import { dbManager } from '../db.js';

const SALT_ROUNDS = 10;
const AUTH_DB_ID = 1; // Central user database

/**
 * Get all users (Admin only)
 */
export async function getAllUsers(req, res) {
    try {
        const [users] = await dbManager.getPool(AUTH_DB_ID).query(`
            SELECT 
                user_id, 
                username, 
                email, 
                full_name, 
                role, 
                is_active,
                created_by,
                last_login,
                created_at
            FROM users
            ORDER BY created_at DESC
        `);

        return res.status(200).json({ users });
    } catch (error) {
        console.error('Get all users error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Create new user (Admin only)
 */
export async function createUser(req, res) {
    const { username, email, password, full_name, role = 'user' } = req.body;
    const created_by = req.user.user_id; // Admin who is creating this user

    // Validation
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Validate role
    if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be "admin" or "user"' });
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
            `INSERT INTO users (username, email, password_hash, full_name, role, created_by, is_active)
             VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
            [username, email, password_hash, full_name, role, created_by]
        );

        await client.commit();

        return res.status(201).json({
            success: true,
            user: {
                user_id: result.insertId,
                username,
                email,
                full_name,
                role,
                created_by
            }
        });

    } catch (error) {
        await client.rollback();
        console.error('Create user error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
}

/**
 * Update user (Admin only)
 */
export async function updateUser(req, res) {
    const { id } = req.params;
    const { full_name, role, is_active } = req.body;

    // Validate role if provided
    if (role && !['admin', 'user'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be "admin" or "user"' });
    }

    const client = await dbManager.getPool(AUTH_DB_ID).getConnection();

    try {
        await client.beginTransaction();

        // Check if user exists
        const [users] = await client.query('SELECT user_id FROM users WHERE user_id = ?', [id]);

        if (users.length === 0) {
            await client.rollback();
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent admin from deactivating themselves
        if (req.user.user_id === parseInt(id) && is_active === false) {
            await client.rollback();
            return res.status(400).json({ error: 'You cannot deactivate your own account' });
        }

        // Build update query dynamically
        const updates = [];
        const values = [];

        if (full_name !== undefined) {
            updates.push('full_name = ?');
            values.push(full_name);
        }
        if (role !== undefined) {
            updates.push('role = ?');
            values.push(role);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(is_active);
        }

        if (updates.length === 0) {
            await client.rollback();
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);

        await client.query(
            `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
            values
        );

        await client.commit();

        return res.status(200).json({ success: true, message: 'User updated successfully' });

    } catch (error) {
        await client.rollback();
        console.error('Update user error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
}

/**
 * Delete user (Admin only)
 */
export async function deleteUser(req, res) {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user.user_id === parseInt(id)) {
        return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const client = await dbManager.getPool(AUTH_DB_ID).getConnection();

    try {
        await client.beginTransaction();

        // Delete user's sessions first
        await client.query('DELETE FROM sessions WHERE user_id = ?', [id]);

        // Delete user
        const [result] = await client.query('DELETE FROM users WHERE user_id = ?', [id]);

        if (result.affectedRows === 0) {
            await client.rollback();
            return res.status(404).json({ error: 'User not found' });
        }

        await client.commit();

        return res.status(200).json({ success: true, message: 'User deleted successfully' });

    } catch (error) {
        await client.rollback();
        console.error('Delete user error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
}

/**
 * Reset user password (Admin only)
 */
export async function resetUserPassword(req, res) {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const client = await dbManager.getPool(AUTH_DB_ID).getConnection();

    try {
        await client.beginTransaction();

        // Check if user exists
        const [users] = await client.query('SELECT user_id FROM users WHERE user_id = ?', [id]);

        if (users.length === 0) {
            await client.rollback();
            return res.status(404).json({ error: 'User not found' });
        }

        // Hash new password
        const password_hash = await bcrypt.hash(new_password, SALT_ROUNDS);

        // Update password
        await client.query(
            'UPDATE users SET password_hash = ? WHERE user_id = ?',
            [password_hash, id]
        );

        // Invalidate all sessions for this user
        await client.query('DELETE FROM sessions WHERE user_id = ?', [id]);

        await client.commit();

        return res.status(200).json({
            success: true,
            message: 'Password reset successfully. User must login again.'
        });

    } catch (error) {
        await client.rollback();
        console.error('Reset password error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
}
