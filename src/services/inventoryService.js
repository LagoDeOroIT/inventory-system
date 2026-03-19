import { supabase } from "./supabaseClient";

export const getInventory = async () => {
  return await supabase
    .from("inventory")
    .select("id, name, stock, price")
    .limit(50);
};
