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

/**
 * Get user's company access (Admin only)
 */
export async function getUserCompanyAccess(req, res) {
    const { id } = req.params;

    const client = await dbManager.getPool(AUTH_DB_ID).getConnection();

    try {
        const [access] = await client.query(
            'SELECT company_id FROM user_company_access WHERE user_id = ?',
            [id]
        );

        const companyIds = access.map(row => row.company_id);

        return res.status(200).json({
            user_id: parseInt(id),
            company_ids: companyIds
        });

    } catch (error) {
        console.error('Get user company access error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
}

/**
 * Update user's company access (Admin only)
 */
export async function updateUserCompanyAccess(req, res) {
    const { id } = req.params;
    const { company_ids } = req.body;
    const created_by = req.user.user_id;

    if (!Array.isArray(company_ids)) {
        return res.status(400).json({ error: 'company_ids must be an array' });
    }

    const validCompanyIds = [1, 2, 3];
    const invalidIds = company_ids.filter(id => !validCompanyIds.includes(id));

    if (invalidIds.length > 0) {
        return res.status(400).json({ error: `Invalid company IDs: ${invalidIds.join(', ')}` });
    }

    const client = await dbManager.getPool(AUTH_DB_ID).getConnection();

    try {
        await client.beginTransaction();

        const [users] = await client.query('SELECT user_id FROM users WHERE user_id = ?', [id]);

        if (users.length === 0) {
            await client.rollback();
            return res.status(404).json({ error: 'User not found' });
        }

        await client.query('DELETE FROM user_company_access WHERE user_id = ?', [id]);


        if (company_ids.length > 0) {
            // Insert each company access individually
            for (const companyId of company_ids) {
                await client.query(
                    'INSERT INTO user_company_access (user_id, company_id, created_by) VALUES (?, ?, ?)',
                    [id, companyId, created_by]
                );
            }
        }

        await client.commit();

        return res.status(200).json({
            success: true,
            message: 'Company access updated successfully',
            company_ids
        });

    } catch (error) {
        await client.rollback();
        console.error('Update user company access error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
}

/**
 * Get user's section access (Admin only)
 */
export async function getUserSectionAccess(req, res) {
    const { id } = req.params;

    const client = await dbManager.getPool(AUTH_DB_ID).getConnection();

    try {
        const [access] = await client.query(
            'SELECT section_name FROM user_section_access WHERE user_id = ?',
            [id]
        );

        const sections = access.map(row => row.section_name);

        return res.status(200).json({ 
            user_id: parseInt(id),
            sections 
        });

    } catch (error) {
        console.error('Get user section access error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
}

/**
 * Update user's section access (Admin only)
 */
export async function updateUserSectionAccess(req, res) {
    const { id } = req.params;
    const { sections } = req.body;
    const created_by = req.user.user_id;

    if (!Array.isArray(sections)) {
        return res.status(400).json({ error: 'sections must be an array' });
    }

    const validSections = ['invoice', 'analytics', 'ledger', 'quotation'];
    const invalidSections = sections.filter(s => !validSections.includes(s));
    
    if (invalidSections.length > 0) {
        return res.status(400).json({ error: `Invalid sections: ${invalidSections.join(', ')}` });
    }

    const client = await dbManager.getPool(AUTH_DB_ID).getConnection();

    try {
        await client.beginTransaction();

        const [users] = await client.query('SELECT user_id FROM users WHERE user_id = ?', [id]);
        
        if (users.length === 0) {
            await client.rollback();
            return res.status(404).json({ error: 'User not found' });
        }

        await client.query('DELETE FROM user_section_access WHERE user_id = ?', [id]);

        if (sections.length > 0) {
            for (const section of sections) {
                await client.query(
                    'INSERT INTO user_section_access (user_id, section_name, created_by) VALUES (?, ?, ?)',
                    [id, section, created_by]
                );
            }
        }

        await client.commit();

        return res.status(200).json({ 
            success: true, 
            message: 'Section access updated successfully',
            sections
        });

    } catch (error) {
        await client.rollback();
        console.error('Update user section access error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
}
