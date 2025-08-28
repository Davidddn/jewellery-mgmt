const checkRole = (roles) => {
  return (req, res, next) => {
    console.log('checkRole middleware: req.user:', req.user);
    console.log('checkRole middleware: req.user.role:', req.user ? req.user.role : 'undefined');
    console.log('checkRole middleware: required roles:', roles);
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

module.exports = checkRole;