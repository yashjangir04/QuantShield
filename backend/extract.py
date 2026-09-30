# extract.py
import sys
import cv2
import numpy as np
import pywt
from scipy.fftpack import dct

def apply_dct(image_band):
    size = image_band.shape
    dct_output = np.zeros(size)
    for i in range(0, size[0], 8):
        for j in range(0, size[1], 8):
            dct_output[i:(i+8), j:(j+8)] = dct(dct(image_band[i:(i+8), j:(j+8)], axis=0, norm='ortho'), axis=1, norm='ortho')
    return dct_output

def extract_watermark(cover_path, watermarked_path, output_path):
    # Load images in grayscale
    cover = cv2.imread(cover_path, cv2.IMREAD_GRAYSCALE)
    watermarked = cv2.imread(watermarked_path, cv2.IMREAD_GRAYSCALE)

    # 1. Level-1 DWT on both images
    _, (HL_cover, _, _) = pywt.dwt2(cover, 'haar')
    _, (HL_wm, _, _) = pywt.dwt2(watermarked, 'haar')

    # 2. Apply DCT to the HL mid-frequency bands
    HL_cover_dct = apply_dct(HL_cover)
    HL_wm_dct = apply_dct(HL_wm)

    # 3. Extract the watermark bits
    # Formula: Watermark = (Watermarked_Coeffs - Original_Coeffs) / Alpha
    alpha = 50 
    extracted_bin = (HL_wm_dct - HL_cover_dct) / alpha

    # Scale back to visual pixel values (0-255)
    extracted_img = extracted_bin * 255
    cv2.imwrite(output_path, np.uint8(np.clip(extracted_img, 0, 255)))
    
    # Return output path to Node.js
    print(output_path)

if __name__ == "__main__":
    cover_file = sys.argv[1]
    watermarked_file = sys.argv[2]
    output_file = sys.argv[3]
    extract_watermark(cover_file, watermarked_file, output_file)