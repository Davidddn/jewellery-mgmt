import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import Layout from "../components/Layout/Layout";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import UnifiedDashboard from "../pages/UnifiedDashboard";
import Products from "../pages/Products";
import Customers from "../pages/Customers";
import Transactions from "../pages/Transactions";
import Reports from "../pages/Reports";
import Settings from "../pages/Settings";
import NotFound from "../pages/NotFound";
import AdminRoutes from "./AdminRoutes";
import Sales from "../pages/Sales";
import ImportData from "../pages/ImportData";
import GoldRate from "../pages/GoldRate";
import AdvancedAnalytics from "../pages/AdvancedAnalytics";
import RealTimeDashboard from "../pages/RealTimeDashboard";
import Expenses from '../pages/Expenses';
import CustomerHistory from '../pages/CustomerHistory';
import ProfitLossAnalytics from '../pages/ProfitLossAnalytics';
import AuditLogs from '../pages/AuditLogs';
import PWAStatus from '../pages/PWAStatus';
import PublicCatalogue from '../pages/PublicCatalogue';
import CatalogueBrowser from '../pages/CatalogueBrowser';
import PricingPage from '../components/Pricing/PricingPage';
import SubscriptionSettings from '../components/Subscription/SubscriptionSettings';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/catalogue" element={<CatalogueBrowser />} />
      <Route path="/catalogue/:productId" element={<PublicCatalogue />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          {/* Routes that need the layout */}
          <Route path="/" element={<UnifiedDashboard />} /> {/* Default route */}
          <Route path="/dashboard" element={<UnifiedDashboard />} />
          <Route path="/unified-dashboard" element={<UnifiedDashboard />} />
          {/* Legacy routes for backwards compatibility */}
          <Route path="/analytics" element={<UnifiedDashboard />} />
          <Route path="/realtime" element={<UnifiedDashboard />} />
          <Route path="/products" element={<ProtectedRoute />}>
            <Route index element={<Products />} />
          </Route>
          <Route path="/customers" element={<Customers />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/import" element={<ImportData />} />
          <Route path="/gold-rate" element={<GoldRate />} />

          {/* New: Expenses and Customer History */}
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/profit-loss" element={<ProfitLossAnalytics />} />
          <Route path="/customer-history" element={<CustomerHistory />} />
          <Route path="/customer-history/:customerId" element={<CustomerHistory />} />
          
          {/* Subscription and Pricing */}
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/subscription" element={<SubscriptionSettings />} />
          
          {/* PWA Status Page */}
          <Route path="/pwa-status" element={<PWAStatus />} />
          
          {/* Admin-only routes */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/audit-logs" element={<AuditLogs />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/*" element={<AdminRoutes />} />
          </Route>
        </Route>
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;