import zlib
import struct
import math
import os

def write_png(filename, width, height, is_maskable=False):
    # Generates a clean PNG with dark slate background (#0f172a), red shield badge and gold emblem
    raw_rows = []
    
    bg_r, bg_g, bg_b = 15, 23, 42
    shield_r, shield_g, shield_b = 239, 68, 68
    gold_r, gold_g, gold_b = 234, 179, 8
    white_r, white_g, white_b = 255, 255, 255
    
    cx, cy = width / 2.0, height / 2.0
    scale = width / 512.0
    
    for y in range(height):
        row = bytearray([0]) # filter type 0 (None)
        for x in range(width):
            # Compute distance from center
            dx = (x - cx) / scale
            dy = (y - cy) / scale
            
            # Default background
            r, g, b, a = bg_r, bg_g, bg_b, 255
            
            # Outer circular/squircle frame
            dist = math.sqrt(dx*dx + dy*dy)
            
            # Shield shape
            in_shield = False
            if -130 <= dx <= 130 and -160 <= dy <= 160:
                # Top triangle or bottom taper
                if dy <= -50:
                    in_shield = True
                else:
                    taper = 130 * (1 - (dy + 50) / 210.0)
                    if abs(dx) <= max(0, taper):
                        in_shield = True
            
            if in_shield:
                r, g, b = shield_r, shield_g, shield_b
            
            # Central emblem (cross / star / diamond)
            if -40 <= dx <= 40 and -80 <= dy <= 20:
                if (dx*dx) / 1600.0 + (dy + 30)*(dy + 30) / 2500.0 <= 1.0:
                    r, g, b = gold_r, gold_g, gold_b
            
            # Crossed wrench accent line
            if -90 <= dx <= 90 and 50 <= dy <= 70:
                r, g, b = white_r, white_g, white_b
            if -70 <= dx <= 70 and 85 <= dy <= 97:
                r, g, b = white_r, white_g, white_b
                
            row.extend([r, g, b, a])
        raw_rows.append(bytes(row))
        
    raw_data = b"".join(raw_rows)
    compressed = zlib.compress(raw_data, 9)
    
    def chunk(tag, data):
        return (
            struct.pack(">I", len(data)) +
            tag +
            data +
            struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff)
        )
    
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    png_bytes = (
        b"\x89PNG\r\n\x1a\n" +
        chunk(b"IHDR", ihdr_data) +
        chunk(b"IDAT", compressed) +
        chunk(b"IEND", b"")
    )
    
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, "wb") as f:
        f.write(png_bytes)

write_png("public/pwa-192x192.png", 192, 192)
write_png("public/pwa-512x512.png", 512, 512)
write_png("public/pwa-maskable-512x512.png", 512, 512, is_maskable=True)
write_png("public/apple-touch-icon.png", 180, 180)
print("Icons generated successfully!")
