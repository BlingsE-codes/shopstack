import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuthStore } from "../store/auth-store";
import "../styles/Profile.css";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState({
    name: "",
    address: "",
    full_name: "",
    birth_date: "",
    logo_url: "",
    email: "",
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);

      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, date_of_birth, logo_url")
          .eq("id", user.id)
          .single();

        const { data: shopData, error: shopError } = await supabase
          .from("shops")
          .select("name, address")
          .eq("owner_id", user.id)
          .single();

        if (profileError || shopError) {
          console.error("Error fetching profile or shop:", profileError, shopError);
          toast.error("Failed to load profile data");
        } else {
          setProfile({
            full_name: profileData.full_name || "",
            birth_date: profileData.birth_date || "",
            logo_url: profileData.logo_url || "",
            name: shopData.name || "",
            address: shopData.address || "",
            email: user.email || "",
          });
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        toast.error("Unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchProfileData();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          birth_date: profile.birth_date,
          logo_url: profile.logo_url,
        })
        .eq("user_id", user.id);

      // Update shops table
      const { error: shopError } = await supabase
        .from("shops")
        .update({
          name: profile.name,
          address: profile.address,
        })
        .eq("owner_id", user.id);

      if (profileError || shopError) {
        console.error("Update error:", profileError, shopError);
        toast.error("Failed to save changes");
      } else {
        toast.success("Profile updated");
        setEditing(false);
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Unexpected error during save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <div className="profile-container">
      <h2>My Profile</h2>

      <div className="detail-row">
        <label>Shop Name:</label>
        {editing ? (
          <input
            type="text"
            name="name"
            value={profile.name}
            onChange={handleChange}
          />
        ) : (
          <span>{profile.name}</span>
        )}
      </div>

      <div className="detail-row">
        <label>Shop Location:</label>
        {editing ? (
          <input
            type="text"
            name="address"
            value={profile.address}
            onChange={handleChange}
          />
        ) : (
          <span>{profile.address}</span>
        )}
      </div>

      <div className="detail-row">
        <label>Full Name:</label>
        {editing ? (
          <input
            type="text"
            name="full_name"
            value={profile.full_name}
            onChange={handleChange}
          />
        ) : (
          <span>{profile.full_name}</span>
        )}
      </div>

      <div className="detail-row">
        <label>Date of Birth:</label>
        {editing ? (
          <input
            type="date"
            name="birth_date"
            value={profile.birth_date}
            onChange={handleChange}
          />
        ) : (
          <span>{profile.birth_date}</span>
        )}
      </div>

      <div className="detail-row">
        <label>Email:</label>
        <span>{profile.email}</span>
      </div>

      <div className="detail-row">
        <label>Shop Logo URL:</label>
        {editing ? (
          <input
            type="text"
            name="logo_url"
            value={profile.logo_url}
            onChange={handleChange}
          />
        ) : (
          profile.logo_url ? (
            <img
              src={profile.logo_url}
              alt="Shop Logo"
              className="logo-preview"
            />
          ) : (
            <span>No logo</span>
          )
        )}
      </div>

      <div className="btn-group">
        {editing ? (
          <>
            <button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={() => setEditing(false)} className="cancel-btn">
              Cancel
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)}>Edit Profile</button>
        )}
      </div>
    </div>
  );
}
