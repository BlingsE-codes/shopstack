import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuthStore } from "../store/auth-store";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css"; // Use same style as login/signup

export default function CreateShop() {
  const { user } = useAuthStore();
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!shopName || !shopAddress) {
      toast.error("Please fill in all fields");
      return;
    }

    const { data, error } = await supabase.from("shops").insert({
      name: shopName,
      address: shopAddress,
      owner_id: user.id,
    });

    if (error) {
      toast.error("Failed to create shop: " + error.message);
      return;
    }

    toast.success("Shop created successfully! 🚀");
    setShopName("");
    setShopAddress("");

    // Navigate after a short delay
    setTimeout(() => navigate("/shops"), 1000);
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Create New Shop</h2>

        <input
          type="text"
          name="shop-name"
          placeholder="Enter Shop Name"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          required
        />

        <input
          type="text"
          name="shop-address"
          placeholder="Enter Shop Address"
          value={shopAddress}
          onChange={(e) => setShopAddress(e.target.value)}
          required
        />

        <button type="submit">Create Shop</button>
      </form>
    </div>
  );
}
