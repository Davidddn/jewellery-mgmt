const ActivityLogService = require('../services/ActivityLogService');

const enhancedAuditLogger = (options = {}) => {
  const {
    excludePaths = ['/api/audit-logs', '/api/auth/verify'],
    excludeMethods = ['GET'],
    logAllRequests = false,
    logFailedRequests = true
  } = options;

  return async (req, res, next) => {
    // Skip excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Skip excluded methods unless logAllRequests is true
    if (!logAllRequests && excludeMethods.includes(req.method)) {
      return next();
    }

    const startTime = Date.now();
    const originalSend = res.send;
    const originalJson = res.json;

    // Capture request details
    const requestDetails = {
      method: req.method,
      path: req.path,
      query: req.query,
      body: sanitizeBody(req.body),
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress,
      sessionId: req.headers['x-session-id'] || null,
      startTime: new Date().toISOString()
    };

    let responseDetails = {
      statusCode: null,
      responseTime: null,
      success: null
    };

    // Override response methods to capture response data
    res.send = function(data) {
      res.send = originalSend;
      responseDetails.statusCode = res.statusCode;
      responseDetails.responseTime = Date.now() - startTime;
      responseDetails.success = res.statusCode < 400;
      
      // Log the activity
      logActivity(req, responseDetails, requestDetails);
      
      return originalSend.call(this, data);
    };

    res.json = function(data) {
      res.json = originalJson;
      responseDetails.statusCode = res.statusCode;
      responseDetails.responseTime = Date.now() - startTime;
      responseDetails.success = res.statusCode < 400;
      
      // Log the activity
      logActivity(req, responseDetails, requestDetails);
      
      return originalJson.call(this, data);
    };

    next();
  };
};

const logActivity = async (req, responseDetails, requestDetails) => {
  try {
    const userId = req.user?.id || null;
    const action = generateActionName(req, responseDetails);
    const entityInfo = extractEntityInfo(req);

    // Only log if it's a significant action or if it failed
    if (shouldLogAction(req, responseDetails)) {
      await ActivityLogService.createLog({
        userId,
        action,
        entityType: entityInfo.entityType,
        entityId: entityInfo.entityId,
        details: {
          request: requestDetails,
          response: responseDetails,
          endpoint: `${req.method} ${req.path}`,
          userRole: req.user?.role || null
        },
        ipAddress: requestDetails.ipAddress,
        userAgent: requestDetails.userAgent,
        sessionId: requestDetails.sessionId
      });
    }

    // Always log security-related events
    if (isSecurityEvent(req, responseDetails)) {
      await ActivityLogService.logSecurityEvent(userId, action, {
        request: requestDetails,
        response: responseDetails,
        securityContext: getSecurityContext(req, responseDetails)
      });
    }

  } catch (error) {
    console.error('Enhanced audit logger error:', error);
  }
};

const generateActionName = (req, responseDetails) => {
  const method = req.method;
  const path = req.path;
  const success = responseDetails.success;

  // Generate meaningful action names
  if (path.includes('/auth/login')) return success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED';
  if (path.includes('/auth/logout')) return 'LOGOUT';
  if (path.includes('/auth/register')) return success ? 'REGISTER_SUCCESS' : 'REGISTER_FAILED';
  
  // CRUD operations
  if (method === 'POST') return success ? 'CREATE' : 'CREATE_FAILED';
  if (method === 'PUT' || method === 'PATCH') return success ? 'UPDATE' : 'UPDATE_FAILED';
  if (method === 'DELETE') return success ? 'DELETE' : 'DELETE_FAILED';
  if (method === 'GET' && path.includes('/export')) return 'EXPORT';
  if (method === 'POST' && path.includes('/import')) return 'IMPORT';
  
  // Default action
  return `${method}_${success ? 'SUCCESS' : 'FAILED'}`;
};

const extractEntityInfo = (req) => {
  const path = req.path;
  let entityType = 'Unknown';
  let entityId = null;

  // Extract entity type from path
  if (path.includes('/products')) entityType = 'Product';
  else if (path.includes('/customers')) entityType = 'Customer';
  else if (path.includes('/transactions')) entityType = 'Transaction';
  else if (path.includes('/invoices')) entityType = 'Invoice';
  else if (path.includes('/users')) entityType = 'User';
  else if (path.includes('/categories')) entityType = 'Category';
  else if (path.includes('/gold-rates')) entityType = 'GoldRate';
  else if (path.includes('/expenses')) entityType = 'Expense';
  else if (path.includes('/settings')) entityType = 'Setting';
  else if (path.includes('/auth')) entityType = 'Auth';

  // Extract entity ID from path or body
  const idMatch = path.match(/\/(\d+)(?:\/|$)/);
  if (idMatch) {
    entityId = parseInt(idMatch[1]);
  } else if (req.body && req.body.id) {
    entityId = req.body.id;
  }

  return { entityType, entityId };
};

const shouldLogAction = (req, responseDetails) => {
  // Always log write operations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return true;
  }

  // Log failed requests
  if (!responseDetails.success) {
    return true;
  }

  // Log authentication requests
  if (req.path.includes('/auth/')) {
    return true;
  }

  // Log export/import operations
  if (req.path.includes('/export') || req.path.includes('/import')) {
    return true;
  }

  // Log slow requests (>5 seconds)
  if (responseDetails.responseTime > 5000) {
    return true;
  }

  return false;
};

const isSecurityEvent = (req, responseDetails) => {
  // Failed authentication
  if (req.path.includes('/auth/') && !responseDetails.success) {
    return true;
  }

  // Unauthorized access (403, 401)
  if ([401, 403].includes(responseDetails.statusCode)) {
    return true;
  }

  // Suspicious request patterns
  if (req.path.includes('..') || req.path.includes('<script>')) {
    return true;
  }

  // Multiple rapid requests (basic rate limiting check)
  // This would require additional middleware to track request frequency

  return false;
};

const getSecurityContext = (req, responseDetails) => {
  return {
    statusCode: responseDetails.statusCode,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    origin: req.get('Origin'),
    xForwardedFor: req.get('X-Forwarded-For'),
    suspiciousPatterns: detectSuspiciousPatterns(req)
  };
};

const detectSuspiciousPatterns = (req) => {
  const patterns = [];
  
  if (req.path.includes('..')) patterns.push('PATH_TRAVERSAL');
  if (req.path.toLowerCase().includes('script')) patterns.push('XSS_ATTEMPT');
  if (req.path.includes('union') || req.path.includes('select')) patterns.push('SQL_INJECTION');
  
  return patterns;
};

const sanitizeBody = (body) => {
  if (!body) return null;
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.secret;
  delete sanitized.key;
  
  return sanitized;
};

module.exports = enhancedAuditLogger;
