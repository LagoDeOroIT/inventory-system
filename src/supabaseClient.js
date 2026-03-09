// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://mkfhjklomofrvnnwwknh.supabase.co";
const supabaseKey = "sb_publishable_h3A6YfbcGgg4A6UeuaDMBA_MUfBbsEU";

export const supabase = createClient(supabaseUrl, supabaseKey);
