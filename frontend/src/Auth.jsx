import React, { useState } from 'react';
import axios from 'axios';

function Auth({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegister ? "register" : "login";
    const payload = isRegister ? { username, email, password } : { username, password };

    try {
      const res = await axios.post(`https://practice-project1-1.onrender.com/${endpoint}`, payload);
      
      if (!isRegister) {
        // CORRECTED: Store BOTH the username and the JWT token
        localStorage.setItem("username", res.data.username);
        localStorage.setItem("token", res.data.access_token); 
        
        // Let the App know we are logged in
        onLogin(res.data.username);
      } else {
        alert("Registration successful! You can now login.");
        setIsRegister(false);
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Error connecting to server");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", padding: "30px", backgroundColor: "white", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", fontFamily: "sans-serif" }}>
      <h2 style={{ textAlign: "center", color: "#333" }}>{isRegister ? "Create Account" : "Login"}</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required style={inputStyle} />
        {isRegister && (
          <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
        )}
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
        <button type="submit" style={buttonStyle}>{isRegister ? "Sign Up" : "Login"}</button>
      </form>
      <p style={{ textAlign: "center", marginTop: "15px", cursor: "pointer", color: "#007bff", fontSize: "14px" }} onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? "Already have an account? Login" : "New here? Create an account"}
      </p>
    </div>
  );
}

const inputStyle = { padding: "12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "16px" };
const buttonStyle = { padding: "12px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "16px" };

export default Auth;