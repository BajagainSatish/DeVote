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
import AnonymousVote from "./pages/AnonymousVote"
import VotingFlowDiagram from "./pages/VotingFlowDiagram"
import VoteAnonymous from "./pages/VoteAnonymous"

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
      <Route path="/anonymous-vote" element={<AnonymousVote />} />
      <Route path="/vote-anonymous" element={<VoteAnonymous />} />
      <Route path="/flow-diagram" element={<VotingFlowDiagram />} />

    </Routes>
  )
}

export default App
