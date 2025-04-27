// Simple persistent alert store (JSON file-based for demo)
import fs from 'fs';
const ALERTS_FILE = './alerts.json';

export function loadAlerts(): any[] {
  try {
    return JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

export function saveAlerts(alerts: any[]) {
  fs.writeFileSync(ALERTS_FILE, JSON.stringify(alerts, null, 2));
}
