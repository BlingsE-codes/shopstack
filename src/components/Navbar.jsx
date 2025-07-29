import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { Menu } from "lucide-react";
import "../styles/Navbar.css";

export default function Navbar({ onToggleSidebar }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id) // ✅ fixed key
          .single();

        if (data && !error) {
          setProfile(data);
        }
      }
    };

    fetchUserProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const user = session?.user || null;
        setUser(user);

        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id) // ✅ fixed key
            .single();
          setProfile(data);
        } else {
          setProfile(null);
        }
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <nav className="navbar">
      <button className="menu-icon" onClick={onToggleSidebar}>
        <Menu size={24} />
      </button>

      <h1 className="logo">ShopStack</h1>

      {profile?.shop_name && (
        <span className="welcome-text">Welcome, {profile.shop_name}</span>
      )}

      <div className="nav-buttons">
        {!user ? (
          <Link to="/auth" className="btn btn-auth">
            Login / Signup
          </Link>
        ) : (
          <button className="btn btn-auth" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
