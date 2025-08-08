const { Op, fn, col } = require('sequelize');
const { AuditLog, User } = require('../models');

// GET all logs with filtering
exports.getLogs = async (req, res) => {
  try {
    const { user_id, entity, action, start_date, end_date, limit = 100 } = req.query;
    
    let where = {};
    if (user_id) where.user_id = user_id;
    if (entity) where.entity = entity;
    if (action) where.action = { [Op.iLike]: `%${action}%` };
    if (start_date && end_date) {
      where.timestamp = {
        [Op.gte]: new Date(start_date),
        [Op.lte]: new Date(end_date),
      };
    }

    const logs = await AuditLog.findAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['username', 'firstName', 'lastName']
      }],
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
    });
    
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET audit stats
exports.getAuditStats = async (req, res) => {
  try {
    const totalLogs = await AuditLog.count();
    const uniqueUserCount = await AuditLog.count({
      distinct: true,
      col: 'user_id'
    });

    const commonActions = await AuditLog.findAll({
        attributes: [
            'action',
            [fn('COUNT', col('action')), 'count'],
        ],
        group: ['action'],
        order: [[fn('COUNT', col('action')), 'DESC']],
        limit: 10
    });
    
    res.json({
      success: true,
      stats: {
        totalLogs,
        uniqueUsers: uniqueUserCount,
        commonActions,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};