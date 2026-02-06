/**
 * Middleware to check if the authenticated user has admin role
 */
export const requireAdmin = async (req, res, next) => {
    try {
        // User should already be authenticated by authenticateUser middleware
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Check if user has admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Access denied. Admin privileges required.'
            });
        }

        next();
    } catch (error) {
        console.error('Admin check error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
