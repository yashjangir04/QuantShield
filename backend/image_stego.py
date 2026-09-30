import cv2
import numpy as np
from imwatermark import WatermarkEncoder, WatermarkDecoder

# The ID is padded to 32 bytes. The library expects the length in BITS (32 * 8 = 256 bits)
BIT_LENGTH = 256
BYTE_LENGTH = 32 

def pad_id(officer_id: str) -> bytes:
    """Pads the ID to exactly 32 bytes."""
    padded = officer_id.ljust(BYTE_LENGTH, '\x00')
    return padded.encode('utf-8')

def embed_dwt_dct(input_image_path: str, output_image_path: str, officer_id: str):
    """Embeds a 256-bit payload into an image using DWT-DCT."""
    # 1. Read the image into an OpenCV numpy array
    bgr = cv2.imread(input_image_path)
    if bgr is None:
        raise ValueError(f"Could not read input image: {input_image_path}")

    # 2. Initialize Encoder (Note: It takes zero arguments)
    encoder = WatermarkEncoder()
    
    # 3. Set the payload
    encoder.set_watermark('bytes', pad_id(officer_id))
    
    # 4. Encode the image array using the 'dwtDct' algorithm
    bgr_encoded = encoder.encode(bgr, 'dwtDct')
    
    # 5. Save the mathematically altered image back to the temporary file
    cv2.imwrite(output_image_path, bgr_encoded)
    return True

def extract_dwt_dct(leaked_image_path: str) -> str:
    """Extracts a 256-bit payload from a leaked image."""
    # 1. Initialize Decoder with the expected payload size in BITS
    decoder = WatermarkDecoder('bytes', BIT_LENGTH)
    
    # 2. Read the leaked photo into an OpenCV array
    bgr = cv2.imread(leaked_image_path)
    if bgr is None:
        print("Error: Could not read leaked image file.")
        return "UNABLE_TO_EXTRACT"

    try:
        # 3. Run the inverse DWT-DCT matrix on the image array
        watermark_bytes = decoder.decode(bgr, 'dwtDct')
        
        # 4. Decode the bytes and clean up the null character padding
        return watermark_bytes.decode('utf-8', errors='ignore').rstrip('\x00')
    except Exception as e:
        print(f"Extraction Error: {e}")
        return "UNABLE_TO_EXTRACT"