import { Routes, Route } from "react-router-dom";
import NotFound from "../pages/NotFound";

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

      {/* 404 for admin routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AdminRoutes;