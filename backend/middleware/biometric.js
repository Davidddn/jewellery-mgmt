// Stub for biometric authentication middleware
module.exports = (req, res, next) => {
  // In production, integrate with biometric device SDK/API
  // For now, accept if biometricId is present in request
  if (req.body.biometricId) {
    return next();
  }
  return res.status(401).json({ 
    success: false, 
    message: 'Biometric authentication required' 
  });
}; 