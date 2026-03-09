import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stockRooms, setStockRooms] = useState([]);
  const [role, setRole] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    setStockRooms([]);
    setRole("");

    if (!email || !password) {
      return setError("Please enter email and password.");
    }

    try {
      // 1️⃣ Log in via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) return setError(authError.message);
      if (!authData.user) return setError("Login failed. User not found.");

      // 2️⃣ Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("stock_room, role")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profileError) return setError(profileError.message);
      if (!profile) return setError("Profile not found for this user.");

      // Ensure stock_room is always an array
      const stockRoomsArray = Array.isArray(profile.stock_room)
        ? profile.stock_room
        : profile.stock_room
        ? [profile.stock_room]
        : [];

      setStockRooms(stockRoomsArray);
      setRole(profile.role || "user");
    } catch (err) {
      setError("Unexpected error during login: " + err.message);
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
          width: "400px",
          backgroundColor: "#fff",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#333" }}>Login</h2>

        {error && (
          <p style={{ color: "red", textAlign: "center", marginBottom: "15px" }}>{error}</p>
        )}

        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "5px", border: "1px solid #ccc" }}
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "20px", borderRadius: "5px", border: "1px solid #ccc" }}
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

        {/* Display role and stock rooms */}
        {role && (
          <div style={{ textAlign: "center", color: "#333" }}>
            <p>
              Role: <strong>{role}</strong>
            </p>
            <p>
              Assigned Stock Rooms:{" "}
              <strong>{stockRooms.length > 0 ? stockRooms.join(", ") : "None"}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
