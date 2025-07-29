import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/Settings.css";

export default function Settings() {
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [preview, setPreview] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [lastUpdated, setLastUpdated] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const shop_id = localStorage.getItem("shop_id");

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("Failed to fetch user");
        return;
      }

      if (!shop_id) {
        toast.error("Missing shop ID. Please log in again.");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("shop_name, logo_url, email, updated_at")
        .eq("user_id", user.id)
        .eq("shop_id", shop_id)
        .maybeSingle();

      if (error || !data) {
        toast.error("Profile not found");
        return;
      }

      setEmail(data.email);
      setShopName(data.shop_name || "");
      setLogoUrl(data.logo_url || "");
      if (data.updated_at) {
        setLastUpdated(new Date(data.updated_at).toLocaleString());
      }
    };

    fetchProfile();
  }, [shop_id]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async () => {
    if (!shopName.trim()) {
      toast.warning("Shop name cannot be empty");
      return;
    }

    setLoading(true);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      toast.error("User not found");
      setLoading(false);
      return;
    }

    let finalLogoUrl = logoUrl;

    if (logoFile) {
      const fileExt = logoFile.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(filePath, logoFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        toast.error("Failed to upload logo");
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("logos")
        .getPublicUrl(filePath);

      finalLogoUrl = publicUrlData?.publicUrl || "";
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        shop_name: shopName,
        logo_url: finalLogoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("shop_id", shop_id);

    if (updateError) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully");
      setLogoUrl(finalLogoUrl);
      setPreview("");
      setLogoFile(null);
      setLastUpdated(new Date().toLocaleString());
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    const confirmDelete = confirm(
      "Are you sure you want to delete your shop? This action cannot be undone."
    );
    if (!confirmDelete) return;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !shop_id) {
      toast.error("Missing shop or user info");
      return;
    }

    await supabase.from("sales").delete().eq("shop_id", shop_id);
    await supabase.from("products").delete().eq("shop_id", shop_id);
    await supabase.from("profiles").delete().eq("user_id", user.id);
    await supabase.from("shops").delete().eq("id", shop_id);

    await supabase.auth.signOut();
    localStorage.clear();
    toast.success("Shop deleted. Redirecting...");
    navigate("/signup");
  };

  return (
    <div className="settings-container">
      <h2>⚙️ Shop Settings</h2>

      <div className="input-group">
        <label>Email (read only)</label>
        <input value={email} disabled />
      </div>

      <div className="input-group">
        <label>Shop Name</label>
        <input
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
        />
      </div>

      <div className="input-group">
        <label>Upload Shop Logo</label>
        <input type="file" accept="image/*" onChange={handleLogoUpload} />
        {(preview || logoUrl) && (
          <img
            src={preview || logoUrl}
            alt="Logo Preview"
            className="logo-preview"
          />
        )}
      </div>

      {lastUpdated && (
        <p className="last-updated">Last updated: {lastUpdated}</p>
      )}

      <button onClick={handleUpdate} className="btn" disabled={loading}>
        {loading ? "Updating..." : "✅ Update Profile"}
      </button>

      <hr />

      <button className="btn delete" onClick={handleDelete}>
        🗑️ Delete Shop
      </button>
    </div>
  );
}
