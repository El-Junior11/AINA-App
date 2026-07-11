const logAction = (req, res, next) => {
    res.on('finish', () => {
        if (['POST', 'PUT', 'DELETE'].includes(req.method) && res.statusCode >= 200 && res.statusCode < 300) {
            const auditData = {
                table: req.originalUrl,
                action: req.method,
                id: req.params.id || 'N/A',
                user: req.user ? `Utilisateur #${req.user.user_id}` : "Admin",
                timestamp: new Date().toLocaleTimeString()
            };

            if (global.io) {
                global.io.emit('admin_alert', auditData);
            }
        }
    });
    next();
};

module.exports = logAction;