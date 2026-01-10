from fastapi import FastAPI, HTTPException, Depends, Security, Header
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
import sys

# Add project root to sys.path to import from core
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.analyzer import ErrorAnalyzer
from core.llm_client import LLMClient
from core.patcher import SourcePatcher

app = FastAPI()

# Enable CORS for frontend (running on a different port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In prod, specify the exact frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
# Security & Middleware
API_KEY_NAME = "X-API-KEY"
BYOK_HEADER = "X-OPENAI-KEY"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

# Load master key from env for backward compatibility/admin
MASTER_KEY = os.getenv("DEFLAKE_API_KEY", "test-secret-key")

from dashboard.database import get_user, increment_usage, create_user

async def verify_quota_and_key(
    api_key: str = Security(api_key_header), 
    openai_key: str = Header(None, alias=BYOK_HEADER)
):
    """
    Validates API Key and Check Quota.
    Logic:
    1. If X-OPENAI-KEY is present -> BYOK Mode (Skip quota, validate DeFlake key exists).
    2. If normal request -> Check quota in DB.
    """
    if not api_key:
        raise HTTPException(status_code=403, detail="Missing API Key")

    # Master Key Bypass (Admin)
    if api_key == MASTER_KEY:
        return {"type": "master", "key": api_key, "byok": openai_key}

    user = get_user(api_key)
    if not user:
        raise HTTPException(status_code=403, detail="Invalid API Key")

    # BYOK Mode: Unlimited usage, but must have valid account
    if openai_key:
        return {"type": "byok", "key": api_key, "byok": openai_key}

    # Standard Mode: Check Quota
    if user["usage_count"] >= user["limit_count"]:
        raise HTTPException(
            status_code=402, 
            detail=f"Quota Exceeded ({user['usage_count']}/{user['limit_count']}). Upgrade to Pro or use BYOK."
        )

    return {"type": "standard", "key": api_key, "byok": None}

class HealRequest(BaseModel):
    error_log: str
    html_snapshot: str
    failing_line: str = None

@app.get("/")
def health_check():
    """Health check for Railway."""
    return {"status": "online", "message": "DeFlake API is running"}

@app.post("/api/register")
def register_user(tier: str = "free"):
    """Generates a new API Key for a user."""
    key = create_user(tier)
    return {"api_key": key, "tier": tier, "limit": 20 if tier == 'free' else 1000}

@app.get("/api/user/usage")
def get_usage(creds: dict = Security(verify_quota_and_key)):
    if creds["type"] == "master":
        return {"tier": "admin", "usage": 0, "limit": 999999}
    
    user = get_user(creds["key"])
    return {
        "tier": user["tier"],
        "usage": user["usage_count"],
        "limit": user["limit_count"]
    }

@app.post("/api/deflake")
def deflake_endpoint(request: HealRequest, creds: dict = Security(verify_quota_and_key)):
    """
    SaaS Endpoint: Accepts context, returns fix.
    """
    print(f"🚑 Received healing request. Type: {creds['type']}")
    
    # Initialize Client
    # If BYOK, we pass the user's OpenAI Key
    # If Standard, we rely on server's env key (LLMClient handles this)
    openai_key = creds.get("byok")
    
    # We use mock=True for the demo unless OpenAI key is present (real or BYOK)
    # Real AI Mode
    client = LLMClient(mock=False, openai_api_key=openai_key)
    
    try:
        # NAIVE MVP TRIMMING: Limit HTML to 15k chars to avoid 429 errors
        # In a real version, we'd use BeautifulSoup to extract only the body or relevant div.
        trimmed_html = request.html_snapshot[:15000] + "\n...[TRUNCATED]..." if len(request.html_snapshot) > 15000 else request.html_snapshot
        
        fix = client.heal(request.error_log, trimmed_html, request.failing_line)
        
        # Increment usage ONLY if it wasn't a BYOK request and wasn't Master
        if creds["type"] == "standard":
            increment_usage(creds["key"])

        # Save to History
        import datetime
        history_entry = {
            "timestamp": datetime.datetime.now().isoformat(),
            "failing_line": request.failing_line,
            "fix": fix,
            "tier": creds["type"]
        }
        
        try:
            history_data = []
            if os.path.exists(HISTORY_FILE):
                with open(HISTORY_FILE, "r") as f:
                    history_data = json.load(f)
            
            history_data.insert(0, history_entry) # Prepend
            history_data = history_data[:50] # Keep last 50
            
            with open(HISTORY_FILE, "w") as f:
                json.dump(history_data, f, indent=2)
        except Exception as e:
            print(f"Failed to save history: {e}")
            
        return {"fix": fix, "status": "success"}
    except Exception as e:
        print(f"Error during healing: {e}")
        return {"fix": str(e), "status": "error"}

HISTORY_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "history.json")

@app.get("/api/history")
def get_history():
    """Returns the list of healed tests."""
    if not os.path.exists(HISTORY_FILE):
        return []
    
    with open(HISTORY_FILE, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

if __name__ == "__main__":
    import uvicorn
    # Init DB on startup
    from dashboard.database import init_db
    init_db()
    
    port = int(os.environ.get("PORT", 8000))
    print(f"🚀 Starting DeFlake API on 0.0.0.0:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
