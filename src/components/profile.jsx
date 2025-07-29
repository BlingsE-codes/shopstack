import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { toast } from "sonner"; // optional for better UX

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [shopId, setShopId] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        toast.error("Could not get logged-in user");
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, shop_name, user_id, is_admin, logo_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        toast.error("Failed to fetch profile: " + error.message);
        setLoading(false);
        return;
      }

      setShopId(data.shop_id);
      setProfile(data);
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);

    const updates = {
      full_name: profile.full_name,
      shop_name: profile.shop_name,
      shop_location: profile.shop_location,
      birth_date: profile.dob,
      logo_url: profile.logo_url,
    };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", userId);

    if (!error) {
      toast.success("Profile updated");
      setEditing(false);
    } else {
      toast.error("Failed to update profile: " + error.message);
    }

    setSaving(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !userId) return;

    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `logo/${userId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("logo")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error("Failed to upload image: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: publicUrl } = supabase.storage
      .from("logo")
      .getPublicUrl(filePath);

    const newLogoUrl = publicUrl?.publicUrl;
    setProfile((prev) => ({ ...prev, logo_url: newLogoUrl }));

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ logo_url: newLogoUrl })
      .eq("user_id", userId);

    if (!updateError) {
      toast.success("Logo updated!");
    } else {
      toast.error("Failed to update logo: " + updateError.message);
    }

    setUploading(false);
  };

  if (loading) return <p className="loading">Loading profile...</p>;
  if (!profile) return <p className="error">No profile found.</p>;

  return (
    <div className="profile-container">
      <h2>My Shop Profile</h2>

      <div className="profile-logo">
        {profile.logo_url ? (
          <img
            src={profile.logo_url}
            alt="Shop Logo"
            style={{ width: "120px", borderRadius: "10px" }}
          />
        ) : (
          <p>No logo uploaded</p>
        )}

        {editing && (
          <div className="upload-section">
            <input type="file" accept="image/*" onChange={handleLogoUpload} />
            {uploading && <p>Uploading...</p>}
          </div>
        )}
      </div>

      <div className="profile-details">
        <div className="detail-row">
          <label>Full Name:</label>
          {editing ? (
            <input
              type="text"
              name="full_name"
              value={profile.full_name || ""}
              onChange={handleChange}
            />
          ) : (
            <span>{profile.full_name || "-"}</span>
          )}
        </div>

        <div className="detail-row">
          <label>Email:</label>
          <span>{profile.email || "-"}</span>
        </div>

        <div className="detail-row">
          <label>Shop Name:</label>
          {editing ? (
            <input
              type="text"
              name="shop_name"
              value={profile.shop_name || ""}
              onChange={handleChange}
            />
          ) : (
            <span>{profile.shop_name || "-"}</span>
          )}
        </div>

        <div className="detail-row">
          <label>Shop Location:</label>
          {editing ? (
            <input
              type="text"
              name="shop_location"
              value={profile.shop_location || ""}
              onChange={handleChange}
            />
          ) : (
            <span>{profile.shop_location || "-"}</span>
          )}
        </div>

        <div className="detail-row">
          <label>Birth Date:</label>
          {editing ? (
            <input
              type="date"
              name="birth_date"
              value={profile.dob || ""}
              onChange={handleChange}
            />
          ) : (
            <span>{profile.dob || "-"}</span>
          )}
        </div>

        {editing ? (
          <div className="button-group">
            <button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="cancel-btn"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)}>Edit Profile</button>
        )}
      </div>
    </div>
  );
}
