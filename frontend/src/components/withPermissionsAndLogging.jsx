import React, { useEffect } from 'react';
import { useActivityLogger } from '../hooks/useActivityLogger';
import PermissionGuard from './PermissionGuard';

const withPermissionsAndLogging = (
  WrappedComponent, 
  { 
    permissions = [], 
    requireAll = false,
    logPageView = true,
    pageName,
    additionalLogData = {}
  }
) => {
  const WithPermissionsAndLogging = (props) => {
    const { logPageView: logPageViewFn, logAccessDenied } = useActivityLogger();

    useEffect(() => {
      if (logPageView) {
        const pageDisplayName = pageName || WrappedComponent.displayName || WrappedComponent.name || 'Unknown Page';
        logPageViewFn(pageDisplayName, additionalLogData);
      }
    }, [logPageViewFn]);

    const handleAccessDenied = () => {
      const deniedPermissions = Array.isArray(permissions) ? permissions : [permissions];
      logAccessDenied(deniedPermissions.join(', '), `Access to ${pageName || 'page'}`);
    };

    return (
      <PermissionGuard
        permissions={permissions}
        requireAll={requireAll}
        fallback={
          <div>
            {handleAccessDenied()}
            {/* Access denied component will be rendered */}
          </div>
        }
      >
        <WrappedComponent {...props} />
      </PermissionGuard>
    );
  };

  WithPermissionsAndLogging.displayName = `withPermissionsAndLogging(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithPermissionsAndLogging;
};

export default withPermissionsAndLogging;
