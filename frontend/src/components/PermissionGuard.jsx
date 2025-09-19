import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { Box, Alert, Typography } from '@mui/material';
import { Block as BlockIcon } from '@mui/icons-material';

const PermissionGuard = ({ 
  permission, 
  permissions, 
  requireAll = false, 
  fallback, 
  children,
  showFallback = true 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && Array.isArray(permissions)) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  if (!hasAccess) {
    if (fallback) {
      return fallback;
    }

    if (!showFallback) {
      return null;
    }

    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert 
          severity="warning" 
          icon={<BlockIcon />}
          sx={{ 
            display: 'inline-flex',
            alignItems: 'center',
            maxWidth: 400,
            mx: 'auto'
          }}
        >
          <Typography variant="h6" component="div" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body2">
            You don&apos;t have permission to view this content.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return children;
};

export default PermissionGuard;
