import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://mkfhjklomofrvnnwwknh.supabase.co";
const supabaseKey = "YOUR_KEY_HERE";

export const supabase = createClient(supabaseUrl, supabaseKey);
