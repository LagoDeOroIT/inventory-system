// src/SignUpForm.js
import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stockRoom, setStockRoom] = useState("");

  const handleSignUp = async () => {
    if (!email || !password || !stockRoom) {
      alert("Fill all fields including assigned stock room");
      return;
    }

    // 1️⃣ Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      alert(authError.message);
      return;
    }

    // 2️⃣ Insert user profile with stock room
    const { error: profileError } = await supabase
      .from("profiles")
      .insert([{ id: authData.user.id, email, stock_room: stockRoom }]);

    if (profileError) {
      alert(profileError.message);
      return;
    }

    alert("Sign up successful! User assigned to stock room: " + stockRoom);

    // optional: clear form
    setEmail("");
    setPassword("");
    setStockRoom("");
  };

  return (
    <div>
      <h2>Sign Up</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <select value={stockRoom} onChange={(e) => setStockRoom(e.target.value)}>
        <option value="">Select Stock Room</option>
        <option value="Room A">Room A</option>
        <option value="Room B">Room B</option>
      </select>

      <button onClick={handleSignUp}>Sign Up</button>
    </div>
  );
}
