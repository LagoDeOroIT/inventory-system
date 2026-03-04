import React, { useState } from "react";
import { supabase } from "./supabaseClient"; // your supabase client

const stockRooms = ["L1", "L2 Room 1", "L2 Room 2", "Warehouse A"];

export default function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [message, setMessage] = useState("");

  const handleRoomChange = (e) => {
    const options = Array.from(e.target.selectedOptions).map(
      (option) => option.value
    );
    setSelectedRooms(options);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // 1️⃣ Create Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setMessage(`Auth Error: ${authError.message}`);
      return;
    }

    const userId = authData.user.id;

    // 2️⃣ Create profile with stock room access
    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: userId,
        email,
        allowed_stock_rooms: selectedRooms,
      },
    ]);

    if (profileError) {
      setMessage(`Profile Error: ${profileError.message}`);
      return;
    }

    setMessage("User created successfully!");
    setEmail("");
    setPassword("");
    setSelectedRooms([]);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <select multiple value={selectedRooms} onChange={handleRoomChange}>
        {stockRooms.map((room) => (
          <option key={room} value={room}>
            {room}
          </option>
        ))}
      </select>
      <button type="submit">Create User</button>
      {message && <p>{message}</p>}
    </form>
  );
}
