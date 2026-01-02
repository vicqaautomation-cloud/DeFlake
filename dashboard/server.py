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
API_KEY_NAME = "X-API-KEY"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    if api_key_header == os.getenv("DEFLAKE_API_KEY", "test-secret-key"):
        return api_key_header
    raise HTTPException(status_code=403, detail="Could not validate credentials")

class HealRequest(BaseModel):
    error_log: str
    html_snapshot: str
    failing_line: str = None

@app.post("/api/deflake")
def deflake_endpoint(request: HealRequest, api_key: str = Security(get_api_key)):
    """
    SaaS Endpoint: Accepts context, returns fix.
    """
    print(f"🚑 Received healing request from client. Key: {api_key[:4]}***")
    
    # We use mock=True for the demo, but in prod this would use the real key
    client = LLMClient(mock=True)
    fix = client.heal(request.error_log, request.html_snapshot, request.failing_line)
    
    return {"fix": fix, "status": "success"}

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
    uvicorn.run(app, host="0.0.0.0", port=8000)
