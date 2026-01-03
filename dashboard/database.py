import sqlite3
import hashlib
import secrets
from datetime import datetime
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "users.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
                    api_key_hash TEXT PRIMARY KEY,
                    tier TEXT,
                    usage_count INTEGER,
                    limit_count INTEGER,
                    created_at TEXT
                )''')
    conn.commit()
    conn.close()

def create_user(tier="free"):
    """Creates a new user and returns their raw API Key."""
    api_key = secrets.token_urlsafe(32)
    api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    
    # Pricing Tier Logic
    limit = 20 if tier == "free" else 1000
    if tier == "enterprise":
        limit = 999999
        
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO users VALUES (?, ?, 0, ?, ?)", 
              (api_key_hash, tier, limit, datetime.now().isoformat()))
    conn.commit()
    conn.close()
    return api_key

def get_user(api_key):
    """Returns user dict if key is valid, else None."""
    api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE api_key_hash=?", (api_key_hash,))
    row = c.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def increment_usage(api_key):
    """Increments the usage count for the given key."""
    api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE users SET usage_count = usage_count + 1 WHERE api_key_hash=?", (api_key_hash,))
    conn.commit()
    conn.close()

# Initialize DB on module load
init_db()
