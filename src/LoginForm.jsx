// src/LoginForm.jsx
import React from "react";
import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stockRoom, setStockRoom] = useState(null); // user's stock room
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
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

    // Optional: you can redirect to inventory page here instead of alert
  };

  return (
    <div>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: "10px" }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: "10px" }}
      />
      <button onClick={handleLogin} style={{ width: "100%" }}>
        Login
      </button>
      {stockRoom && (
        <p style={{ marginTop: "10px" }}>
          You have access to stock room: <strong>{stockRoom}</strong>
        </p>
      )}
    </div>
  );
}
