import React, { useEffect } from 'react';
import { Box, Alert, Typography, CircularProgress } from '@mui/material';
import { usePermissions } from '../hooks/usePermissions';
import { useActivityLogger } from '../hooks/useActivityLogger';

/**
 * Higher-Order Component for Role-Based Access Control and Activity Logging
 * 
 * @param {React.Component} WrappedComponent - The component to wrap
 * @param {Object} options - Configuration options
 * @param {string} options.permission - Required permission to access the page
 * @param {string} options.pageName - Name of the page for logging
 * @param {string} options.entityType - Type of entity for logging (optional)
 * @param {Object} options.fallbackProps - Props to show when access is denied (optional)
 * @returns {React.Component} Enhanced component with RBAC and logging
 */
const withRoleBasedAccess = (WrappedComponent, options = {}) => {
  const {
    permission,
    pageName,
    entityType = 'SYSTEM',
    fallbackProps = {}
  } = options;

  return function EnhancedComponent(props) {
    const { hasPermission, userRole, isLoading: permissionsLoading } = usePermissions();
    const { logPageView, logEntityAction, ActivityTypes } = useActivityLogger();

    // Log page view when component mounts
    useEffect(() => {
      if (pageName && !permissionsLoading) {
        logPageView(pageName, { 
          userRole, 
          hasRequiredPermission: permission ? hasPermission(permission) : true,
          ...props.additionalLoggingData 
        });
      }
    }, [logPageView, userRole, permissionsLoading, hasPermission, props.additionalLoggingData]);

    // Log access attempt
    useEffect(() => {
      if (permission && !permissionsLoading) {
        const hasAccess = hasPermission(permission);
        logEntityAction(
          hasAccess ? ActivityTypes.VIEW : ActivityTypes.ACCESS_DENIED,
          entityType,
          null,
          {
            page: pageName,
            permission,
            userRole,
            accessGranted: hasAccess
          }
        );
      }
    }, [permissionsLoading, hasPermission, logEntityAction, ActivityTypes, userRole]);

    // Show loading while permissions are being checked
    if (permissionsLoading) {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '200px',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Checking permissions...
          </Typography>
        </Box>
      );
    }

    // Check permission if specified
    if (permission && !hasPermission(permission)) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Alert 
            severity="error" 
            sx={{ mb: 2, maxWidth: 600, mx: 'auto' }}
            {...fallbackProps.alertProps}
          >
            <Typography variant="h6" gutterBottom>
              {fallbackProps.title || 'Access Denied'}
            </Typography>
            <Typography>
              {fallbackProps.message || `You don't have permission to access this page. Required permission: ${permission}`}
            </Typography>
            {userRole && (
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                Current role: {userRole}
              </Typography>
            )}
          </Alert>
          {fallbackProps.showContactAdmin && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Please contact your administrator if you believe this is an error.
            </Typography>
          )}
        </Box>
      );
    }

    // Render the wrapped component with enhanced props
    return (
      <WrappedComponent 
        {...props}
        hasPermission={hasPermission}
        userRole={userRole}
        logEntityAction={logEntityAction}
      />
    );
  };
};

export default withRoleBasedAccess;

// Convenience HOCs for common use cases
export const withAdminAccess = (WrappedComponent, pageName) => 
  withRoleBasedAccess(WrappedComponent, {
    permission: 'admin.access',
    pageName,
    entityType: 'ADMIN',
    fallbackProps: {
      title: 'Administrator Access Required',
      message: 'This page is restricted to administrators only.',
      showContactAdmin: true
    }
  });

export const withManagerAccess = (WrappedComponent, pageName) => 
  withRoleBasedAccess(WrappedComponent, {
    permission: 'reports.advanced',
    pageName,
    entityType: 'MANAGEMENT',
    fallbackProps: {
      title: 'Manager Access Required',
      message: 'This page requires manager-level permissions.',
      showContactAdmin: true
    }
  });

export const withInventoryAccess = (WrappedComponent, pageName) => 
  withRoleBasedAccess(WrappedComponent, {
    permission: 'products.read',
    pageName,
    entityType: 'INVENTORY',
    fallbackProps: {
      title: 'Inventory Access Required',
      message: 'You need inventory permissions to access this page.'
    }
  });

export const withSalesAccess = (WrappedComponent, pageName) => 
  withRoleBasedAccess(WrappedComponent, {
    permission: 'transactions.read',
    pageName,
    entityType: 'SALES',
    fallbackProps: {
      title: 'Sales Access Required',
      message: 'You need sales permissions to access this page.'
    }
  });
