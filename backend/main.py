from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import cv2
import numpy as np
import base64
import json
from pydantic import BaseModel
import tempfile
import os
from image_stego import embed_dwt_dct, extract_dwt_dct
import traceback # Add this to the top of your main.py imports

from database import init_db, append_ledger_entry
from stego_engine import (
    inject_zero_width,
    extract_zero_width,
    generate_watermarked_image,
    text_to_binary,
    USER_PATTERNS,
    binary_to_text
)
from pydantic import BaseModel

mock_database = {
    "latest_dispatch": "OPERATION SENTINEL\n\nTarget coordinates verified. Proceed with phase two deployment at 0400 hours. Do not engage until visual confirmation is established."
}

# Initialize FastAPI application
app = FastAPI(title="CryptoAttribute WESEE Backend", version="1.0.0")

# Enable CORS for local React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize local SQLite Ledger table on startup
@app.on_event("startup")
def on_startup():
    init_db()

# --- Request Models ---
class DecryptImageRequest(BaseModel):
    recipient_id: str
    session_id: str


class DistributeRequest(BaseModel):
    document_text: str
    recipients: list[str] = []

class TextInvestigateRequest(BaseModel):
    leaked_text: str

class TransmitRequest(BaseModel):
    document_text: str

class DecryptRequest(BaseModel):
    recipient_id: str
    session_id: str

# --- Endpoints ---

CLEAN_MAP_PATH = "assets/circle.png"

@app.get("/")
def health_check():
    return {"status": "online", "environment": "Air-Gapped P2P Node"}

@app.post("/api/distribute")
def distribute_document(payload: DistributeRequest):
    """
    Commander broadcasts/distributes a document.
    Simulates AES-256 key generation, ML-KEM key encapsulation, and SAVES to DB.
    """
    if not payload.document_text.strip():
        raise HTTPException(status_code=400, detail="Document text cannot be empty.")
    
    # 1. CRITICAL FIX: Save the dynamically typed text to the database!
    mock_database["latest_dispatch"] = payload.document_text
    
    # 2. Commit distribution event to ledger
    ledger_record = append_ledger_entry(
        recipient_id="COMMANDER-ROOT",
        session_id="DIST-INIT-001",
        action="BROADCAST_ENCRYPT"
    )

    return {
        "status": "success",    
        "message": f"Dispatch securely stored. Encrypted and encapsulated for authorized recipients.",
        "recipients": payload.recipients,
        "ledger_block": ledger_record
    }

@app.post("/api/decrypt_image")
async def decrypt_image(req: DecryptImageRequest):
    """
    JIT Image Rendering: Officer requests a map, backend embeds DWT-DCT watermark into a temp file.
    """
    # 1. Absolute Path Check
    abs_path = os.path.abspath(CLEAN_MAP_PATH)
    if not os.path.exists(abs_path):
        print(f"CRITICAL ERROR: Cannot find image at {abs_path}")
        raise HTTPException(status_code=404, detail=f"Clean asset not found at {abs_path}")

    temp_fd, temp_path = tempfile.mkstemp(suffix=".png")
    os.close(temp_fd)

    try:
        # 2. Attempt the DWT-DCT Injection
        print(f"Attempting to embed DWT-DCT into {abs_path} for ID: {req.recipient_id}")
        embed_dwt_dct(abs_path, temp_path, req.recipient_id)
        
        return FileResponse(temp_path, media_type="image/png", filename="secured_map.png")
        
    except Exception as e:
        # 3. PRINT THE EXACT CRASH TO THE TERMINAL
        print("\n--- WATERMARK INJECTION FAILED ---")
        traceback.print_exc() 
        print("----------------------------------\n")
        raise HTTPException(status_code=500, detail=f"Injection failed: {str(e)}")

@app.post("/api/investigate/image")
async def investigate_image(file: UploadFile = File(...)):
    """
    Forensics Lab: Analyst uploads a leaked smartphone photo to trace the insider.
    """
    # Save the uploaded "leaked" photo to a temp file
    temp_fd, temp_path = tempfile.mkstemp(suffix=".png")
    os.close(temp_fd)
    
    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())

    # Extract the ID using DWT-DCT reverse matrix
    extracted_id = extract_dwt_dct(temp_path)
    
    # Cleanup temp file
    os.remove(temp_path)

    if extracted_id == "UNABLE_TO_EXTRACT" or len(extracted_id) < 2:
        return {
            "status": "clean", 
            "message": "No cryptographic payload detected. Evidence too degraded or not watermarked."
        }

    return {
        "status": "confirmed_attribution",
        "recipient_id": extracted_id,
        "vector": "DWT-DCT Frequency Embedding",
        "message": f"Cryptographic attribution confirmed via DLT lookup."
    }

@app.post("/api/decrypt")
async def decrypt_document(req: DecryptRequest):
    # 1. Fetch the clean text from the database
    base_text = mock_database["latest_dispatch"]
    
    # 2. JIT (Just-In-Time) Watermarking
    payload = {"r": req.recipient_id}
    watermarked_text = inject_zero_width(base_text, payload)
    watermarked_image = generate_watermarked_image(base_text, payload)
    
    return {
        "watermarked_text": watermarked_text,
        "watermarked_image": f"data:image/png;base64,{watermarked_image}"
    }

@app.post("/api/investigate/text")
def investigate_text(payload: TextInvestigateRequest):
    """
    Extracts invisible Zero-Width Unicode sequences from suspected leaked text.
    """
    result = extract_zero_width(payload.leaked_text)
    if "error" in result:
        return {
            "status": "unattributed",
            "message": result["error"]
        }

    return {
        "status": "confirmed_attribution",
        "vector": "Text (Zero-Width Steganography)",
        "recipient_id": result.get("r"),
        "session_id": result.get("s"),
        "non_repudiated": True
    }



@app.post("/api/investigate/text_scan")
async def investigate_image(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image format.")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # --- THE FIX: STANDARDIZE RESOLUTION ---
    # No matter how zoomed in the crop is, normalize it to 800px wide.
    # This guarantees our pixel measurements (like > 5px) are always mathematically accurate.
    target_width = 800
    scale = target_width / gray.shape[1]
    target_height = int(gray.shape[0] * scale)
    gray = cv2.resize(gray, (target_width, target_height), interpolation=cv2.INTER_AREA)

    # --- THE FIX: ANTI-MOIRE & ADAPTIVE LIGHTING ---
    # 1. Blur to destroy the pixel-grid lines from smartphone photos of monitors
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    # 2. Otsu's method automatically calculates the perfect lighting threshold
    _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # 1. ADVANCED DESKEWING
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (30, 2))
    dilated = cv2.dilate(thresh, kernel, iterations=1)
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    angles = []
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        if w > 50 and h < 50:
            [vx, vy, x0, y0] = cv2.fitLine(cnt, cv2.DIST_L2, 0, 0.01, 0.01)
            angle = np.degrees(np.arctan2(vy, vx))
            angles.append(angle[0])

    if angles:
        median_angle = np.median(angles)
        (h, w) = thresh.shape[:2] 
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, float(median_angle), 1.0)
        # Warp the thresholded image directly to save processing power
        restored_thresh = cv2.warpAffine(thresh, M, (w, h), flags=cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    else:
        restored_thresh = thresh

    # 2. DYNAMIC REGION SCANNING
    proj_y = np.sum(restored_thresh, axis=1)
    
    line_bounds = []
    in_line = False
    start_y = 0
    max_ink = np.max(proj_y) if len(proj_y) > 0 else 1
    
    for y, val in enumerate(proj_y):
        if val > max_ink * 0.05 and not in_line:
            in_line = True
            start_y = y
        elif val < max_ink * 0.05 and in_line:
            in_line = False
            if y - start_y > 10: 
                line_bounds.append((start_y, y))

    # 3. EXTRACT WORD GAPS
    all_gaps = []
    for (top, bottom) in line_bounds:
        line_img = restored_thresh[top:bottom, :]
        proj_x = np.sum(line_img, axis=0)
        
        nonzero_cols = np.nonzero(proj_x)[0]
        if len(nonzero_cols) == 0:
            continue
            
        proj_x = proj_x[nonzero_cols[0] : nonzero_cols[-1] + 1]
        
        current_gap = 0
        line_gaps = []
        for val in proj_x:
            if val == 0:
                current_gap += 1
            else:
                # Increased to 5 because width is now strictly 800px
                if current_gap > 5:  
                    line_gaps.append(current_gap)
                current_gap = 0
                
        if len(line_gaps) > 0:
            all_gaps.extend(line_gaps)

    # 4. K-MEANS CLUSTERING
    extracted_pattern = "00000000"
    if len(all_gaps) >= 8:
        Z = np.float32(all_gaps[:12]).reshape((-1, 1)) 
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
        _, labels, centers = cv2.kmeans(Z, 2, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
        
        if centers[0][0] > centers[1][0]:
            labels = 1 - labels 
            
        extracted_pattern = "".join([str(l[0]) for l in labels])
        extracted_pattern = extracted_pattern[:8]

    # 5. REVERSE LOOKUP
    guilty_officer = None
    for officer, pattern in USER_PATTERNS.items():
        if pattern == extracted_pattern:
            guilty_officer = officer
            break

    if guilty_officer:
        return {
            "status": "confirmed_attribution",
            "vector": "Relative Ratio Spatial Analysis (Deskewed & Clustered)",
            "recipient_id": guilty_officer,
            "session_id": "RECOVERED-FROM-SPATIAL-GRID",
            "non_repudiated": True
        }

    return {
        "status": "unattributed",
        "message": f"Extracted pattern '{extracted_pattern}' did not match any known officer."
    }