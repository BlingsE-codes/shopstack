import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuthStore } from "../store/auth-store";
import { toast } from "sonner";
import "../styles/Settings.css";

export default function Settings() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [logoFile, setLogoFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        toast.error("Failed to load profile");
        return;
      }

      setProfile(data);
      setShopName(data.shop_name || "");
      setShopAddress(data.shop_address || "");
    };

    const fetchUsers = async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (!error) setUsers(data);
    };

    fetchProfile();
    fetchUsers();
  }, [user]);

  /** ----------------- Update Shop Info ----------------- */
  const handleUpdateShop = async () => {
    const { error } = await supabase
      .from("profiles")
      .update({ shop_name: shopName, shop_address: shopAddress })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to update shop info");
    } else {
      toast.success("Shop info updated!");
    }
  };

  /** ----------------- Change Password ----------------- */
  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      setNewPassword("");
    }
  };

  /** ----------------- Change Logo ----------------- */
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setPreviewURL(URL.createObjectURL(file));
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) {
      toast.error("Please select a logo first.");
      return;
    }

    setUploading(true);

    const fileExt = logoFile.name.split(".").pop();
    const fileName = `${user.id}.${fileExt}`;
    const filePath = `shop-logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("shop-logos")
      .upload(filePath, logoFile, { upsert: true });

    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("shop-logos").getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ logo_url: publicUrl })
      .eq("id", user.id);

    if (updateError) {
      toast.error("Failed to save logo URL");
    } else {
      toast.success("Logo updated!");
      setProfile((prev) => ({ ...prev, logo_url: publicUrl }));
      setLogoFile(null);
      setPreviewURL(null);
    }

    setUploading(false);
  };

  /** ----------------- Manage Users ----------------- */
  const handleToggleAdmin = async (userId, isAdmin) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: !isAdmin })
      .eq("id", userId);

    if (error) {
      toast.error("Failed to update user role");
    } else {
      toast.success("User role updated!");
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId ? { ...u, is_admin: !isAdmin } : u
        )
      );
    }
  };

  const handleRemoveUser = async (userId) => {
    const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
    if (error) {
      toast.error("Failed to remove user");
    } else {
      toast.success("User removed!");
      setUsers((prev) => prev.filter((u) => u.user_id !== userId));
    }
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>

      {/* Shop Info */}
      <div className="settings-section">
        <h3>Shop Info</h3>
        <input
          type="text"
          placeholder="Shop Name"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Shop Address"
          value={shopAddress}
          onChange={(e) => setShopAddress(e.target.value)}
        />
        <button onClick={handleUpdateShop}>Update Shop Info</button>
      </div>

      {/* Change Logo */}
      <div className="settings-section">
        <h3>Shop Logo</h3>
        {profile?.logo_url && (
          <div className="logo-preview">
            <img src={profile.logo_url} alt="Current Logo" />
          </div>
        )}
        {previewURL && (
          <div className="logo-preview">
            <img src={previewURL} alt="New Logo Preview" />
          </div>
        )}
        <input type="file" accept="image/*" onChange={handleLogoChange} />
        <button onClick={handleLogoUpload} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload Logo"}
        </button>
      </div>

      {/* Change Password */}
      <div className="settings-section">
        <h3>Change Password</h3>
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button onClick={handleChangePassword}>Update Password</button>
      </div>

      {/* Manage Users */}
      <div className="settings-section">
        <h3>Manage Users</h3>
        <ul className="user-list">
          {users.map((u) => (
            <li key={u.user_id}>
              {u.email} - {u.is_admin ? "Admin" : "User"}
              <div>
                <button
                  onClick={() => handleToggleAdmin(u.user_id, u.is_admin)}
                >
                  {u.is_admin ? "Revoke Admin" : "Make Admin"}
                </button>
                <button onClick={() => handleRemoveUser(u.user_id)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
