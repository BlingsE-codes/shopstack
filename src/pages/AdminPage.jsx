import { useState } from "react";
import { supabase } from "../services/supabaseClient";
//import "../styles/admin.css"; // ✅ External CSS

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [shopName, setShopName] = useState("");
  const [role, setRole] = useState("shop_owner");

  const handleCreate = async () => {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: "defaultPassword123",
      email_confirm: true,
    });

    if (error) return alert(error.message);

    const userId = data?.user?.id;
    if (userId) {
      const { error: insertError } = await supabase.from("profiles").insert([
  { id: userId, email, shop_name: shopName, role },
]);

if (insertError) {
  alert("User created but failed to insert into profiles: " + insertError.message);
} else {
  alert("User created and added to profiles!");
}

    }
  };

  return (
    <div className="admin-container">
      <div className="admin-card">
        {/* Brand Header */}
        <div className="admin-logo">
          {/* Optionally use an image if you have a logo file */}
          {/* <img src="/logo.png" alt="ShopStack Logo" /> */}
          <h1>ShopStack</h1>
        </div>

        <h2>Add New User</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Shop Name"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="shop_owner">Shop Owner</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={handleCreate}>Create User</button>
      </div>
    </div>
  );
}
