import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export default function LoginForm() {

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [error,setError] = useState("");

  const handleLogin = async () => {

    setError("");

    if(!email || !password){
      return setError("Enter email and password");
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if(error){
      setError(error.message);
    }

  };

  return (

    <div style={{
      display:"flex",
      justifyContent:"center",
      alignItems:"center",
      minHeight:"100vh",
      background:"#f3f4f6"
    }}>

      <div style={{
        width:400,
        background:"#fff",
        padding:30,
        borderRadius:10,
        boxShadow:"0 4px 10px rgba(0,0,0,0.15)"
      }}>

        <h2 style={{textAlign:"center"}}>Login</h2>

        {error && <p style={{color:"red"}}>{error}</p>}

        <input
          placeholder="Email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          style={{width:"100%",padding:10,marginBottom:10}}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e=>setPassword(e.target.value)}
          style={{width:"100%",padding:10,marginBottom:20}}
        />

        <button
          onClick={handleLogin}
          style={{
            width:"100%",
            padding:12,
            background:"#111827",
            color:"#fff",
            border:"none",
            borderRadius:6
          }}
        >
          Login
        </button>

      </div>

    </div>
  );
}
