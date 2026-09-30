import sqlite3
import hashlib
import json
from datetime import datetime
import os

DB_FILE = "ledger.db"

def init_db():
    """Initializes the SQLite database and creates the Ledger table."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Create the immutable ledger table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            recipient_id TEXT,
            session_id TEXT,
            action TEXT,
            previous_hash TEXT,
            block_hash TEXT,
            hybrid_signature TEXT
        )
    ''')
    conn.commit()
    conn.close()

def get_previous_hash():
    """Fetches the hash of the last block to maintain the chain."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('SELECT block_hash FROM ledger ORDER BY id DESC LIMIT 1')
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else "0000000000000000000000000000000000000000000000000000000000000000" # Genesis hash

def append_ledger_entry(recipient_id: str, session_id: str, action: str = "DECRYPT"):
    """Appends a new decryption event to the hash chain."""
    timestamp = datetime.utcnow().isoformat()
    previous_hash = get_previous_hash()
    
    # The data payload to be hashed
    block_data = json.dumps({
        "timestamp": timestamp,
        "recipient_id": recipient_id,
        "session_id": session_id,
        "action": action,
        "previous_hash": previous_hash
    }, sort_keys=True)
    
    # Generate the Block Hash (SHA3-256 equivalent)
    block_hash = hashlib.sha256(block_data.encode('utf-8')).hexdigest()
    
    # Mocking the Hybrid PQC (ML-DSA + Ed25519) Signature for the hackathon MVP
    # In a production environment, this would use the cryptography/liboqs library
    hybrid_signature = f"sig_pqc_{hashlib.md5((block_hash + 'PQC_SALT').encode()).hexdigest()}"

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO ledger (timestamp, recipient_id, session_id, action, previous_hash, block_hash, hybrid_signature)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (timestamp, recipient_id, session_id, action, previous_hash, block_hash, hybrid_signature))
    
    conn.commit()
    block_id = cursor.lastrowid
    conn.close()
    
    return {
        "block_id": block_id,
        "hash": block_hash,
        "signature": hybrid_signature
    }