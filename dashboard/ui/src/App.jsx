import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css' // Using standard vite css, but we put everything in index.css mainly

function App() {
  const [history, setHistory] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)

  // Monetization State
  const [usage, setUsage] = useState({ used: 0, limit: 20, tier: 'free' })
  const [showSettings, setShowSettings] = useState(false)
  const [byokKey, setByokKey] = useState(localStorage.getItem('openai_key') || '')

  const saveSettings = () => {
    localStorage.setItem('openai_key', byokKey)
    setShowSettings(false)
    alert('Settings Saved! You are now in BYOK Mode (Unlimited).')
    fetchUsage() // Refresh to see if tier changes (backend logic TBD)
  }

  const fetchUsage = async () => {
    try {
      // In a real app, we'd pass the DEFLAKE_API_KEY from env or auth_token
      // For this demo, we assume the server knows us by IP or a fixed key
      const headers = {
        'X-API-KEY': 'test-secret-key',
        ...(byokKey && { 'X-OPENAI-KEY': byokKey })
      }

      const res = await axios.get('http://127.0.0.1:8000/api/user/usage', { headers })
      setUsage({
        used: res.data.usage,
        limit: res.data.limit,
        tier: byokKey ? 'unlimited (BYOK)' : res.data.tier
      })
    } catch (err) {
      console.error("Failed to fetch usage", err)
    }
  }

  useEffect(() => {
    fetchUsage()

    // Poll for updates every 2 seconds
    const fetchData = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/api/history')
        const sorted = res.data.reverse()
        setHistory(sorted)
        if (!selectedItem && sorted.length > 0) {
          setSelectedItem(sorted[0])
        }
      } catch (err) {
        console.error("Failed to fetch history", err)
      }
    }

    fetchData()
    const interval = setInterval(() => {
      fetchData()
      fetchUsage()
    }, 2000)
    return () => clearInterval(interval)
  }, [byokKey]) // Refetch if Key changes

  return (
    <div className="dashboard-container">
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-8 rounded-xl border border-zinc-700 w-96">
            <h3 className="text-xl font-bold mb-4">Settings</h3>

            <div className="mb-6">
              <label className="block text-sm text-zinc-400 mb-2">OpenAI API Key (BYOK)</label>
              <input
                type="password"
                value={byokKey}
                onChange={(e) => setByokKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-zinc-800 border border-zinc-600 rounded p-2 text-white"
              />
              <p className="text-xs text-zinc-500 mt-2">
                Enter your own key to bypass the 20 fixes/month limit.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                className="px-4 py-2 bg-emerald-500 text-black font-bold rounded hover:bg-emerald-400"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <span>❄️</span> DeFlake
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="text-xs text-zinc-500 hover:text-white mt-2"
          >
            ⚙️ Settings
          </button>
        </div>

        {/* Usage Bar */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex justify-between text-xs mb-1 text-zinc-400">
            <span>Credits Used</span>
            <span>{usage.tier === 'unlimited (BYOK)' ? '∞' : `${usage.used} / ${usage.limit}`}</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${usage.used >= usage.limit ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: usage.tier === 'unlimited (BYOK)' ? '100%' : `${(usage.used / usage.limit) * 100}%` }}
            ></div>
          </div>
          {usage.used >= usage.limit && usage.tier !== 'unlimited (BYOK)' && (
            <button onClick={() => setShowSettings(true)} className="text-xs text-red-400 mt-2 w-full text-center hover:underline">
              Limit Reached. Add Key &rarr;
            </button>
          )}
        </div>

        <div className="history-list">
          {history.map((item, idx) => (
            <div
              key={idx}
              className={`history-item ${selectedItem === item ? 'active' : ''}`}
              onClick={() => setSelectedItem(item)}
            >
              <div className="item-title">
                {item.log_path.split('/').pop()}
              </div>
              <div className="item-meta">
                <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                <span className="status-badge">{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {selectedItem ? (
          <>
            <div className="content-header">
              <h2>Ai Fix Suggestion</h2>
              <div className="file-path">{selectedItem.html_path}</div>
            </div>

            <div className="diff-view">
              <div className="diff-card">
                <div className="diff-header">Suggested Change</div>
                <pre className="code-block">
                  {selectedItem.fix}
                </pre>
              </div>
            </div>
          </>
        ) : (
          <div className="no-selection">
            <div className="hero-icon">🚑</div>
            <h2>Select a fix to review</h2>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
