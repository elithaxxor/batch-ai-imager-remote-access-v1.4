import { useState } from 'react';

export default function HomePage() {
  const [stockSymbol, setStockSymbol] = useState('');
  const [fearGreedValue] = useState(65); // This would be fetched from an API in production
  const [vixValue] = useState(25.67); // This would be fetched from an API in production

  return (
    <div className="min-h-screen bg-[#1a1a2e] py-12 text-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center space-x-2 mb-4">
            <i className="fas fa-diamond text-amber-500 text-4xl animate-bounce"></i>
            <i className="fas fa-hands text-amber-500 text-4xl"></i>
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 bg-clip-text text-transparent mb-4 animate-pulse">
            Tendies Tracker™ 
            <span className="inline-block animate-bounce ml-2">🚀</span>
          </h2>
          <p className="text-lg text-gray-400">
            For Diamond Hands Only | Track Your Way To The Moon
          </p>
        </div>

        {/* Fear and Greed Gauge */}
        <div className="bg-[#16213e] rounded-xl p-8 mb-12 shadow-2xl border border-amber-500/20 transform hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-amber-500">
              <i className="fas fa-chart-line mr-2"></i>
              Ape Sentiment Index
            </h3>
            <div className="flex items-center space-x-3">
              <span className="text-4xl font-bold text-amber-500 animate-pulse font-mono">{fearGreedValue}</span>
              <div className="text-xs text-amber-500/80">
                <div>PEAK</div>
                <div>AUTISM</div>
              </div>
            </div>
          </div>
          <div className="h-8 bg-gray-900 rounded-full overflow-hidden shadow-lg p-1">
            <div 
              className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500 rounded-full transition-all duration-1000 ease-in-out"
              style={{ width: `${fearGreedValue}%` }}
            />
          </div>
          <div className="flex justify-between mt-3 text-sm font-bold">
            <span className="text-red-400">Paper Hands 📄</span>
            <span className="text-amber-400">HODLing 💎</span>
            <span className="text-green-400">Moon Time 🌕</span>
          </div>
        </div>

        {/* Stock Search */}
        <div className="bg-[#16213e] rounded-xl p-8 mb-12 shadow-2xl border border-amber-500/20">
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <div className="relative w-full md:w-96">
              <i className="fas fa-rocket absolute left-4 top-1/2 transform -translate-y-1/2 text-amber-500"></i>
              <input
                type="text"
                value={stockSymbol}
                onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
                placeholder="Type ticker for tendies (e.g., GME)"
                className="pl-12 pr-6 py-4 w-full bg-gray-900 border border-amber-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-100 placeholder-gray-500 font-mono"
              />
            </div>
            <button className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold rounded-lg transition-all duration-200 transform hover:scale-105 hover:rotate-1 w-full md:w-auto flex items-center justify-center space-x-2 group">
              <span>YOLO</span>
              <span className="group-hover:animate-bounce">🚀</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Live Market Feed */}
          <div className="bg-[#16213e] rounded-xl p-6 shadow-2xl border border-amber-500/20 transform hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-amber-500">
                <i className="fas fa-fire-flame-curved mr-2"></i>
                Top Stonks
              </h3>
              <i className="fas fa-sync-alt text-amber-500 animate-spin-slow"></i>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-900 rounded-lg border border-green-500/20 transform hover:scale-[1.02] transition-all duration-200">
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold">GME</span>
                  <i className="fas fa-rocket text-green-400 animate-bounce"></i>
                </div>
                <span className="text-green-400 font-mono">+420.69%</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-900 rounded-lg border border-red-500/20 transform hover:scale-[1.02] transition-all duration-200">
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold">AMC</span>
                  <i className="fas fa-arrow-down text-red-400"></i>
                </div>
                <span className="text-red-400 font-mono">-69.42%</span>
              </div>
            </div>
          </div>

          {/* VIX Gauge */}
          <div className="bg-[#16213e] rounded-xl p-6 shadow-2xl border border-amber-500/20 transform hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-bold text-amber-500">
                  <i className="fas fa-bolt mr-2"></i>
                  Fear-O-Meter
                </h3>
              </div>
              <div className="flex items-center">
                <span className="text-3xl font-bold text-amber-500 font-mono animate-pulse">{vixValue}</span>
                <span className="text-amber-500/80 ml-2 text-sm">VIX</span>
              </div>
            </div>
            <div className="h-8 bg-gray-900 rounded-full overflow-hidden shadow-lg p-1">
              <div 
                className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full transition-all duration-1000 ease-in-out"
                style={{ width: '45%' }}
              />
            </div>
            <div className="flex justify-between text-sm font-bold mt-2">
              <span className="text-green-400">Smooth Brain 🧠</span>
              <span className="text-red-400">Full Retard 🎢</span>
            </div>
            <p className="text-amber-500/80 text-sm mt-4 font-mono text-center">
              Current Status: MAXIMUM AUTISM ACHIEVED
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
