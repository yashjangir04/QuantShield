import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, ShieldAlert, Cpu, Download, AlertTriangle, FileEdit, Key, Send } from 'lucide-react';

export default function OfficerViewer({ activeUser }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("idle");
  const [viewMode, setViewMode] = useState("memory"); 

  // Commander State
  const [dispatchText, setDispatchText] = useState("OPERATION SENTINEL\n\nTarget coordinates verified.");
  
  // Officer Authentication State
  const [isPromptingKey, setIsPromptingKey] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
  const [keyError, setKeyError] = useState("");

  useEffect(() => {
    setData(null);
    setStatus("idle");
    setIsPromptingKey(false);
    setPrivateKey("");
    setKeyError("");
  }, [activeUser]);

  // --- COMMANDER ACTION ---
  const handleTransmit = async () => {
    setStatus("processing");
    try {
      await axios.post('http://127.0.0.1:8000/api/transmit', {
        document_text: dispatchText
      });
      alert("Dispatch successfully stored in secure database.");
      setStatus("idle");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  // --- OFFICER ACTIONS ---
  const initiateDecryption = () => {
    setIsPromptingKey(true);
  };

  const verifyAndDecrypt = async () => {
    if (privateKey !== "123") {
      setKeyError("CRITICAL: Invalid cryptographic signature.");
      return;
    }
    
    setKeyError("");
    setIsPromptingKey(false);
    setStatus("processing");
    
    try {
      // The Officer no longer sends the text! They just ask the DB for the latest dispatch.
      const response = await axios.post('http://127.0.0.1:8000/api/decrypt', {
        recipient_id: activeUser,
        session_id: `SESSION-${Math.floor(Math.random() * 10000)}`
      });
      
      setData(response.data);
      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  // --- COMMANDER VIEW ---
  if (activeUser === "COMMANDER-ROOT") {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white flex items-center mb-4">
            <ShieldAlert className="w-6 h-6 mr-2 text-red-500" />
            Commander Transmission Terminal
          </h2>
          <div className="space-y-4">
            <label className="flex items-center text-sm font-medium text-slate-400">
              <FileEdit className="w-4 h-4 mr-2" />
              Draft Global Dispatch (Saves to Database)
            </label>
            <textarea
              value={dispatchText}
              onChange={(e) => setDispatchText(e.target.value)}
              className="w-full h-40 bg-slate-950 border border-slate-700 rounded-lg p-4 text-slate-300 font-serif focus:border-red-500 outline-none resize-y"
            />
            <button 
              onClick={handleTransmit}
              disabled={status === 'processing'}
              className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-medium flex items-center justify-center transition-colors"
            >
              <Send className="w-5 h-5 mr-2" />
              {status === 'processing' ? 'Encrypting & Storing...' : 'Transmit to Database'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- OFFICER VIEW ---
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col space-y-4">
        
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center">
              <ShieldAlert className="w-6 h-6 mr-2 text-emerald-500" />
              Secure In-Memory Decryption
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Current Terminal Authorization: <span className="text-cyan-400 font-mono">{activeUser}</span>
            </p>
          </div>
          
          {!data && !isPromptingKey && (
            <button 
              onClick={initiateDecryption}
              disabled={status === 'processing'}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-[0_0_15px_rgba(16,185,129,0.4)] disabled:opacity-50"
            >
              Fetch Latest Dispatch
            </button>
          )}
        </div>

        {isPromptingKey && !data && (
          <div className="mt-4 p-5 bg-slate-950 border border-emerald-900/50 rounded-lg animate-in fade-in slide-in-from-top-2">
            <label className="flex items-center text-sm font-medium text-emerald-500 mb-3">
              <Key className="w-4 h-4 mr-2" />
              Enter Private Cryptographic Key (Testing: 123)
            </label>
            <div className="flex space-x-3">
              <input 
                type="password" 
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-300 font-mono text-sm focus:border-emerald-500 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && verifyAndDecrypt()}
              />
              <button 
                onClick={verifyAndDecrypt}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                Decrypt
              </button>
              <button 
                onClick={() => {setIsPromptingKey(false); setKeyError("");}}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-2.5 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
            {keyError && <p className="text-red-400 text-sm mt-3 flex items-center"><AlertTriangle className="w-4 h-4 mr-1"/> {keyError}</p>}
          </div>
        )}
      </div>

      {data && (
        <div className="grid grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="col-span-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
              <div className="flex space-x-2">
                <button 
                  onClick={() => setViewMode('memory')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center ${viewMode === 'memory' ? 'bg-cyan-900/50 text-cyan-400' : 'text-slate-500'}`}
                >
                  <Cpu className="w-4 h-4 mr-1" /> Raw RAM Buffer
                </button>
              </div>
            </div>

            <div className="p-8 flex-1 bg-white select-text">
              {viewMode === 'text' ? (
                <div className="text-black font-serif text-lg leading-relaxed whitespace-pre-wrap">
                  {data.watermarked_text}
                </div>
              ) : (
                <div className="relative">
                  <img src={data.watermarked_image} alt="In-Memory Buffer" className="w-full shadow-lg" />
                </div>
              )}
            </div>
          </div>

          <div className="col-span-4 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 border-b border-slate-700 pb-2">Forensic Hooks Injected</h3>
              <ul className="space-y-4 text-sm">
                <li className="flex flex-col">
                  <span className="text-emerald-500 font-medium">Layer 1: Zero-Width Unicode</span>
                  <span className="text-slate-500 text-xs mt-1">Invisible ID injected into text stream. Survives copy/paste.</span>
                </li>
                <li className="flex flex-col">
                  <span className="text-cyan-500 font-medium">Layer 2: OpenCV Spatial Grid</span>
                  <span className="text-slate-500 text-xs mt-1">Fiducial anchors & micro-dots rendered in-memory. Survives screenshots.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}