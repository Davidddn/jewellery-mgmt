import { Routes, Route } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Hallmarking from "../pages/Hallmarking";
import Loyalty from "../pages/Loyalty";

const AdminRoutes = () => {
  return (
    <Routes>
      {/* Admin Dashboard */}
      <Route index element={<div>Admin Dashboard</div>} />

      {/* Users Management */}
      <Route path="users" element={<div>Users Management</div>} />

      {/* Products Management */}
      <Route path="products" element={<div>Products Management</div>} />

      {/* Settings */}
      <Route path="settings" element={<div>Admin Settings</div>} />

      {/* Hallmarking */}
      <Route path="hallmarking" element={<Hallmarking />} />

      {/* Loyalty */}
      <Route path="loyalty" element={<Loyalty />} />

      {/* 404 for admin routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AdminRoutes;