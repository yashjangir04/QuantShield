import React, { useState, useRef } from 'react';
import axios from 'axios';
import Cropper from 'react-cropper';
import { Search, UploadCloud, AlertOctagon, CheckCircle2, FileText, Image as ImageIcon, Crop, RefreshCw, Type } from 'lucide-react';

export default function ForensicsLab() {
  const [activeTab, setActiveTab] = useState('photo_upload'); // 'digital_text' or 'photo_upload'
  const [evidenceType, setEvidenceType] = useState('text_photo'); // 'text_photo' or 'map_photo'
  
  const [leakedText, setLeakedText] = useState("");
  
  // Image State
  const [imgSrc, setImgSrc] = useState('');
  const cropperRef = useRef(null);
  
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);

  const handleTextAnalyze = async () => {
    setStatus("processing");
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/investigate/text', {
        leaked_text: leakedText
      });
      setResult(response.data);
      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setResult(null);
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleImageAnalyze = async () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    
    setStatus("processing");

    // CropperJS handles all the scaling and canvas math automatically!
    cropper.getCroppedCanvas().toBlob(async (blob) => {
      if (!blob) {
        setStatus("error");
        return;
      }
      
      const formData = new FormData();
      formData.append("file", blob, "cropped_evidence.png");

      // DYNAMIC ROUTING: Send to K-Means (Text) or DWT-DCT (Map)
      const targetEndpoint = evidenceType === 'text_photo' 
        ? 'http://127.0.0.1:8000/api/investigate/text_scan'
        : 'http://127.0.0.1:8000/api/investigate/image';

      try {
        const response = await axios.post(targetEndpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setResult(response.data);
        setStatus("success");
      } catch (error) {
        console.error(error);
        setStatus("error");
      }
    }, 'image/png');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Investigation Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="flex border-b border-slate-800">
          <button 
            onClick={() => {setActiveTab('digital_text'); setResult(null); setStatus('idle');}}
            className={`flex-1 py-4 flex justify-center items-center font-medium transition-colors ${activeTab === 'digital_text' ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-400 hover:bg-slate-800/50'}`}
          >
            <Type className="w-4 h-4 mr-2" /> Digital Clipboard Leak
          </button>
          <button 
            onClick={() => {setActiveTab('photo_upload'); setResult(null); setStatus('idle');}}
            className={`flex-1 py-4 flex justify-center items-center font-medium transition-colors ${activeTab === 'photo_upload' ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-400 hover:bg-slate-800/50'}`}
          >
            <ImageIcon className="w-4 h-4 mr-2" /> Physical Camera Leak
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'digital_text' ? (
            <div className="max-w-4xl mx-auto space-y-4">
              <textarea 
                value={leakedText}
                onChange={(e) => setLeakedText(e.target.value)}
                className="w-full h-40 bg-slate-950 border border-slate-700 rounded-lg p-4 text-slate-300 font-mono text-sm focus:border-cyan-500 outline-none resize-none"
                placeholder="Paste the suspected leaked digital text (Zero-Width verification) here..."
              />
              <button 
                onClick={handleTextAnalyze}
                disabled={status === 'processing' || !leakedText}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-lg font-medium flex items-center justify-center disabled:opacity-50 transition-colors"
              >
                <Search className="w-5 h-5 mr-2" /> Run Zero-Width Extraction
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Algorithm Selector for Camera Leaks */}
              <div className="flex space-x-4 max-w-4xl mx-auto">
                <button
                  onClick={() => setEvidenceType('text_photo')}
                  className={`flex-1 py-3 rounded border flex items-center justify-center transition-colors ${
                    evidenceType === 'text_photo' 
                      ? 'bg-cyan-900/30 border-cyan-500 text-cyan-400' 
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'
                  }`}
                >
                  <FileText className="w-5 h-5 mr-2" />
                  1. Document Photo (Spatial Grid)
                </button>
                <button
                  onClick={() => setEvidenceType('map_photo')}
                  className={`flex-1 py-3 rounded border flex items-center justify-center transition-colors ${
                    evidenceType === 'map_photo' 
                      ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' 
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'
                  }`}
                >
                  <ImageIcon className="w-5 h-5 mr-2" />
                  2. Tactical Map Photo (DWT-DCT)
                </button>
              </div>

              {!imgSrc ? (
                <div className="max-w-4xl mx-auto border-2 border-dashed border-slate-700 rounded-lg p-12 flex flex-col items-center justify-center bg-slate-950">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={onSelectFile}
                    className="hidden" 
                    id="file-upload" 
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center text-slate-400 hover:text-emerald-400 transition-colors">
                    <UploadCloud className="w-12 h-12 mb-3" />
                    <span className="font-medium text-lg">Upload Camera Evidence</span>
                    <span className="text-sm mt-1 text-slate-500">Supports JPG, PNG smartphone captures</span>
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  
                  {/* LEFT SIDE: Image Cropper */}
                  <div className="lg:col-span-3 space-y-3">
                    <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800 text-sm">
                      <span className="text-slate-400 flex items-center"><Crop className="w-4 h-4 mr-2" /> Isolate Payload Area</span>
                    </div>
                    
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-2">
                      <Cropper
                        src={imgSrc}
                        style={{ height: 550, width: "100%" }}
                        initialAspectRatio={NaN}
                        guides={true}
                        ref={cropperRef}
                        viewMode={1}
                        background={false}
                        responsive={true}
                        autoCropArea={0.8}
                        checkOrientation={false}
                      />
                    </div>
                  </div>

                  {/* RIGHT SIDE: Action Buttons */}
                  <div className="lg:col-span-1 flex flex-col space-y-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 flex-1 flex flex-col">
                      <h3 className="text-white font-semibold mb-2">Forensic Actions</h3>
                      <p className="text-slate-400 text-sm mb-6 flex-1">
                        Draw a box around the payload area to remove background noise, then initiate the selected extraction algorithm.
                      </p>
                      
                      <div className="space-y-3">
                        <button 
                          onClick={() => {setImgSrc(''); setResult(null);}} 
                          className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-medium flex items-center justify-center transition-colors"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" /> Upload New
                        </button>

                        <button 
                          onClick={handleImageAnalyze}
                          disabled={status === 'processing'}
                          className={`w-full text-white py-3 rounded-lg font-medium flex items-center justify-center transition-colors shadow-lg ${
                            evidenceType === 'text_photo' 
                              ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-900/20' 
                              : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'
                          }`}
                        >
                          <Search className="w-5 h-5 mr-2" /> 
                          {status === 'processing' ? 'Extracting...' : 'Run Scan'}
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Verdict Panel */}
      {result && (
        <div className={`border rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4 ${result.status === 'confirmed_attribution' ? 'bg-red-950/20 border-red-900/50' : 'bg-slate-900 border-slate-800'}`}>
          <div className="flex items-start justify-between mb-6 border-b border-slate-800/50 pb-4">
            <h3 className="text-xl font-bold flex items-center text-white">
              {result.status === 'confirmed_attribution' ? (
                <><AlertOctagon className="w-6 h-6 mr-2 text-red-500" /> Attribution Confirmed</>
              ) : (
                <><CheckCircle2 className="w-6 h-6 mr-2 text-slate-500" /> No Payload Detected</>
              )}
            </h3>
          </div>

          {result.status === 'confirmed_attribution' ? (
            <div className="grid grid-cols-2 gap-4 font-mono text-sm">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div className="text-slate-500 mb-1">Guilty Party (ID)</div>
                <div className="text-red-400 font-bold text-lg">{result.recipient_id}</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div className="text-slate-500 mb-1">Blockchain Validation</div>
                <div className="text-emerald-400">Non-Repudiated (Matched Local Ledger)</div>
              </div>
              <div className="col-span-2 bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div className="text-slate-500 mb-1">Extraction Vector</div>
                <div className="text-slate-300">{result.vector}</div>
              </div>
            </div>
          ) : (
            <div className="text-slate-400">{result.message}</div>
          )}
        </div>
      )}

    </div>
  );
}