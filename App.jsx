import React, { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, 
  Title, Tooltip, Legend 
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { 
  Settings, RefreshCw, AlertCircle, Database, 
  ShieldCheck, Zap, LayoutDashboard
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function App() {
  const [config, setConfig] = useState({
    databaseId: '',
    labelProp: 'Name',
    valueProp: 'Value',
  });

  const [view, setView] = useState('setup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState(null);

  // Load saved config
  useEffect(() => {
    const saved = localStorage.getItem('vercel_notion_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      setConfig(parsed);
      if (parsed.databaseId) fetchData(parsed);
    }
  }, []);

  const fetchData = async (conf = config) => {
    if (!conf.databaseId) {
      setError("Please enter a Database ID or URL");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // We call OUR OWN Vercel API route, which handles the Notion token safely
      const response = await fetch(`/api/notion?id=${conf.databaseId}&label=${conf.labelProp}&value=${conf.valueProp}`);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fetch from Vercel API");
      }

      const data = await response.json();
      
      setChartData({
        labels: data.map(d => d.label),
        datasets: [{
          label: conf.valueProp,
          data: data.map(d => d.value),
          backgroundColor: '#3b82f6',
          borderRadius: 8,
          hoverBackgroundColor: '#2563eb'
        }]
      });
      
      localStorage.setItem('vercel_notion_config', JSON.stringify(conf));
      setView('chart');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const extractId = (input) => {
    const match = input.match(/notion\.so\/(?:.*\/)?([a-f0-9]{32})/);
    return match ? match[1] : input;
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <LayoutDashboard size={18} />
            </div>
            <span className="font-bold tracking-tight">Vercel Notion Viz</span>
          </div>
          <button 
            onClick={() => setView(view === 'setup' ? 'chart' : 'setup')}
            className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-all"
          >
            <Settings size={20} />
          </button>
        </div>

        <div className="p-6">
          {view === 'setup' ? (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="space-y-4">
                <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex gap-2">
                  <ShieldCheck size={16} className="text-green-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-green-700">
                    <strong>Secure Mode:</strong> Your Token is hidden on Vercel's servers. 
                    Ensure <code>NOTION_TOKEN</code> is set in Vercel Environment Variables.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Database URL or ID</label>
                  <input 
                    type="text" 
                    placeholder="Paste link or ID..." 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={config.databaseId}
                    onChange={e => setConfig({...config, databaseId: extractId(e.target.value)})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Label Property</label>
                    <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={config.labelProp} onChange={e => setConfig({...config, labelProp: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Value Property</label>
                    <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={config.valueProp} onChange={e => setConfig({...config, valueProp: e.target.value})} />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[11px] flex items-start gap-2 border border-red-100">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}
                </div>
              )}

              <button 
                onClick={() => fetchData()}
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="animate-spin" size={18} /> : "Generate Secure Chart"}
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
              <div className="h-64 w-full">
                {chartData ? (
                  <Bar 
                    data={chartData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { display: false } },
                        x: { grid: { display: false }, border: { display: false } }
                      }
                    }} 
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300">
                    <RefreshCw className="animate-spin mb-2" />
                    <span className="text-xs">Connecting to Vercel API...</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <div className="flex flex-col">
                   <span className="text-[9px] font-bold text-slate-400 uppercase">Backend Status</span>
                   <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase">
                      <Zap size={10} fill="currentColor" /> Serverless Live
                   </div>
                </div>
                <button 
                  onClick={() => fetchData()} 
                  className="bg-slate-100 hover:bg-slate-200 p-2.5 rounded-xl text-slate-700 transition-colors flex items-center gap-2 text-xs font-bold"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

