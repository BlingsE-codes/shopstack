import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import "../styles/Sidebar.css";

export default function Sidebar({ isOpen }) {
  const location = useLocation();
  const [profile, setProfile] = useState(null);

  const navLinks = [
    { path: "/", label: "Dashboard" },
    { path: "/products", label: "Products" },
    { path: "/sales", label: "Sales" },
    { path: "/expenses", label: "Expenses" },
    { path: "/reports", label: "Reports" },
    { path: "/settings", label: "Settings" },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("user_id", user.id) // ✅ fixed key
          .single();

        if (profileData) setProfile(profileData);
      }
    };

    fetchProfile();
  }, []);

  const isAdmin = profile?.role === "admin";
  const displayName = profile?.full_name || (isAdmin ? "Admin" : "Shop Owner");

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <h2>🔳 {displayName}</h2>
      </div>

      <nav className="nav-links">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`nav-link ${
              location.pathname === link.path ? "active" : ""
            }`}
          >
            {link.label}
          </Link>
        ))}

        {isAdmin && (
          <Link to="/users" className="nav-link">
            Manage Users
          </Link>
        )}

        <Link to="/profile" className="nav-link">
          My Profile
        </Link>
      </nav>
    </aside>
  );
}
