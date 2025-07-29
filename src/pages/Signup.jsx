import { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import "../styles/Auth.css";
import { useAuthStore } from "../store/auth-store";
export default function Signup() {

  const { signin } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    surname: "",
    dob: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const {
      name,
      surname,
      dob,
      email,
      password,
      confirmPassword,
    } = form;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    // Sign up the user
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data?.user) {
      toast.error(error?.message || "Signup failed");
      setLoading(false);
      return;
    }

    const user = data.user;
    console.log("USER:", user);

    signin(data.user);
    // console.log(authUser);


    // 2️⃣ Create Profile and link to shop
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .insert({
        full_name: `${name} ${surname}`,
        date_of_birth: dob,
        auth_id: user.id,
      })
      .select();

    if (profileError || !profileData || profileData.length === 0) {
      toast.error("Failed to create profile");
      setLoading(false);
      return;
    }

  

    toast.success("Account created successfully!");
    navigate("/shops");
    setLoading(false);
  };

  return (
    <form className="auth-form" onSubmit={handleSignup}>
      <h2>Create Shop Account</h2>
      <input type="text" name="name" placeholder="First Name" onChange={handleChange} required />
      <input type="text" name="surname" placeholder="Surname" onChange={handleChange} required />
      <input type="date" name="dob" onChange={handleChange} required />
      <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
      <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
      <input type="password" name="confirmPassword" placeholder="Confirm Password" onChange={handleChange} required />

      <button type="submit" disabled={loading}>
        {loading ? "Creating account..." : "Sign Up"}
      </button>
    </form>
  );
}
