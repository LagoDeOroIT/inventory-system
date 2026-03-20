import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ksqdtaeajczxyptazmtr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzcWR0YWVhamN6eHlwdGF6bXRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MDAzODcsImV4cCI6MjA4OTQ3NjM4N30.QNls7uULhk_0-m7ahhvOMAgmCF2ibQ3_TAUt7YD6JuA";

export const supabase = createClient(supabaseUrl, supabaseKey);
