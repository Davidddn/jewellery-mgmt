const { AuditLog, User } = require('../models');
const { Op } = require('sequelize');

class ActivityLogService {
  static async createLog({
    userId,
    action,
    entityType,
    entityId = null,
    details = {},
    ipAddress = null,
    userAgent = null,
    sessionId = null
  }) {
    try {
      const logData = {
        userId,
        action,
        entityType,
        entityId,
        details: {
          ...details,
          sessionId,
          timestamp: new Date().toISOString()
        },
        ipAddress,
        userAgent
      };

      const auditLog = await AuditLog.create(logData);
      return auditLog;
    } catch (error) {
      console.error('Failed to create audit log:', error);
      throw error;
    }
  }

  static async logUserActivity(userId, activity, details = {}) {
    return this.createLog({
      userId,
      action: activity,
      entityType: 'User',
      entityId: userId,
      details
    });
  }

  static async logEntityActivity(userId, action, entityType, entityId, oldData = null, newData = null, additionalDetails = {}) {
    const details = {
      ...additionalDetails
    };

    if (oldData) details.oldData = oldData;
    if (newData) details.newData = newData;

    return this.createLog({
      userId,
      action,
      entityType,
      entityId,
      details
    });
  }

  static async logSecurityEvent(userId, event, details = {}) {
    return this.createLog({
      userId,
      action: event,
      entityType: 'Security',
      details: {
        ...details,
        securityLevel: 'HIGH',
        requiresReview: true
      }
    });
  }

  static async logSystemActivity(action, details = {}) {
    return this.createLog({
      userId: null, // System action
      action,
      entityType: 'System',
      details: {
        ...details,
        systemGenerated: true
      }
    });
  }

  static async getUserActivitySummary(userId, startDate, endDate) {
    const where = {
      userId,
      timestamp: {
        [Op.between]: [startDate, endDate]
      }
    };

    const [totalActivities, activitiesByAction, activitiesByEntity] = await Promise.all([
      AuditLog.count({ where }),
      AuditLog.findAll({
        where,
        attributes: ['action', [AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('action')), 'count']],
        group: ['action'],
        order: [[AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('action')), 'DESC']]
      }),
      AuditLog.findAll({
        where,
        attributes: ['entityType', [AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('entityType')), 'count']],
        group: ['entityType'],
        order: [[AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('entityType')), 'DESC']]
      })
    ]);

    return {
      totalActivities,
      activitiesByAction,
      activitiesByEntity,
      period: { startDate, endDate }
    };
  }

  static async getRecentActivities(limit = 50, userId = null) {
    const where = userId ? { userId } : {};
    
    return AuditLog.findAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['username', 'firstName', 'lastName', 'role']
      }],
      order: [['timestamp', 'DESC']],
      limit
    });
  }

  static async getSecurityEvents(startDate, endDate) {
    return AuditLog.findAll({
      where: {
        entityType: 'Security',
        timestamp: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['username', 'firstName', 'lastName', 'role']
      }],
      order: [['timestamp', 'DESC']]
    });
  }

  static async getSystemHealth() {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      activitiesLast24h,
      activitiesLastWeek,
      uniqueUsersLast24h,
      errorCount24h,
      securityEvents24h
    ] = await Promise.all([
      AuditLog.count({
        where: { timestamp: { [Op.gte]: yesterday } }
      }),
      AuditLog.count({
        where: { timestamp: { [Op.gte]: lastWeek } }
      }),
      AuditLog.count({
        distinct: true,
        col: 'userId',
        where: { 
          timestamp: { [Op.gte]: yesterday },
          userId: { [Op.not]: null }
        }
      }),
      AuditLog.count({
        where: {
          timestamp: { [Op.gte]: yesterday },
          action: { [Op.like]: '%ERROR%' }
        }
      }),
      AuditLog.count({
        where: {
          timestamp: { [Op.gte]: yesterday },
          entityType: 'Security'
        }
      })
    ]);

    return {
      activitiesLast24h,
      activitiesLastWeek,
      uniqueUsersLast24h,
      errorCount24h,
      securityEvents24h,
      healthScore: this.calculateHealthScore({
        activitiesLast24h,
        errorCount24h,
        securityEvents24h
      })
    };
  }

  static calculateHealthScore({ activitiesLast24h, errorCount24h, securityEvents24h }) {
    let score = 100;
    
    // Deduct points for errors
    if (errorCount24h > 0) {
      score -= Math.min(errorCount24h * 2, 30); // Max 30 points deduction
    }
    
    // Deduct points for security events
    if (securityEvents24h > 0) {
      score -= Math.min(securityEvents24h * 5, 25); // Max 25 points deduction
    }
    
    // Deduct points for low activity (might indicate system issues)
    if (activitiesLast24h < 10) {
      score -= 20;
    }
    
    return Math.max(score, 0);
  }

  static async cleanupOldLogs(daysToKeep = 90) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    const deletedCount = await AuditLog.destroy({
      where: {
        timestamp: { [Op.lt]: cutoffDate }
      }
    });

    await this.logSystemActivity('LOG_CLEANUP', {
      deletedCount,
      cutoffDate: cutoffDate.toISOString(),
      daysToKeep
    });

    return deletedCount;
  }
}

module.exports = ActivityLogService;
