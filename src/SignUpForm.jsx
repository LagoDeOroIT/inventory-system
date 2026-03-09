// src/SignUpForm.jsx
import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export default function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stockRooms, setStockRooms] = useState([]);
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");

  const stockRoomOptions = [
    "L1","L2 Room 1","L2 Room 2","L2 Room 3","L2 Room 4","L3","L4","L5","L6","L7",
    "Maintenance Bodega 1","Maintenance Bodega 2","Maintenance Bodega 3","SKI Stock Room","Quarry Stock Room"
  ];

  // Toggle checkbox selection
  const toggleStockRoom = (room) => {
    setStockRooms(stockRooms.includes(room)
      ? stockRooms.filter(r => r !== room)
      : [...stockRooms, room]
    );
  };

  // Async signup handler
  const handleSignUp = async () => {
    setError("");

    if (!email || !password || stockRooms.length === 0) {
      return setError("Please fill all fields including assigned stock rooms.");
    }

    try {
      // 1️⃣ Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) {
        console.error("Supabase Auth signUp error:", authError);
        return setError("Auth error: " + authError.message);
      }

      console.log("Auth user created:", authData.user);

      // 2️⃣ Insert user profile
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: authData.user.id,
          email,
          stock_room: stockRooms,
          role,
        },
      ]);
      if (profileError) {
        console.error("Profile insert error:", profileError);
        return setError("Profile insert error: " + profileError.message);
      }

      alert(`Sign up successful! Assigned stock rooms: ${stockRooms.join(", ")}. Role: ${role}`);

      // Clear form
      setEmail(""); setPassword(""); setStockRooms([]); setRole("user");

    } catch (err) {
      console.error("Unexpected error during signup:", err);
      setError("Unexpected error: " + err.message);
    }
  };

  return (
    <div style={{
      display:"flex", justifyContent:"center", alignItems:"center", minHeight:"100vh", backgroundColor:"#f0f2f5",
      fontFamily:"'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div style={{
        width:"420px", backgroundColor:"#fff", padding:"30px", borderRadius:"10px", boxShadow:"0 4px 12px rgba(0,0,0,0.15)"
      }}>
        <h2 style={{textAlign:"center", marginBottom:"20px", color:"#333"}}>Create Your Account</h2>
        {error && <p style={{color:"red", textAlign:"center", marginBottom:"15px"}}>{error}</p>}

        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          style={{width:"100%", padding:"10px", marginBottom:"15px", borderRadius:"5px", border:"1px solid #ccc"}}/>

        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          style={{width:"100%", padding:"10px", marginBottom:"15px", borderRadius:"5px", border:"1px solid #ccc"}}/>

        <label>Assign Stock Rooms</label>
        <div style={{
          border:"1px solid #ccc", borderRadius:"5px", padding:"10px", maxHeight:"150px",
          overflowY:"auto", backgroundColor:"#fafafa", marginBottom:"20px"
        }}>
          {stockRoomOptions.map(room => (
            <div key={room} style={{marginBottom:"5px"}}>
              <label>
                <input type="checkbox" checked={stockRooms.includes(room)} onChange={()=>toggleStockRoom(room)}
                  style={{marginRight:"8px"}}/>
                {room}
              </label>
            </div>
          ))}
        </div>

        <label>Role</label>
        <select value={role} onChange={e => setRole(e.target.value)}
          style={{width:"100%", padding:"10px", marginBottom:"20px", borderRadius:"5px", border:"1px solid #ccc"}}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        <button onClick={handleSignUp} style={{
          width:"100%", padding:"12px", backgroundColor:"#007bff", color:"#fff", fontWeight:"bold",
          border:"none", borderRadius:"5px", cursor:"pointer"
        }}
        onMouseOver={e => e.target.style.backgroundColor="#0056b3"}
        onMouseOut={e => e.target.style.backgroundColor="#007bff"}>
          Sign Up
        </button>
      </div>
    </div>
  );
}
