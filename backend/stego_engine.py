import cv2
import numpy as np
import base64
import json

# --- LAYER 1: ZERO-WIDTH TEXT STEGANOGRAPHY ---
ZERO_WIDTH_ZERO = '\u200B'
ZERO_WIDTH_ONE = '\u200C'
DELIMITER = '\u200D'

def text_to_binary(text: str) -> str:
    return ''.join(format(ord(c), '08b') for c in text)

def binary_to_text(binary: str) -> str:
    return ''.join(chr(int(binary[i:i+8], 2)) for i in range(0, len(binary), 8) if len(binary[i:i+8]) == 8)

def inject_zero_width(plaintext: str, payload_dict: dict) -> str:
    payload_str = json.dumps(payload_dict)
    binary = text_to_binary(payload_str)
    hidden_sequence = DELIMITER + ''.join(ZERO_WIDTH_ZERO if b == '0' else ZERO_WIDTH_ONE for b in binary) + DELIMITER
    return plaintext.replace(" ", hidden_sequence + " ", 1)

def extract_zero_width(leaked_text: str) -> dict:
    start = leaked_text.find(DELIMITER)
    end = leaked_text.rfind(DELIMITER)
    if start == -1 or end == -1 or start == end:
        return {"error": "No hidden payload found."}
    hidden_slice = leaked_text[start+1:end]
    binary = ''.join('0' if c == ZERO_WIDTH_ZERO else '1' for c in hidden_slice if c in (ZERO_WIDTH_ZERO, ZERO_WIDTH_ONE))
    try:
        return json.loads(binary_to_text(binary))
    except:
        return {"error": "Corrupted payload format."}


# --- LAYER 2: OPENCV HORIZONTAL WORD SPACING ---

USER_PATTERNS = {
    "OFFICER-RAHUL-7842": "10101110", 
    "OFFICER-PRIYA-9104": "01100101", 
}

def generate_watermarked_image(base_text: str, payload_dict: dict):
    user_id = payload_dict.get("r", "UNKNOWN")
    pattern = USER_PATTERNS.get(user_id, "00000000")
    
    doc = np.ones((800, 600, 3), dtype=np.uint8) * 255
    
    # Split text by explicit newlines to preserve the user's exact formatting
    paragraphs = base_text.split('\n')
    
    x_offset_start = 50
    y_offset = 80  # Shifted up since the heading is removed
    pattern_index = 0
    
    for paragraph in paragraphs:
        # If it's an empty line (e.g., double Enter), just add vertical space
        if not paragraph.strip():
            y_offset += 35
            continue
            
        words = paragraph.split(" ")
        words = [w for w in words if w.strip()]
        
        x_offset = x_offset_start
        
        for i, word in enumerate(words):
            (w, h), _ = cv2.getTextSize(word, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 1)
            
            # Word wrap if hitting the right margin
            if x_offset + w > 520:
                x_offset = x_offset_start
                y_offset += 35
                
            cv2.putText(doc, word, (int(x_offset), int(y_offset)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 1)
            
            # Predict if the NEXT word will trigger a line break or if paragraph is ending
            will_wrap = False
            if i + 1 < len(words):
                (nw, _), _ = cv2.getTextSize(words[i+1], cv2.FONT_HERSHEY_SIMPLEX, 0.6, 1)
                if x_offset + w + 18 + nw > 520:
                    will_wrap = True
            else:
                will_wrap = True

            gap = 10 
            
            if not will_wrap and pattern_index < len(pattern):
                if pattern[pattern_index] == '1':
                    gap = 18 
                pattern_index += 1
                
            x_offset += w + gap
            
        # Move down a line for the next paragraph
        y_offset += 35

    _, buffer = cv2.imencode('.png', doc)
    return base64.b64encode(buffer).decode('utf-8')