import { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import "../styles/Auth.css";
import { useAuthStore } from "../store/auth-store";
import { Navigate } from "react-router-dom";

export default function Login() {
  const { signin, user: authUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

    // await signin(user);

    const { data: profileData, error: profileFetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq('auth_id', user.id);
      

    

    if (profileFetchError || !profileData) {
      toast.error("Failed to load profile");
      setLoading(false);
      return;
    }

    signin(profileData[0]);

    console.log("User from supabase", user)
    console.log("User setup from zustand", authUser);
    toast.success("Welcome back 👋");
    navigate("/");
    setLoading(false);
  };

  // if (authUser) {
  //   <Navigate to="/" />;
  // }

  return (
    <form className="auth-form" onSubmit={handleLogin}>
      <h2>Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
