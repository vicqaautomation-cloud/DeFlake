import React, { useState } from 'react';
import { Terminal, CheckCircle2, Play, Code2, Copy, Github, ExternalLink, Apple, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';

function SetupTabs() {
  const [os, setOs] = useState('mac');

  const commands = {
    mac: `export DEFLAKE_API_KEY="your-api-key"
export DEFLAKE_API_URL="https://deflake-api.up.railway.app"`,
    win: `$env:DEFLAKE_API_KEY="your-api-key"
$env:DEFLAKE_API_URL="https://deflake-api.up.railway.app"`
  };

  return (
    <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-1">
      <div className="flex gap-1 mb-4 border-b border-zinc-800 p-2">
        <button
          onClick={() => setOs('mac')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${os === 'mac' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Apple size={16} /> macOS / Linux
        </button>
        <button
          onClick={() => setOs('win')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${os === 'win' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Monitor size={16} /> Windows
        </button>
      </div>
      <div className="p-4 pt-0">
        <pre className="font-mono text-sm text-zinc-300 overflow-x-auto">
          <code>{commands[os]}</code>
        </pre>
      </div>
    </div>
  );
}

function UserDashboard() {
  const [apiKey, setApiKey] = useState('');
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkStats = async () => {
    if (!apiKey) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch Stats
      const statsRes = await fetch('http://localhost:8000/api/user/usage', {
        headers: { 'X-API-KEY': apiKey }
      });
      if (!statsRes.ok) throw new Error('Invalid API Key');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch History (Public endpoint for now, but good to have)
      const historyRes = await fetch('http://localhost:8000/api/history');
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData);
      }
    } catch (err) {
      setError(err.message);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6 max-w-2xl mx-auto">
      {!stats ? (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter API Key (e.g. key-123)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-700 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-primary"
          />
          <button
            onClick={checkStats}
            disabled={loading}
            className="bg-primary text-zinc-900 px-4 py-2 rounded-md font-bold text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? '...' : 'Check'}
          </button>
        </div>
      ) : (
        <div className="text-left">
          <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
            <h3 className="font-bold text-white text-lg">Dashboard</h3>
            <button onClick={() => setStats(null)} className="text-xs text-zinc-500 hover:text-white">Logout</button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-zinc-800 p-4 rounded-lg">
              <p className="text-zinc-500 text-xs uppercase mb-1">Current Plan</p>
              <p className="text-2xl font-mono text-primary uppercase">{stats.tier}</p>
            </div>
            <div className="bg-zinc-800 p-4 rounded-lg">
              <p className="text-zinc-500 text-xs uppercase mb-1">Monthly Usage</p>
              <p className="text-2xl font-mono text-white">{stats.usage} <span className="text-zinc-500 text-base">/ {stats.limit}</span></p>
            </div>
          </div>

          <h4 className="font-bold text-zinc-300 mb-4 text-sm uppercase tracking-wider">Recent Activity</h4>
          <div className="space-y-3">
            {history.length === 0 ? (
              <p className="text-zinc-500 text-sm italic">No fixes recorded yet.</p>
            ) : (
              history.slice(0, 5).map((entry, i) => (
                <div key={i} className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg text-sm">
                  <div className="flex justify-between text-zinc-500 text-xs mb-2">
                    <span>{new Date(entry.timestamp).toLocaleString()}</span>
                    <span className="bg-zinc-800 px-2 rounded text-zinc-300">{entry.tier}</span>
                  </div>
                  {entry.failing_line && <div className="font-mono text-red-400 mb-1 line-clamp-1">{entry.failing_line}</div>}
                  <div className="font-mono text-green-400 opacity-80 line-clamp-2 text-xs border-l-2 border-green-500/30 pl-2">
                    {entry.fix}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('playwright');

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const installCmds = {
    playwright: 'npx deflake --log error.log --html failure.html',
    cypress: `// cypress.config.js
setupNodeEvents(on, config) {
  require('deflake/cypress')(on, config);
}`,
    webdriverio: `// wdio.conf.js
services: [
  [require('deflake/webdriverio')]
]`
  };

  return (
    <div className="min-h-screen bg-background text-zinc-100 selection:bg-primary selection:text-white">
      {/* Navbar */}
      <nav className="border-b border-zinc-800 bg-surface/50 backdrop-blur-md fixed w-full z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="text-primary text-2xl">⚡</span> DeFlake
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#demo" className="hover:text-white transition">Demo</a>
            <a href="https://github.com/vicqaautomation-cloud/DeFlake" target="_blank" className="flex items-center gap-2 bg-zinc-100 text-zinc-900 px-4 py-2 rounded-full hover:bg-white transition">
              <Github size={16} /> GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-32 pb-20 px-6 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/50 border border-zinc-700 text-xs text-primary mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            v1.0 Public Release
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
            Fix Flaky Tests <br /> without the Headache.
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop debugging obscure selectors. <span className="text-primary font-medium">DeFlake</span> uses AI
            to analyze your failure logs and auto-suggest robust fixes in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="h-12 px-8 rounded-lg bg-primary text-zinc-950 font-bold hover:bg-emerald-400 transition flex items-center gap-2">
              Get Started <ExternalLink size={18} />
            </button>
            <div className="h-12 px-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center gap-3 font-mono text-sm text-zinc-400">
              <span className="text-primary">$</span> npm install deflake
              <button onClick={() => copyToClipboard('npm install deflake')} className="hover:text-white"><Copy size={14} /></button>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Quick Setup Section */}
      <section className="py-12 bg-zinc-900/50 border-y border-zinc-800">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold mb-2">Configure for your OS</h3>
            <p className="text-zinc-400 text-sm">DeFlake works on all platforms. Set your API Key to get started.</p>
          </div>

          <SetupTabs />
        </div>
      </section>

      {/* User Dashboard Section */}
      <section className="py-12 border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-6">User Dashboard</h2>
          <UserDashboard />
        </div>
      </section>

      {/* Interactive Terminal Demo */}
      <section id="demo" className="py-20 bg-surface/30 border-y border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Works with your stack</h2>
            <p className="text-zinc-400 mb-8">
              Whether you use Playwright, Cypress, or WebdriverIO, DeFlake integrates directly into your workflow.
              No new dashboard to learn. Just run your tests.
            </p>

            <div className="flex gap-4 mb-8">
              {['playwright', 'cypress', 'webdriverio'].map((fw) => (
                <button
                  key={fw}
                  onClick={() => setActiveTab(fw)}
                  className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${activeTab === fw
                    ? 'bg-zinc-800 text-white border border-zinc-700 shadow-lg'
                    : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                  {fw}
                </button>
              ))}
            </div>

            <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-6 relative group">
              <div className="absolute top-4 right-4 flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
              </div>
              <pre className="font-mono text-sm overflow-x-auto text-zinc-300">
                <code>{installCmds[activeTab]}</code>
              </pre>
            </div>
          </div>

          <motion.div
            className="rounded-2xl overflow-hidden border border-zinc-700 shadow-2xl relative"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {/* Replace with actual video/gif later */}
            <div className="aspect-video bg-zinc-900 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent opacity-60"></div>
              <Play size={48} className="text-white opacity-80" />
              <p className="absolute bottom-6 left-6 text-sm font-medium text-zinc-300">Watch the verification demo</p>
              <img src={`${import.meta.env.BASE_URL}complex_scenario_demo_1767400118179.webp`} className="w-full h-full object-cover opacity-50" onError={(e) => e.target.style.display = 'none'} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-zinc-600 text-sm">
        <p>&copy; 2026 DeFlake. Open Source & Proudly Native.</p>
      </footer>
    </div>
  );
}

export default App;
