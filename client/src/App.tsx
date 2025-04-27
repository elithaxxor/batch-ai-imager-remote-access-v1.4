import React from 'react';
import Navigation from './components/Navigation';
import MemeCoinScreener from './MemeCoinScreener';
import SentimentScanner from './SentimentScanner';
import AnalyticsDashboard from './AnalyticsDashboard';

function App() {
  const [tab, setTab] = React.useState<'screener' | 'sentiment' | 'analytics'>('screener');
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <button
            className={`btn ${tab === 'screener' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('screener')}
          >
            Meme Coin Screener
          </button>
          <button
            className={`btn ${tab === 'sentiment' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('sentiment')}
          >
            Sentiment Scanner
          </button>
          <button
            className={`btn ${tab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('analytics')}
          >
            Analytics
          </button>
        </div>
        {tab === 'screener' ? <MemeCoinScreener /> : tab === 'sentiment' ? <SentimentScanner /> : <AnalyticsDashboard />}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-text-primary">
              Tendies Tracker™
            </h1>
            <div className="flex gap-4">
              <button className="btn btn-primary">
                <i className="fas fa-rocket mr-2"></i>
                Launch Pad
              </button>
              <button className="btn btn-secondary">
                <i className="fas fa-chart-line mr-2"></i>
                Stonks
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card bg-surface/50">
              <h2 className="text-xl font-semibold mb-4">Ape Sentiment Index</h2>
              <div className="flex items-center justify-between">
                <span className="text-4xl font-bold text-primary">65</span>
                <span className="text-text-secondary">PEAK AUTISM</span>
              </div>
              <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-2/3 rounded-full"></div>
              </div>
            </div>
            
            <div className="card bg-surface/50">
              <h2 className="text-xl font-semibold mb-4">Portfolio Status</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Paper Hands</span>
                  <span className="text-red-500">-69%</span>
                </div>
                <div className="flex justify-between">
                  <span>Diamond Hands</span>
                  <span className="text-green-500">+420%</span>
                </div>
              </div>
            </div>
            
            <div className="card bg-surface/50">
              <h2 className="text-xl font-semibold mb-4">Loss Porn</h2>
              <div className="text-center">
                <span className="text-6xl font-mono text-red-500">-$42,069</span>
                <p className="text-text-secondary mt-2">This is the way</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
