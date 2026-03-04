// SignUpForm.jsx
import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stockRooms, setStockRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  const allStockRooms = [
    "L1","L2 Room 1","L2 Room 2","L2 Room 3","L2 Room 4","L3","L4","L5","L6","L7",
    "Maintenance Bodega 1","Maintenance Bodega 2","Maintenance Bodega 3","SKI Stock Room","Quarry Stock Room"
  ];

  const handleSignUp = async () => {
    if (!email || !password) return alert("Enter email & password");
    if (stockRooms.length === 0) return alert("Select at least one stock room");

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      // Create user profile and store allowed stock rooms
      if (data.user?.id) {
        const { error: profileError } = await supabase
          .from("user_stock_rooms")
          .insert(stockRooms.map(room => ({ user_id: data.user.id, stock_room: room })));

        if (profileError) throw profileError;
      }

      alert("Sign-up successful! Check your email to confirm.");
      setEmail("");
      setPassword("");
      setStockRooms([]);
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12, maxWidth:400 }}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e=>setEmail(e.target.value)}
        style={{ padding:8, borderRadius:6, border:"1px solid #d1d5db" }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e=>setPassword(e.target.value)}
        style={{ padding:8, borderRadius:6, border:"1px solid #d1d5db" }}
      />
      <label style={{ fontWeight:600 }}>Allowed Stock Rooms:</label>
      <div style={{ maxHeight:120, overflowY:"auto", border:"1px solid #d1d5db", borderRadius:6, padding:8 }}>
        {allStockRooms.map(room => (
          <label key={room} style={{ display:"block", marginBottom:4 }}>
            <input
              type="checkbox"
              checked={stockRooms.includes(room)}
              onChange={e => {
                if(e.target.checked) setStockRooms(prev => [...prev, room]);
                else setStockRooms(prev => prev.filter(r => r!==room));
              }}
            />{" "}
            {room}
          </label>
        ))}
      </div>
      <button
        onClick={handleSignUp}
        disabled={loading}
        style={{ padding:10, borderRadius:6, border:"none", background:"#1f2937", color:"#fff", cursor:"pointer" }}
      >
        {loading ? "Signing Up..." : "Sign Up"}
      </button>
    </div>
  );
}
