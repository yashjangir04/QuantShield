import React, { useState } from 'react';
import axios from 'axios';
import { Shield, Image as ImageIcon, AlertTriangle, Lock } from 'lucide-react';

export default function OfficerImageViewer() {
  const [mapImage, setMapImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // The active officer's session data
  const officerId = "OFFICER-PRIYA-9104"; // Using a different ID for the image demo
  const sessionId = "SESS-IMG-8891";

  const loadTacticalMap = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/api/decrypt_image',
        { recipient_id: officerId, session_id: sessionId },
        { responseType: 'blob' } // CRITICAL: Tell Axios to expect a binary file
      );

      // Convert the secure blob into a local display URL in RAM
      const imageUrl = URL.createObjectURL(response.data);
      setMapImage(imageUrl);
    } catch (err) {
      console.error(err);
      setError('Decryption failed. Active post-quantum session required.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-emerald-400 flex items-center">
            <Lock className="w-6 h-6 mr-2" /> Tactical Image Terminal
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-slate-400 text-sm">Auth: {officerId}</span>
            <button 
              onClick={loadTacticalMap}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded font-medium flex items-center transition-colors disabled:opacity-50"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              {loading ? 'Executing DWT-DCT...' : 'Decrypt Intel Map'}
            </button>
          </div>
        </div>

        <div className="p-6 bg-slate-950 min-h-[500px] flex flex-col items-center justify-center relative">
          {error && (
            <div className="text-red-500 flex items-center bg-red-950/30 px-4 py-2 rounded-lg border border-red-900/50 mb-4">
              <AlertTriangle className="w-5 h-5 mr-2" /> {error}
            </div>
          )}

          {!mapImage && !error && !loading && (
            <div className="text-slate-600 text-center flex flex-col items-center">
              <ImageIcon className="w-20 h-20 mb-4 opacity-20" />
              <p className="text-lg">Awaiting Private Key Decryption Handshake</p>
              <p className="text-sm mt-2 opacity-50">Image payload will be rendered exclusively in volatile memory.</p>
            </div>
          )}

          {mapImage && (
            <div className="relative group w-full flex justify-center">
              {/* Layer 1 Countermeasure: Disable native dragging and right-clicking */}
              <img 
                src={mapImage} 
                alt="Tactical Map" 
                className="max-w-full max-h-[70vh] rounded border border-slate-700 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                onContextMenu={(e) => e.preventDefault()} 
                onDragStart={(e) => e.preventDefault()}
              />
              
              <div className="absolute top-4 right-4 bg-slate-900/90 text-emerald-400 text-xs px-3 py-1.5 rounded flex items-center border border-emerald-900/50 backdrop-blur-sm shadow-lg">
                <Shield className="w-3 h-3 mr-2" /> 
                DWT-DCT Mid-Frequency Embedding Active
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}