import React, { useEffect, useState } from "react";
import "../styles/shop.css";

import { useAuthStore } from "../store/auth-store";

import { supabase } from "../services/supabaseClient";
import { toast } from "sonner";

export default function Shop() {
  const { user } = useAuthStore();
  const [shops, setShops] = useState([]);
  useEffect(() => {
    const fetchShops = async () => {
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .eq("owner_id", user.id);
      if (error) {
        toast.error("Failed to fetch shops");
      }

      setShops(data);
    };
    fetchShops();
  }, [user.id]);

  <div className="shop-wrapper">
    {shops.length === 0 ? (
      <>
        <h4>You don't have any shops.</h4>
        <button>Kindly create one.</button>
      </>
    ) : (
      JSON.stringify(shops)
    )}
  </div>;
}
