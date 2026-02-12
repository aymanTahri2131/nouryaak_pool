import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import CafeTables from "./pages/CafeTables";
import NewOrder from "./pages/NewOrder";
import BartenderView from "./pages/BartenderView";
import PoolTables from "./pages/PoolTables";
import PoolLeaderboard from "./pages/PoolLeaderboard";
import ProductsManagement from "./pages/ProductsManagement";
import Reports from "./pages/Reports";
import TableDetail from "./pages/TableDetail";
import UsersManagement from "./pages/UsersManagement";
import PoolManagement from "./pages/PoolManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const RootRedirect = () => {
  const { currentUser } = useApp();

  if (!currentUser) return <Navigate to="/login" replace />;

  if (currentUser.role === 'bartender') {
    return <Navigate to="/bartender" replace />;
  }

  return <Navigate to="/reports" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<RootRedirect />} />

              {/* Waiter specific routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'waiter']}><Outlet /></ProtectedRoute>}>
                <Route path="tables" element={<CafeTables />} />
                <Route path="tables/:id" element={<TableDetail />} />
                <Route path="order/new" element={<NewOrder />} />
              </Route>

              {/* Bartender / Staff routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'waiter', 'bartender']}><Outlet /></ProtectedRoute>}>
                <Route path="bartender" element={<BartenderView />} />
              </Route>

              {/* Pool Manager specific routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'pool_manager']}><Outlet /></ProtectedRoute>}>
                <Route path="pool" element={<PoolTables />} />
                <Route path="pool-management" element={<PoolManagement />} />
                <Route path="leaderboard" element={<PoolLeaderboard />} />
              </Route>

              {/* Admin specific routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']}><Outlet /></ProtectedRoute>}>
                <Route path="products" element={<ProductsManagement />} />
                <Route path="users" element={<UsersManagement />} />
              </Route>

              {/* Shared reports route */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'waiter', 'pool_manager']}><Outlet /></ProtectedRoute>}>
                <Route path="reports" element={<Reports />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
