import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Auth from './Auth';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(localStorage.getItem("username") || null);
  const [notification, setNotification] = useState({ message: "", type: "", visible: false });
  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");

  // Detect screen size for responsive styling
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener('resize', handleResize);
    if (user) fetchTasks();
    localStorage.setItem("theme", darkMode ? "dark" : "light");
    return () => window.removeEventListener('resize', handleResize);
  }, [user, darkMode]);

  const showNotification = (msg, type = "success") => {
    setNotification({ message: msg, type: type, visible: true });
    setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), 3000);
  };

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`https://practice-project1.onrender.com/tasks?username=${user}`, getAuthHeaders());
      setTasks(res.data);
    } catch (err) {
      if (err.response?.status === 401) handleLogout(); 
    }
  };

  const addTask = async () => {
    if (!title.trim()) return showNotification("Task title is required", "error");
    try {
      await axios.post("https://practice-project1.onrender.com/tasks", { title, category, owner: user }, getAuthHeaders());
      showNotification("Task added! 🚀");
      setTitle(""); 
      fetchTasks(); 
    } catch (err) {
      showNotification("Failed to add task", "error");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setTasks([]);
  };

  const deleteTask = async (id) => {
    if (window.confirm("Delete this task?")) {
      try {
        await axios.delete(`http://localhost:8000/tasks/${id}`, getAuthHeaders());
        showNotification("Task removed", "info");
        fetchTasks(); 
      } catch (error) {
        showNotification("Delete failed", "error");
      }
    }
  };

  const toggleComplete = async (id, currentStatus) => {
    try {
      await axios.put(`http://localhost:8000/tasks/${id}?completed=${!currentStatus}`, {}, getAuthHeaders());
      fetchTasks();
    } catch (error) { console.error(error); }
  };

  const getCategoryColor = (cat) => {
    const colors = { Urgent: "#ff4d4d", Work: "#007bff", Personal: "#28a745" };
    return colors[cat] || "#6c757d";
  };

  const filteredTasks = tasks.filter(t => 
    (filter === "All" || t.category === filter) &&
    t.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) return <Auth onLogin={setUser} />;

  const theme = {
    bg: darkMode ? "#121212" : "#f8f9fa",
    card: darkMode ? "#1e1e1e" : "#ffffff",
    text: darkMode ? "#e0e0e0" : "#212529",
    border: darkMode ? "#333" : "#dee2e6"
  };

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: "100vh", padding: isMobile ? "20px 10px" : "40px 20px", color: theme.text, transition: "0.3s" }}>
      
      {notification.visible && (
        <div style={{ position: "fixed", top: "10px", right: "10px", left: isMobile ? "10px" : "auto", padding: "12px", borderRadius: "8px", color: "white", textAlign: "center", backgroundColor: notification.type === "error" ? "#e74c3c" : "#2ecc71", boxShadow: "0 4px 12px rgba(0,0,0,0.2)", zIndex: 1000 }}>
          {notification.message}
        </div>
      )}

      <div style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: theme.card, padding: isMobile ? "20px" : "30px", borderRadius: "16px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" }}>
          <button onClick={() => setDarkMode(!darkMode)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer" }}>{darkMode ? "☀️" : "🌙"}</button>
          <span style={{ fontWeight: "bold" }}>{user}</span>
          <button onClick={handleLogout} style={{ color: "#d9534f", border: "none", background: "none", cursor: "pointer" }}>Logout</button>
        </div>

        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Task Manager</h2>

        {/* Responsive Add Task Section */}
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "10px", marginBottom: "20px" }}>
          <input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="What needs to be done?" 
            style={{ flex: 2, padding: "12px", borderRadius: "8px", border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text }} 
          />
          <div style={{ display: "flex", gap: "10px", flex: 1 }}>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "8px", backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.border}` }}>
              <option value="General">General</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="Urgent">Urgent</option>
            </select>
            <button onClick={addTask} style={{ padding: "10px 20px", backgroundColor: "#2ecc71", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold" }}>Add</button>
          </div>
        </div>

        {/* Search */}
        <input 
          placeholder="🔍 Search..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          style={{ width: "100%", padding: "10px", marginBottom: "20px", borderRadius: "8px", border: `1px solid ${theme.border}`, boxSizing: "border-box" }}
        />

        {/* Task List */}
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          {filteredTasks.map(task => (
            <div key={task._id} style={{ display: "flex", justifyContent: "space-between", padding: "15px 0", borderBottom: `1px solid ${theme.border}`, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <input type="checkbox" checked={task.completed} onChange={() => toggleComplete(task._id, task.completed)} style={{ transform: "scale(1.2)" }} />
                <span style={{ textDecoration: task.completed ? "line-through" : "none", color: task.completed ? "#888" : theme.text }}>{task.title}</span>
                <span style={{ fontSize: "10px", color: "white", backgroundColor: getCategoryColor(task.category), padding: "2px 6px", borderRadius: "4px" }}>{task.category}</span>
              </div>
              <button onClick={() => deleteTask(task._id)} style={{ color: "#fa5252", background: "none", border: "none", cursor: "pointer" }}>🗑️</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;