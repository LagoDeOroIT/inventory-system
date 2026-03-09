// src/LoginForm.jsx
import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stockRoom, setStockRoom] = useState(null);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    setStockRoom(null);

    if (!email || !password) return setError("Please enter email and password.");

    // 1️⃣ Log in via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) return setError(authError.message);

    // 2️⃣ Fetch user profile to get assigned stock room
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stock_room")
      .eq("id", authData.user.id)
      .single();
    if (profileError) return setError(profileError.message);

    setStockRoom(profile.stock_room);
    alert("Login successful! Your stock room: " + profile.stock_room);
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
          width: "400px",
          backgroundColor: "#fff",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#333" }}>
          Login
        </h2>

        {error && (
          <p style={{ color: "red", textAlign: "center", marginBottom: "15px" }}>{error}</p>
        )}

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
            marginBottom: "20px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />

        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#007bff",
            color: "#fff",
            fontWeight: "bold",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginBottom: "15px",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#0056b3")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#007bff")}
        >
          Login
        </button>

        {stockRoom && (
          <p style={{ marginTop: "10px", textAlign: "center", color: "#333" }}>
            You have access to stock room: <strong>{stockRoom.join ? stockRoom.join(", ") : stockRoom}</strong>
          </p>
        )}
      </div>
    </div>
  );
}
