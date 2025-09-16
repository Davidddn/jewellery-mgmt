import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Typography
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Timeline,
  Analytics,
  Psychology,
  Assessment
} from '@mui/icons-material';

// Import your existing components
import Dashboard from './Dashboard';
import RealTimeDashboard from './RealTimeDashboard';
import AdvancedAnalytics from './AdvancedAnalytics';
import ProfitLossAnalytics from './ProfitLossAnalytics';
import SmartInsightsCard from '../components/SmartInsightsCard';

// Tab Panel Component
const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const UnifiedDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [activeTab, setActiveTab] = useState(0);

  // Tab configurations
  const dashboardTabs = [
    {
      label: 'Overview',
      icon: <DashboardIcon />,
      component: <Dashboard />,
      description: 'Main dashboard with KPIs and summaries'
    },
    {
      label: 'Real-Time',
      icon: <Timeline />,
      component: <RealTimeDashboard />,
      description: 'Live data and real-time monitoring'
    },
    {
      label: 'Analytics',
      icon: <Analytics />,
      component: <AdvancedAnalytics />,
      description: 'Advanced analytics and insights'
    },
    {
      label: 'Profit & Loss',
      icon: <Assessment />,
      component: <ProfitLossAnalytics />,
      description: 'Financial performance and profit analysis'
    },
    {
      label: 'AI Insights',
      icon: <Psychology />,
      component: <SmartInsightsCard />,
      description: 'AI-powered business insights'
    }
  ];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Enhanced Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile
          sx={{
            '& .MuiTab-root': {
              minHeight: 72,
              textTransform: 'none',
              fontWeight: 600,
            }
          }}
        >
          {dashboardTabs.map((tab, index) => (
            <Tab
              key={index}
              icon={tab.icon}
              label={tab.label}
              iconPosition="start"
              sx={{
                '& .MuiTab-iconWrapper': {
                  marginBottom: '0px !important',
                  marginRight: 1
                }
              }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Tab Content */}
      {dashboardTabs.map((tab, index) => (
        <TabPanel key={index} value={activeTab} index={index}>
          {tab.component}
        </TabPanel>
      ))}

      {/* Quick Stats Bar (shown on all tabs) */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          p: 1,
          display: { xs: 'flex', md: 'none' }, // Only show on mobile
          justifyContent: 'space-around',
          zIndex: theme.zIndex.appBar
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Today's Sales
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            ₹45,230
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Transactions
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            12
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Low Stock
          </Typography>
          <Typography variant="body2" fontWeight="bold" color="warning.main">
            3
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default UnifiedDashboard;
