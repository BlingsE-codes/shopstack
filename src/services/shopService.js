// services/shopService.js
import { supabase } from "../supabaseClient"; // your Supabase setup


export async function getUserShop() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (error) throw error;
  return data;
}
