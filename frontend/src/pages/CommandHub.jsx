import React, { useState } from 'react';
import axios from 'axios';
import { Send, Lock, CheckCircle2, Server } from 'lucide-react';

export default function CommandHub() {
  const [documentText, setDocumentText] = useState("OPERATION SENTINEL\n\nTarget coordinates verified. Proceed with phase two deployment at 0400 hours. Do not engage until visual confirmation is established.");
  const [status, setStatus] = useState("idle");
  const [ledgerData, setLedgerData] = useState(null);

  const handleBroadcast = async () => {
    setStatus("processing");
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/distribute', {
        document_text: documentText,
        recipients: ["OFFICER-RAHUL-7842", "OFFICER-PRIYA-9104"]
      });
      
      setLedgerData(response.data.ledger_block);
      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-12 gap-6">
      
      {/* Left Column: Command & Control */}
      <div className="col-span-8 space-y-6">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Lock className="w-5 h-5 mr-2 text-cyan-500" />
            Classified Document Ingestion
          </h2>
          
          <textarea 
            value={documentText}
            onChange={(e) => setDocumentText(e.target.value)}
            className="w-full h-64 bg-slate-950 border border-slate-700 rounded-lg p-4 text-slate-300 font-mono text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none resize-none mb-6"
            placeholder="Enter classified dispatch here..."
          />

          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Authorized Recipients: <span className="text-slate-200 font-mono">2 Nodes</span>
            </div>
            
            <button 
              onClick={handleBroadcast}
              disabled={status === 'processing'}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center shadow-[0_0_15px_rgba(8,145,178,0.5)] disabled:opacity-50"
            >
              {status === 'processing' ? (
                <span className="animate-pulse">Encrypting (AES-256)...</span>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Broadcast Encrypt (Hybrid PQC)
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Live P2P Ledger Terminal */}
      <div className="col-span-4">
        <div className="bg-[#0a0a0a] rounded-xl border border-slate-800 h-full overflow-hidden flex flex-col">
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-300 flex items-center">
              <Server className="w-4 h-4 mr-2 text-emerald-500" />
              Live P2P Ledger
            </span>
            <span className="flex space-x-1">
              <span className="w-2 h-2 rounded-full bg-slate-600"></span>
              <span className="w-2 h-2 rounded-full bg-slate-600"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </span>
          </div>
          
          <div className="p-4 font-mono text-xs space-y-3 flex-1">
            <div className="text-slate-500">Waiting for local consensus...</div>
            
            {status === 'processing' && (
              <>
                <div className="text-cyan-400">[+] Generating AES-256-GCM symmetric key...</div>
                <div className="text-cyan-400">[+] Encapsulating with ML-KEM (Kyber)...</div>
              </>
            )}

            {status === 'success' && ledgerData && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                <div className="text-emerald-500 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-2" />
                  Block #{ledgerData.block_id} Committed to Local SQLite
                </div>
                <div className="text-slate-400 break-all">
                  <span className="text-slate-500">HASH:</span> {ledgerData.hash}
                </div>
                <div className="text-slate-400 break-all">
                  <span className="text-slate-500">SIG:</span> {ledgerData.signature}
                </div>
                <div className="text-cyan-600 mt-2">-- BROADCAST COMPLETE --</div>
              </div>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}