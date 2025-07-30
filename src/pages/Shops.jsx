import React, { useEffect, useState } from "react";
import "../styles/shop.css";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth-store";
import { useShopStore } from "../store/shop-store";
import { supabase } from "../services/supabaseClient";
import { toast } from "sonner";

export default function Shops() {
  const { user } = useAuthStore();
  const { setShop } = useShopStore();
  const [shops, setShops] = useState([]);
  const [editingShopId, setEditingShopId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("owner_id", user.id);

    if (error) {
      toast.error("Failed to fetch shops");
    } else {
      setShops(data);
    }
    setLoading(false);
  };

  const handleShopEntry = async (shopId) => {
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("id", shopId)
      .single();
    if (error) {
      toast.error("Failed to enter shop");
      return;
    }
    setShop(data);
    navigate(`/shops/${shopId}`);
    
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this shop?"
    );
    if (!confirm) return;

    const { error } = await supabase.from("shops").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete shop");
    } else {
      toast.success("Shop deleted");
      fetchShops();
    }
  };

  const startEdit = (shop) => {
    setEditingShopId(shop.id);
    setEditName(shop.name);
    setEditAddress(shop.address);
  };

  const cancelEdit = () => {
    setEditingShopId(null);
    setEditName("");
    setEditAddress("");
  };

  const saveEdit = async () => {
    if (!editName || !editAddress) {
      toast.error("Fields cannot be empty");
      return;
    }

    const { error } = await supabase
      .from("shops")
      .update({ name: editName, address: editAddress })
      .eq("id", editingShopId)
      .eq("owner_id", user.id);

    if (error) {
      toast.error("Failed to update shop");
    } else {
      toast.success("Shop updated");
      setEditingShopId(null);
      fetchShops();
    }
  };

  if (loading) {
    return <div className="loading">Loading your shops...</div>;
  }

  if (shops.length === 0) {
    return (
      <div className="empty-shop-wrapper">
        <h2>You don't have any shops yet.</h2>
        <button onClick={() => navigate("/create-shop")}>Create Shop</button>
      </div>
    );
  }

  return (
    <div className="shop-wrapper">
      <button onClick={() => navigate("/create-shop")}>Create Shop</button>
      <h2 className="title">Your Shops</h2>
      <div className="shop-list">
        {shops.map((shop) => (
          <div className="shop-card" key={shop.id}>
            {editingShopId === shop.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Shop Name"
                />
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Shop Address"
                />
                <div className="btn-group">
                  <button className="save-btn" onClick={saveEdit}>
                    Save
                  </button>
                  <button className="cancel-btn" onClick={cancelEdit}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>{shop.name}</h3>
                <p className="address">{shop.address}</p>
                <ul className="facilities">
                  <li>🛒 Inventory Management</li>
                  <li>📦 Stock Tracking</li>
                  <li>📊 Sales Analytics</li>
                  <li>👥 Staff Access</li>
                  <li>💵 POS Support</li>
                  <li>Settings</li>
                  <li>Shop Profile</li>
                </ul>
                <div className="btn-group">
                  <button
                    className="enter-btn"
                    onClick={() => handleShopEntry(shop.id)}
                  >
                    Enter
                  </button>
                  <button className="edit-btn" onClick={() => startEdit(shop)}>
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(shop.id)}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
