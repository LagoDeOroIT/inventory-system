// src/SignUpForm.jsx
import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stockRoom, setStockRoom] = useState("");

  const handleSignUp = async () => {
    if (!email || !password || !stockRoom) {
      return alert("Please fill all fields including assigned stock room.");
    }

    // 1️⃣ Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) return alert(authError.message);

    // 2️⃣ Insert user profile with stock room
    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: authData.user.id,
        email,
        stock_room: stockRoom,
      },
    ]);

    if (profileError) return alert(profileError.message);

    alert("Sign up successful! User assigned to stock room: " + stockRoom);

    // Clear form
    setEmail("");
    setPassword("");
    setStockRoom("");
  };

  return (
    <div style={{ maxWidth: "400px", margin: "20px auto" }}>
      <h2>Sign Up</h2>
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
      <select
        value={stockRoom}
        onChange={(e) => setStockRoom(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: "10px" }}
      >
        <option value="">Select Stock Room</option>
        <option value="Room A">Room A</option>
        <option value="Room B">Room B</option>
      </select>
      <button onClick={handleSignUp} style={{ width: "100%" }}>
        Sign Up
      </button>
    </div>
  );
}
