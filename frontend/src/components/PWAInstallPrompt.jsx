// src/components/PWAInstallPrompt.jsx
// PWA Install Prompt Component with modern UI
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Card,
  CardContent,
  Chip,
  Slide,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  GetApp as InstallIcon,
  Smartphone as MobileIcon,
  Computer as DesktopIcon,
  OfflineBolt as OfflineIcon,
  Notifications as NotificationsIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [_userChoice, setUserChoice] = useState(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      // Check for standalone display mode (iOS/Android)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
      // Check for navigator.standalone (iOS Safari)
      if (window.navigator.standalone === true) {
        setIsInstalled(true);
        return;
      }
      
      // Check for Android WebAPK
      if (document.referrer.includes('android-app://')) {
        setIsInstalled(true);
        return;
      }
    };

    checkInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      
      // Check if user has dismissed the prompt before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const lastDismissed = localStorage.getItem('pwa-install-last-dismissed');
      
      // Show prompt if not dismissed or if it's been more than 7 days
      if (!dismissed || (lastDismissed && Date.now() - parseInt(lastDismissed) > 7 * 24 * 60 * 60 * 1000)) {
        // Delay showing the prompt to avoid interrupting user flow
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      
      // Show success message
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SYNC_NOTIFICATION',
          status: 'success',
          message: 'App installed successfully! You can now use it offline.'
        });
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    setUserChoice(outcome);

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setShowPrompt(false);
    } else {
      console.log('User dismissed the install prompt');
      handleDismiss();
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    localStorage.setItem('pwa-install-last-dismissed', Date.now().toString());
  };

  const handleRemindLater = () => {
    setShowPrompt(false);
    // Show again in 24 hours
    localStorage.setItem('pwa-install-last-dismissed', Date.now().toString());
  };

  // Don't show if already installed or no deferred prompt
  if (isInstalled || !deferredPrompt) {
    return null;
  }

  const features = [
    {
      icon: <OfflineIcon color="primary" />,
      title: 'Work Offline',
      description: 'Access your data even without internet'
    },
    {
      icon: <SpeedIcon color="primary" />,
      title: 'Faster Loading',
      description: 'Instant app launch from home screen'
    },
    {
      icon: <NotificationsIcon color="primary" />,
      title: 'Push Notifications',
      description: 'Get notified about important updates'
    },
    {
      icon: isMobile ? <MobileIcon color="primary" /> : <DesktopIcon color="primary" />,
      title: 'Native Experience',
      description: 'App-like experience on your device'
    }
  ];

  return (
    <Dialog
      open={showPrompt}
      onClose={handleDismiss}
      TransitionComponent={Transition}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1,
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InstallIcon />
          <Typography variant="h6" component="span">
            Install Jewellery Management
          </Typography>
        </Box>
        <IconButton onClick={handleDismiss} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, pb: 3 }}>
        <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
          Install our app for the best experience with enhanced features and offline access.
        </Typography>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
          gap: 2, 
          mb: 3 
        }}>
          {features.map((feature, index) => (
            <Card 
              key={index} 
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <CardContent sx={{ p: 2, color: 'white' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {feature.icon}
                  <Typography variant="subtitle2" fontWeight="bold">
                    {feature.title}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.85rem' }}>
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Chip 
            label="Fast" 
            size="small" 
            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
          />
          <Chip 
            label="Secure" 
            size="small" 
            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
          />
          <Chip 
            label="Offline Ready" 
            size="small" 
            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
        <Button 
          onClick={handleRemindLater}
          sx={{ 
            color: 'white', 
            borderColor: 'rgba(255, 255, 255, 0.5)',
            '&:hover': {
              borderColor: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
          variant="outlined"
        >
          Remind Later
        </Button>
        <Button 
          onClick={handleInstallClick}
          variant="contained"
          startIcon={<InstallIcon />}
          sx={{ 
            backgroundColor: 'white',
            color: '#667eea',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)'
            }
          }}
        >
          Install App
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PWAInstallPrompt;
