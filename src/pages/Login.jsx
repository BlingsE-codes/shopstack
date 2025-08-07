import { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import "../styles/Auth.css";
import { useAuthStore } from "../store/auth-store";
import { useShopStore } from "../store/shop-store";

export default function Login() {
  const { signin, user: authUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // ⬅️ New State
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { shop } = useShopStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const user = data?.user;
    if (!user) {
      toast.error("User not found");
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileFetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_id", user.id);

    if (profileFetchError || !profileData?.length) {
      toast.error("Failed to load profile");
      setLoading(false);
      return;
    }

    signin(profileData[0]);
    toast.success(`Welcome back 👋`);
    navigate("/");
    setLoading(false);
  };

  if (authUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleLogin}>
        <h1>Welcome to ShopStack</h1>
        <p className="auth-subtitle">Login to your account</p>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="toggle-password-btn"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="auth-toggle">
          Don’t have an account?{" "}
          <Link to="/signup" className="toggle">
            Sign up here
          </Link>
        </p>
      </form>
    </div>
  );
}
