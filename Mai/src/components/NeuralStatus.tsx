import React, { useState, useEffect } from 'react';
import { Brain, Heart, Zap, Activity } from 'lucide-react';

export function NeuralStatus() {
  const [status, setStatus] = useState({
    cognitive: 0,
    emotional: 0,
    processing: 0,
    learning: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus({
        cognitive: 90 + Math.random() * 10,
        emotional: 85 + Math.random() * 15,
        processing: 95 + Math.random() * 5,
        learning: 80 + Math.random() * 20
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border border-green-700 rounded-lg p-4 bg-black/50">
      <h2 className="text-xl mb-4">Neural Network Status</h2>
      <div className="space-y-4">
        <StatusBar icon={<Brain className="w-4 h-4" />} label="Cognitive Function" value={status.cognitive} />
        <StatusBar icon={<Heart className="w-4 h-4" />} label="Emotional Processing" value={status.emotional} />
        <StatusBar icon={<Zap className="w-4 h-4" />} label="Processing Power" value={status.processing} />
        <StatusBar icon={<Activity className="w-4 h-4" />} label="Learning Rate" value={status.learning} />
      </div>
    </div>
  );
}

function StatusBar({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
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