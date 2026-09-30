import React, { useState, useEffect } from 'react';
import CommandHub from './pages/CommandHub';
import OfficerViewer from './pages/OfficerViewer';
import ForensicsLab from './pages/ForensicsLab';
import OfficerImageViewer from './pages/OfficerImageViewer'; // NEW: Imported Image Viewer
import { Shield, UserCircle, Terminal, Microscope, Send, Image as ImageIcon } from 'lucide-react'; // NEW: Added ImageIcon

// Hardcoded authorized personnel
const USERS = ["COMMANDER-ROOT", "OFFICER-RAHUL-7842", "OFFICER-PRIYA-9104"];

export default function App() {
  const [activeUser, setActiveUser] = useState("COMMANDER-ROOT");
  
  // Track which tab is open
  const [activeTab, setActiveTab] = useState("command_hub");

  const isCommander = activeUser === "COMMANDER-ROOT";

  // RBAC Auto-Routing: If the user changes their role, force them to a valid page.
  useEffect(() => {
    if (isCommander) {
      // Commander defaults to the Hub
      setActiveTab("command_hub");
    } else {
      // Officers default to the Text Viewer
      setActiveTab("officer_viewer");
    }
  }, [activeUser, isCommander]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-cyan-900 selection:text-cyan-100">
      
      {/* 1. GLOBAL NAVIGATION & PERSISTENT ROLE SELECTOR */}
      <nav className="bg-slate-900 border-b border-slate-800 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-2xl">
        
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-cyan-500" />
          <div>
            <h1 className="text-xl font-bold text-white tracking-wider">QuantShield</h1>
            <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Military Forensics Network</p>
          </div>
        </div>

        {/* The Role Selector Dropdown */}
        <div className="flex items-center space-x-4 bg-slate-950 p-2 rounded-xl border border-slate-800">
          <span className="text-sm text-slate-400 font-medium pl-2">System Role:</span>
          <div className="relative">
            <UserCircle className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <select 
              value={activeUser}
              onChange={(e) => setActiveUser(e.target.value)}
              className={`pl-10 pr-8 py-2 rounded-lg font-mono text-sm font-bold border outline-none appearance-none cursor-pointer transition-all ${
                isCommander 
                  ? 'bg-red-950/30 border-red-900/50 text-red-400 focus:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                  : 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400 focus:border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
              }`}
            >
              {USERS.map(u => (
                <option key={u} value={u} className="bg-slate-900 text-white">
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>
      </nav>

      {/* 2. DYNAMIC RBAC TAB NAVIGATION */}
      <div className="max-w-6xl mx-auto mt-8 px-6 mb-8 border-b border-slate-800/50 pb-4">
        <div className="flex space-x-4">
          
          {/* Tabs ONLY visible to Commander */}
          {isCommander && (
            <>
              <button
                onClick={() => setActiveTab('command_hub')}
                className={`px-6 py-3 cursor-pointer rounded-lg font-medium transition-all flex items-center ${activeTab === 'command_hub' ? 'bg-red-900/20 text-red-400 border border-red-900/50' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-transparent'}`}
              >
                <Send className="w-4 h-4 mr-2" /> Command Hub
              </button>
              
              <button
                onClick={() => setActiveTab('forensics_lab')}
                className={`px-6 py-3 cursor-pointer rounded-lg font-medium transition-all flex items-center ${activeTab === 'forensics_lab' ? 'bg-cyan-900/20 text-cyan-400 border border-cyan-900/50' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-transparent'}`}
              >
                <Microscope className="w-4 h-4 mr-2" /> Forensics Lab
              </button>
            </>
          )}

          {/* Tabs ONLY visible to Officers */}
          {!isCommander && (
            <>
              <button
                onClick={() => setActiveTab('officer_viewer')}
                className={`px-6 py-3 cursor-pointer rounded-lg font-medium transition-all flex items-center ${activeTab === 'officer_viewer' ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-900/50' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-transparent'}`}
              >
                <Terminal className="w-4 h-4 mr-2" /> Secure Dispatches (Text)
              </button>

              <button
                onClick={() => setActiveTab('officer_image_viewer')}
                className={`px-6 py-3 cursor-pointer rounded-lg font-medium transition-all flex items-center ${activeTab === 'officer_image_viewer' ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-900/50' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-transparent'}`}
              >
                <ImageIcon className="w-4 h-4 mr-2" /> Tactical Intel (Images)
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3. MAIN ROUTER CONTENT */}
      <main className="px-6 pb-20">
        {activeTab === 'command_hub' && isCommander && <CommandHub activeUser={activeUser} />}
        {activeTab === 'forensics_lab' && isCommander && <ForensicsLab />}
        
        {activeTab === 'officer_viewer' && !isCommander && <OfficerViewer activeUser={activeUser} />}
        {/* NEW: Routing for the Image Viewer */}
        {activeTab === 'officer_image_viewer' && !isCommander && <OfficerImageViewer activeUser={activeUser} />}
      </main>

    </div>
  );
}