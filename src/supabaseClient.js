// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = https://mkfhjklomofrvnnwwknh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rZmhqa2xvbW9mcnZubnd3a25oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMTczNzAsImV4cCI6MjA4ODU5MzM3MH0.6Q8p9ms8mnf2daONf7HTP3jGZD_bQuNQrv6cpy0ZUts";

export const supabase = createClient(supabaseUrl, supabaseKey);
