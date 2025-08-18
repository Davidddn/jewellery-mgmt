import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import Layout from "../components/Layout/Layout";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
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

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<Login />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          {/* Routes that need the layout */}
          <Route path="/" element={<Dashboard />} /> {/* Default route */}
          <Route path="/dashboard" element={<Dashboard />} />
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