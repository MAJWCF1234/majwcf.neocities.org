import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Network, Battery } from 'lucide-react';

export function SystemMetrics() {
  const [metrics, setMetrics] = useState({
    cpu: 0,
    memory: 0,
    network: 0,
    power: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        cpu: Math.random() * 100,
        memory: 60 + Math.random() * 40,
        network: Math.random() * 100,
        power: 70 + Math.random() * 30
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border border-green-700 rounded-lg p-4 bg-black/50">
      <h2 className="text-xl mb-4">System Metrics</h2>
      <div className="space-y-4">
        <MetricBar icon={<Cpu className="w-4 h-4" />} label="CPU Load" value={metrics.cpu} />
        <MetricBar icon={<HardDrive className="w-4 h-4" />} label="Memory" value={metrics.memory} />
        <MetricBar icon={<Network className="w-4 h-4" />} label="Network" value={metrics.network} />
        <MetricBar icon={<Battery className="w-4 h-4" />} label="Power" value={metrics.power} />
      </div>
    </div>
  );
}

function MetricBar({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
        <span className="ml-auto">{value.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-900 rounded-full h-2">
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}