// App.jsx
import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { supabase } from "./services/supabaseClient";
import Shop from "./pages/Shop";

import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import { Toaster } from "sonner";

import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Sales from "./components/Sales";
import SalesHistory from "./components/SalesHistory";
import SalesChart from "./components/SalesChart";
import Expenses from "./components/Expenses";
import AdminPage from "./pages/AdminPage";
import Report from "./components/Report";
import Settings from "./components/settings";
import Profile from "./components/profile";
import Shops from "./pages/Shops";

import Signup from "./pages/Signup";
import Login from "./pages/Login";

import "./index.css";
import CreateShop from "./pages/CreateShop";

// export default function App() {
//   const [user, setUser] = useState(null);
//   const [isSidebarOpen, setSidebarOpen] = useState(false);
//   const location = useLocation();

//   useEffect(() => {
//     const loadUser = async () => {
//       const { data: { session } } = await supabase.auth.getSession();
//       setUser(session?.user || null);
//     };

//     loadUser();

//     const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
//       setUser(session?.user || null);
//     });

//     return () => authListener.subscription.unsubscribe();
//   }, []);

//   useEffect(() => {
//     setSidebarOpen(false);
//   }, [location.pathname]);

//   if (user === undefined) return <div>Loading...</div>;

//   const privateRoutes = [
//     { path: "/", element: <Dashboard /> },
//     { path: "/products", element: <Products /> },
//     { path: "/sales", element: <Sales /> },
//     { path: "/saleshistory", element: <SalesHistory /> },
//     { path: "/saleschart", element: <SalesChart /> },
//     { path: "/expenses", element: <Expenses /> },
//     { path: "/admin", element: <AdminPage />, admin: true },
//     { path: "/reports", element: <Report /> },
//     { path: "/settings", element: <Settings /> },
//     { path: "/profile", element: <Profile /> },
//     { path: "/shops", element: <Shop /> },
//   ];

//   return (
//     <div className="main-layout">
//       <Toaster position="top-center" richColors closeButton />

//       {!user ? (
//         <Routes>
//           <Route path="/dashboard" element={<Login />} />
//           <Route path="/login" element={<Login />} />
//           <Route path="/signup" element={<Signup />} />
//           <Route path="*" element={<Navigate to="/login" replace />} />
//         </Routes>
//       ) : (
//         <div className="app-container">
//           <Sidebar isOpen={isSidebarOpen} />
//           <div className="main-content">
//             <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
//             <AnimatePresence mode="wait">
//               <Routes location={location} key={location.pathname}>
//                 {privateRoutes.map(({ path, element, admin }) => (
//                   <Route
//                     key={path}
//                     path={path}
//                     element={
//                       admin
//                         ? <AdminRoute>{element}</AdminRoute>
//                         : <ProtectedRoute>{element}</ProtectedRoute>
//                     }
//                   />
//                 ))}
//                 <Route path="/login" element={<Navigate to="/" replace />} />
//                 <Route path="/signup" element={<Navigate to="/" replace />} />
//               </Routes>
//             </AnimatePresence>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

export default function App() {
  return (
    <Routes>
      <Route
        index
        element={
          <ProtectedRoute>
            <Shops />
          </ProtectedRoute>
        }
      />

      <Route
        path="shops"
        element={
          <ProtectedRoute>
            <Shops />
          </ProtectedRoute>
        }
      />
      <Route
        path="create-shop"
        element={
          <ProtectedRoute>
            <CreateShop />
          </ProtectedRoute>
        }
      />
      <Route
        path="shops/:id"
        element={
          <ProtectedRoute>
            <Shop />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        {/* <Route path="shops/:id/products" element={<Products />} />
        <Route path="shops/:id/products" element={<Products />} />
        <Route path="shops/:id/products" element={<Products />} /> */}
      </Route>
      <Route path="login" element={<Login />} />
      <Route path="signup" element={<Signup />} />
    </Routes>
  );
}
