import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "./services/supabaseClient";
import Navbar from "./components/Navbar";
import { useAuthStore } from "./store/auth-store";
import { useNavigate } from "react-router-dom";
// export default function ProtectedRoute({ children }) {
//   const [isLoading, setIsLoading] = useState(true);
//   const [session, setSession] = useState(null);

//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setSession(session);
//       setIsLoading(false);
//     });

//     const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
//       setSession(session);
//     });

//     return () => listener?.subscription.unsubscribe();
//   }, []);

//   if (isLoading) return <div>Loading...</div>;

//   return session ? children : <Navigate to="/login" />;
// }

export default function ProtectedRoute({ children }) {
  const { user } = useAuthStore();
  useEffect(() => {
    console.log("From ProtectedRoute", user);
  }, [])
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div>
      <Navbar />
      {children}
    </div>
  );
}
