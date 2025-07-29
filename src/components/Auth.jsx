
// import { useState } from "react";
// import { supabase } from "../services/supabaseClient";
// import { useNavigate } from "react-router-dom";
// import { toast } from "sonner";
// import "../styles/Auth.css";

// export default function Auth() {
//   const navigate = useNavigate();
//   const [isLogin, setIsLogin] = useState(true);
//   const [loading, setLoading] = useState(false);

//   const [form, setForm] = useState({
//     name: "",
//     surname: "",
//     dob: "",
//     shop_name: "",
//     shop_address: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//   });

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const {
//       name,
//       surname,
//       dob,
//       shop_name,
//       shop_address,
//       email,
//       password,
//       confirmPassword,
//     } = form;

//     if (!isLogin && password !== confirmPassword) {
//       toast.error("Passwords do not match");
//       return;
//     }

//     setLoading(true);

//     try {
//       let userId = null;

//       if (!isLogin) {
//         // Sign up new user
//         const { data, error } = await supabase.auth.signUp({
//           email,
//           password,
//         });

//         if (error) throw error;
//         userId = data?.user?.id;

//         // Workaround: If userId is still null, fetch session manually
//         if (!userId) {
//           const {
//             data: { session },
//           } = await supabase.auth.getSession();
//           userId = session?.user?.id;
//         }

//         if (!userId) {
//           toast.error("Unable to get user ID after signup");
//           setLoading(false);
//           return;
//         }

//         // Call function to create shop + profile
//         const { error: funcError } = await supabase.rpc("create_shop_with_profile", {
//           shop_name,
//           shop_location: shop_address,
//           email,
//           name: name + " " + surname,
//           dob,
//           user_id: userId,
//         });

//         if (funcError) {
//           toast.error("Error creating shop/profile: " + funcError.message);
//           setLoading(false);
//           return;
//         }

//         // Fetch shop_id to store
//         const { data: profileData, error: profileErr } = await supabase
//           .from("profiles")
//           .select("shop_id")
//           .eq("user_id", userId)
//           .single();

//         if (profileErr) {
//           toast.error("Failed to retrieve shop ID");
//           setLoading(false);
//           return;
//         }

//         localStorage.setItem("shop_id", profileData.shop_id);
//       } else {
//         // Login flow
//         const { data, error } = await supabase.auth.signInWithPassword({
//           email,
//           password,
//         });

//         if (error) throw error;
//         userId = data?.user?.id;

//         if (!userId) {
//           toast.error("Login failed: No user ID");
//           setLoading(false);
//           return;
//         }

//         const { data: profileData, error: profileErr } = await supabase
//           .from("profiles")
//           .select("shop_id")
//           .eq("user_id", userId)
//           .single();

//         if (profileErr || !profileData) {
//           toast.error("Failed to load profile");
//           setLoading(false);
//           return;
//         }

//         localStorage.setItem("shop_id", profileData.shop_id);
//       }

//       toast.success("Welcome to ShopStack 🚀");
//       navigate("/dashboard");
//     } catch (err) {
//       console.error(err);
//       toast.error("Unexpected error occurred: " + err.message);
//     }

//     setLoading(false);
//   };

//   return (
//     <div className="auth-container">
//       <form className="auth-form" onSubmit={handleSubmit}>
//         <h2>{isLogin ? "Login" : "Create Shop Account"}</h2>

//         {!isLogin && (
//           <>
//             <input
//               type="text"
//               name="name"
//               placeholder="First Name"
//               value={form.name}
//               onChange={handleChange}
//               required
//             />
//             <input
//               type="text"
//               name="surname"
//               placeholder="Surname"
//               value={form.surname}
//               onChange={handleChange}
//               required
//             />
//             <input
//               type="date"
//               name="dob"
//               value={form.dob}
//               onChange={handleChange}
//               required
//             />
//             <input
//               type="text"
//               name="shop_name"
//               placeholder="Shop Name"
//               value={form.shop_name}
//               onChange={handleChange}
//               required
//             />
//             <input
//               type="text"
//               name="shop_address"
//               placeholder="Shop Address"
//               value={form.shop_address}
//               onChange={handleChange}
//               required
//             />
//           </>
//         )}

//         <input
//           type="email"
//           name="email"
//           placeholder="Email"
//           value={form.email}
//           onChange={handleChange}
//           required
//         />
//         <input
//           type="password"
//           name="password"
//           placeholder="Password"
//           value={form.password}
//           onChange={handleChange}
//           required
//         />
//         {!isLogin && (
//           <input
//             type="password"
//             name="confirmPassword"
//             placeholder="Confirm Password"
//             value={form.confirmPassword}
//             onChange={handleChange}
//             required
//           />
//         )}

//         <button type="submit" disabled={loading}>
//           {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
//         </button>

//         <p>
//           {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
//           <span
//             onClick={() => setIsLogin(!isLogin)}
//             style={{ color: "blue", cursor: "pointer" }}
//           >
//             {isLogin ? "Sign up" : "Login"}
//           </span>
//         </p>
//       </form>
//     </div>
//   );
// }
