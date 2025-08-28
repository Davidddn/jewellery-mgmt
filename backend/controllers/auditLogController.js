const { Parser } = require('json2csv');
// Export audit logs as CSV
exports.exportLogs = async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['username', 'firstName', 'lastName']
      }],
      order: [['timestamp', 'DESC']]
    });
    const fields = ['id', 'timestamp', 'user.username', 'action', 'entityType', 'entityId', 'details', 'ipAddress', 'userAgent'];
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      'user.username': log.user?.username || '',
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: JSON.stringify(log.details),
      ipAddress: log.ipAddress,
      userAgent: log.userAgent
    })));
    res.header('Content-Type', 'text/csv');
    res.attachment('audit-logs.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// GET single log by ID
exports.getLogById = async (req, res) => {
  try {
    const log = await AuditLog.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['username', 'firstName', 'lastName']
      }]
    });
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });
    res.json({ success: true, log });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
const { Op, fn, col } = require('sequelize');
const { AuditLog, User } = require('../models');

// GET all logs with filtering and pagination
exports.getLogs = async (req, res) => {
  try {
    const {
      user_id,
      entityType,
      action,
      start_date,
      end_date,
      page = 1,
      limit = 50,
      sort = 'timestamp',
      order = 'DESC',
    } = req.query;

    let where = {};
    if (user_id) where.userId = user_id;
    if (entityType) where.entityType = entityType;
    if (action) where.action = { [Op.iLike]: `%${action}%` };
    if (start_date && end_date) {
      where.timestamp = {
        [Op.gte]: new Date(start_date),
        [Op.lte]: new Date(end_date),
      };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows: logs, count: total } = await AuditLog.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['username', 'firstName', 'lastName']
      }],
      order: [[sort, order]],
      limit: parseInt(limit),
      offset,
    });

    res.json({ success: true, logs, total, page: parseInt(page), pageSize: parseInt(limit) });
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