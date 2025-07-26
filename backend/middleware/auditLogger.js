const AuditLog = require('../models/AuditLog');

module.exports = async (req, res, next) => {
  // Store original send method
  const originalSend = res.send;
  
  // Override send method to capture response
  res.send = function(data) {
    // Restore original send
    res.send = originalSend;
    
    // Log the action after response is sent
    if (['POST', 'PUT', 'DELETE'].includes(req.method) && req.user) {
      AuditLog.create({
        user_id: req.user.id,
        action: `${req.method} ${req.originalUrl}`,
        entity: req.baseUrl.replace('/api/', ''),
        entity_id: req.body.id || req.params.id || 'unknown',
        changes: req.body,
        timestamp: new Date()
      }).catch(err => {
        console.error('Audit log error:', err);
      });
    }
    
    // Call original send
    return originalSend.call(this, data);
  };
  
  next();
}; 