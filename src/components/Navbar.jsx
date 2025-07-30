import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { Menu } from "lucide-react";
import "../styles/Navbar.css";
import { useAuthStore } from "../store/auth-store";

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  // useEffect(() => {
  //   const fetchUserProfile = async () => {
  //     const { data: { user } } = await supabase.auth.getUser();
  //     setUser(user);

  //     if (user) {
  //       const { data, error } = await supabase
  //         .from("profiles")
  //         .select("*")
  //         .eq("user_id", user.id) // ✅ fixed key
  //         .single();

  //       if (data && !error) {
  //         setProfile(data);
  //       }
  //     }
  //   };

  //   fetchUserProfile();

  //   const { data: authListener } = supabase.auth.onAuthStateChange(
  //     async (_event, session) => {
  //       const user = session?.user || null;
  //       setUser(user);

  //       if (user) {
  //         const { data } = await supabase
  //           .from("profiles")
  //           .select("*")
  //           .eq("user_id", user.id) // ✅ fixed key
  //           .single();
  //         setProfile(data);
  //       } else {
  //         setProfile(null);
  //       }
  //     }
  //   );

  //   return () => authListener.subscription.unsubscribe();
  // }, []);

  const handleLogout = async () => {
    // await supabase.auth.signOut();
    // setUser(null);
    // setProfile(null);
    logout();
    navigate("login");
  };

  return (
    <nav className="navbar">
      <button className="menu-icon" onClick={onToggleSidebar}>
        <Menu size={24} />
      </button>

      <Link to="/">
        <h1 className="logo">ShopStack</h1>
      </Link>

      {profile?.shop_name && (
        <span className="welcome-text">Welcome, {profile.shop_name}</span>
      )}

      <div className="nav-buttons">
        {!user ? (
          <Link to="/login" className="btn btn-auth">
            Login / Signup
          </Link>
        ) : (
          <>
            <button className="btn btn-auth" onClick={handleLogout}>
              Logout
            </button>

            <Link to="/shops">Shop Profile</Link>
            {/* <Link to="/products">Products</Link> */}
          </>
        )}
      </div>
    </nav>
  );
}
