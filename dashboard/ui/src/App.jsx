import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css' // Using standard vite css, but we put everything in index.css mainly

function App() {
  const [history, setHistory] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    // Poll for updates every 2 seconds to make it feel "live"
    const fetchData = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/api/history')
        // Sort by newest first
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
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <span>❄️</span> DeFlake
          </div>
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
