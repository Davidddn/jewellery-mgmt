const db = require('../models');

module.exports = async (req, res, next) => {
  // Store original send method
  const originalSend = res.send;

  // For update, fetch old value before response
  let oldValue = null;
  if (req.method === 'PUT' && req.params.id && req.baseUrl) {
    const entityType = req.baseUrl.replace('/api/', '').replace(/s$/, '');
    if (db[entityType.charAt(0).toUpperCase() + entityType.slice(1)]) {
      try {
        oldValue = await db[entityType.charAt(0).toUpperCase() + entityType.slice(1)].findByPk(req.params.id);
      } catch {}
    }
  }

  res.send = function(data) {
    res.send = originalSend;

    if (['POST', 'PUT', 'DELETE'].includes(req.method) && req.user) {
      const entityType = req.baseUrl.replace('/api/', '').replace(/s$/, '');
      let entityId = req.body.id || req.params.id || null;
      let details = {};
      if (req.method === 'PUT') {
        details = {
          oldValue: oldValue ? oldValue.toJSON() : null,
          newValue: req.body
        };
      } else if (req.method === 'POST') {
        details = { newValue: req.body };
      } else if (req.method === 'DELETE') {
        details = { deletedId: entityId };
      }
      db.AuditLog.create({
        userId: req.user.id,
        action: `${req.method} ${req.originalUrl}`,
        entityType,
        entityId,
        details,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date()
      }).catch(err => {
        console.error('Audit log error:', err);
      });
    }
    return originalSend.call(this, data);
  };
  next();
};