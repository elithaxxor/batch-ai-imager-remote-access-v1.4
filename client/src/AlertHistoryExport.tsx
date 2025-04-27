import React from 'react';
import { Button } from '@mui/material';
import { saveAs } from 'file-saver';

export default function AlertHistoryExport({ alertHistory }: { alertHistory: any[] }) {
  if (!alertHistory || !alertHistory.length) return null;
  const handleExportCSV = () => {
    const rows: string[] = [];
    // CSV header
    rows.push('Date,Symbol,Type,Trigger,Details');
    for (const alert of alertHistory) {
      rows.push([
        alert.date,
        alert.symbol,
        alert.type,
        alert.trigger,
        JSON.stringify(alert.details || {})
      ].join(','));
    }
    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    saveAs(blob, 'alert_history.csv');
  };
  return (
    <Button variant="outlined" style={{ margin: 8 }} onClick={handleExportCSV}>Export Alert History (CSV)</Button>
  );
}
