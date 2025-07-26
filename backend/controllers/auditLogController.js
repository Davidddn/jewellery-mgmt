const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

exports.getLogs = async (req, res) => {
  try {
    const { 
      user_id, 
      entity, 
      action, 
      start_date, 
      end_date, 
      limit = 100 
    } = req.query;
    
    let filter = {};
    
    if (user_id) filter.user_id = user_id;
    if (entity) filter.entity = entity;
    if (action) filter.action = { $regex: action, $options: 'i' };
    
    if (start_date && end_date) {
      filter.timestamp = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }
    
    const logs = await AuditLog.find(filter)
      .populate('user_id', 'username firstName lastName role')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      logs
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getLogsByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { limit = 50 } = req.query;
    
    const logs = await AuditLog.find({ user_id })
      .populate('user_id', 'username firstName lastName role')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      logs
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getLogsByEntity = async (req, res) => {
  try {
    const { entity, entity_id } = req.params;
    const { limit = 50 } = req.query;
    
    const logs = await AuditLog.find({ entity, entity_id })
      .populate('user_id', 'username firstName lastName role')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      logs
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getAuditStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let filter = {};
    if (start_date && end_date) {
      filter.timestamp = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }
    
    const totalLogs = await AuditLog.countDocuments(filter);
    const uniqueUsers = await AuditLog.distinct('user_id', filter);
    
    // Get most active users
    const activeUsers = await AuditLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$user_id',
          action_count: { $sum: 1 }
        }
      },
      {
        $sort: { action_count: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          user_id: '$_id',
          action_count: 1,
          'user.username': 1,
          'user.firstName': 1,
          'user.lastName': 1
        }
      }
    ]);
    
    // Get most common actions
    const commonActions = await AuditLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    res.json({
      success: true,
      stats: {
        totalLogs,
        uniqueUsers: uniqueUsers.length,
        activeUsers,
        commonActions
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.exportLogs = async (req, res) => {
  try {
    const { start_date, end_date, format = 'json' } = req.query;
    
    let filter = {};
    if (start_date && end_date) {
      filter.timestamp = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }
    
    const logs = await AuditLog.find(filter)
      .populate('user_id', 'username firstName lastName role')
      .sort({ timestamp: -1 });
    
    if (format === 'csv') {
      // Convert to CSV format
      const csvData = logs.map(log => ({
        timestamp: log.timestamp,
        user: log.user_id ? `${log.user_id.firstName} ${log.user_id.lastName}` : 'Unknown',
        action: log.action,
        entity: log.entity,
        entity_id: log.entity_id,
        changes: JSON.stringify(log.changes)
      }));
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
      
      // Convert to CSV string
      const csvString = [
        'Timestamp,User,Action,Entity,Entity ID,Changes',
        ...csvData.map(row => 
          `"${row.timestamp}","${row.user}","${row.action}","${row.entity}","${row.entity_id}","${row.changes}"`
        )
      ].join('\n');
      
      res.send(csvString);
    } else {
      res.json({
        success: true,
        logs
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.clearOldLogs = async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    
    const result = await AuditLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });
    
    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} old audit logs`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getLogSummary = async (req, res) => {
  try {
    const { period = 'day' } = req.query;
    
    let groupBy = {};
    let dateFormat = {};
    
    switch (period) {
      case 'hour':
        groupBy = { $dateToString: { format: "%Y-%m-%d %H:00", date: "$timestamp" } };
        dateFormat = { $dateToString: { format: "%Y-%m-%d %H:00", date: "$timestamp" } };
        break;
      case 'day':
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } };
        dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } };
        break;
      case 'month':
        groupBy = { $dateToString: { format: "%Y-%m", date: "$timestamp" } };
        dateFormat = { $dateToString: { format: "%Y-%m", date: "$timestamp" } };
        break;
      default:
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } };
        dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } };
    }
    
    const summary = await AuditLog.aggregate([
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
          actions: { $addToSet: '$action' }
        }
      },
      {
        $sort: { _id: -1 }
      },
      {
        $limit: 30
      }
    ]);
    
    res.json({
      success: true,
      summary
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
}; 