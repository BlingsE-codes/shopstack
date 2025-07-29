import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "./services/supabaseClient";

export default function ProtectedRoute({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  if (isLoading) return <div>Loading...</div>;

  return session ? children : <Navigate to="/login" />;
}
