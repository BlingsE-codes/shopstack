import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuthStore } from "../store/auth-store";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function CreateShop() {
  const { user } = useAuthStore();
  const [shopName, setShopName] = useState("");

  const [shopAddress, setShopAddress] = useState("");
    const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (shopName === "" || shopAddress === "") {
      toast.error("Please fill in all fields");
      return;
    } else {
        console.log(user.id);
      const { data, error } = await supabase.from("shops").insert({
        name: shopName,
        address: shopAddress,
        owner_id: user.id,
      });

      if (error) {
        toast.error("Failed to create shop: " + error.message);
        return;
      }
      console.log("Shop created:", data);
      navigate("/shops");
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Create New Shop</h2>
      <input
        type="text"
        name="shop-name"
        placeholder="Enter Shop Name"
        onChange={(e) => setShopName(e.target.value)}
        required
      />
      <input
        type="text"
        name="shop-address"
        placeholder="Enter Shop Address"
        onChange={(e) => setShopAddress(e.target.value)}
        required
      />

      <button type="submit">Create Shop</button>
    </form>
  );
}
