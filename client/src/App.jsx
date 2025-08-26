// client/src/App.jsx

import React from "react"
import { Routes, Route } from "react-router-dom"
import Register from "./pages/Register"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Vote from "./pages/Vote"
import Dashboard from "./pages/Dashboard"
import Results from "./pages/Results"
import BlockchainExplorer from "./pages/BlockchainExplorer"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/vote" element={<Vote />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/results" element={<Results />} />
      <Route path="/blockchain" element={<BlockchainExplorer />} />
    </Routes>
  )
}

export default App
