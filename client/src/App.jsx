import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navebar";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Employee from "./pages/Employee";
import Product from "./pages/Product";

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLoginSuccess = (userData, token) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <Router>
      {user && <Navbar user={user} onLogout={handleLogout} />}
      <div className="container">
        <Routes>
          <Route
            path="/login"
            element={
              !user ? (
                <Login onLoginSuccess={handleLoginSuccess} />
              ) : (
                <Navigate to="/home" />
              )
            }
          />
          <Route
            path="/home"
            element={user ? <Home user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/employee"
            element={user ? <Employee /> : <Navigate to="/login" />}
          />
          <Route
            path="/product"
            element={user ? <Product /> : <Navigate to="/login" />}
          />
          <Route
            path="*"
            element={<Navigate to={user ? "/home" : "/login"} />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
