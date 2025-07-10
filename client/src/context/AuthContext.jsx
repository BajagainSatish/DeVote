import React, { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [voterId, setVoterId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  const login = ({ voterId, admin = false }) => {
    setVoterId(voterId);
    setIsAdmin(admin);
  };

  const logout = () => {
    setVoterId(null);
    setIsAdmin(false);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ voterId, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for cleaner usage
export const UseAuth = () => useContext(AuthContext);
