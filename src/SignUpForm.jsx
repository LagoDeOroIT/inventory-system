// src/SignUpForm.jsx
import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export default function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stockRooms, setStockRooms] = useState([]);

  const stockRoomOptions = [
    "L1","L2 Room 1","L2 Room 2","L2 Room 3","L2 Room 4","L3","L4","L5","L6","L7",
    "Maintenance Bodega 1","Maintenance Bodega 2","Maintenance Bodega 3","SKI Stock Room","Quarry Stock Room"
  ];

  const handleSignUp = async () => {
    if (!email || !password || stockRooms.length === 0) {
      return alert("Please fill all fields including assigned stock rooms.");
    }

    // 1️⃣ Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError) return alert(authError.message);

    // 2️⃣ Insert user profile with stock rooms (array)
    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: authData.user.id,
        email,
        stock_room: stockRooms,
      },
    ]);
    if (profileError) return alert(profileError.message);

    alert("Sign up successful! User assigned to stock rooms: " + stockRooms.join(", "));

    // Clear form
    setEmail("");
    setPassword("");
    setStockRooms([]);
  };

  const toggleStockRoom = (room) => {
    if (stockRooms.includes(room)) {
      setStockRooms(stockRooms.filter((r) => r !== room));
    } else {
      setStockRooms([...stockRooms, room]);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f0f2f5",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <div
        style={{
          width: "420px",
          backgroundColor: "#fff",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#333" }}>
          Create Your Account
        </h2>

        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
          Email
        </label>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "15px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />

        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
          Password
        </label>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "15px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />

        <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}>
          Assign Stock Rooms
        </label>
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "5px",
            padding: "10px",
            maxHeight: "150px",
            overflowY: "auto",
            backgroundColor: "#fafafa",
            marginBottom: "20px",
          }}
        >
          {stockRoomOptions.map((room) => (
            <div key={room} style={{ marginBottom: "5px" }}>
              <label style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={stockRooms.includes(room)}
                  onChange={() => toggleStockRoom(room)}
                  style={{ marginRight: "8px" }}
                />
                {room}
              </label>
            </div>
          ))}
        </div>

        <button
          onClick={handleSignUp}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#007bff",
            color: "#fff",
            fontWeight: "bold",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#0056b3")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#007bff")}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}
