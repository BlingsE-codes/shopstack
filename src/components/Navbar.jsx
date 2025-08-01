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

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("shop_name")
        .eq("user_id", user.id)
        .single();

      if (data && !error) {
        setProfile(data);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">

      <Link to="/" className="navbar-brand">
  {profile?.logo_url ? (
    <>
      <img src={profile.logo_url} alt="Shop Logo" className="shop-logo" />
      <span className="shop-name">{profile.shop_name}</span>
    </>
  ) : (
    <h1 className="logo">ShopStack</h1>
  )}
</Link>

    

      <button className="menu-icon" onClick={onToggleSidebar}>
        <Menu size={24} />
      </button>

      {/* <Link to="/">
        <h1 className="logo">ShopStack</h1>
      </Link> */}

      {profile?.shop_name && (
        <div className="welcome-message">
          👋 Welcome, <span>{profile.shop_name}</span>
        </div>
      )}

      <div className="nav-buttons">
        {!user ? (
          <Link to="/login" className="btn btn-auth">
            Login / Signup
          </Link>
        ) : (
          <>
            <Link to="/shops" className="btn btn-shopprofile">
              Shop Profile
            </Link>
            <button className="btn btn-auth" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
