// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtaHB5ZGJzeXN4amlrZ2h4amliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1OTc1NzUsImV4cCI6MjA4NDE3MzU3NX0.AYzyQMAIZKsJFrm4cqv60zmJ76QPk4wKlZdBKkRHsYw";

export const supabase = createClient(supabaseUrl, supabaseKey);
