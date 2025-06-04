import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';
import { SystemMetrics } from './SystemMetrics';
import { NeuralStatus } from './NeuralStatus';
import { FlowChart } from './FlowChart';

const COMMANDS = {
  HELP: 'help',
  CLEAR: 'clear',
  STATUS: 'status',
  METRICS: 'metrics',
  NEURAL: 'neural',
  FLOW: 'flow',
  EXIT: 'exit',
};

const HELP_TEXT = `
Available commands:
  help     - Show this help message
  clear    - Clear terminal
  status   - Show system status
  metrics  - Display system metrics
  neural   - Neural network analysis
  flow     - Show neural pathway flowchart
  exit     - Exit terminal session
`;

export function Terminal() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>(['Welcome to M.AI Terminal v3.1.4', 'Type "help" for available commands']);
  const [view, setView] = useState<string>('');
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (cmd: string) => {
    const command = cmd.toLowerCase().trim();
    
    switch (command) {
      case COMMANDS.HELP:
        setHistory(prev => [...prev, `> ${cmd}`, HELP_TEXT]);
        setView('');
        break;
      case COMMANDS.CLEAR:
        setHistory([]);
        setView('');
        break;
      case COMMANDS.STATUS:
        setHistory(prev => [...prev, `> ${cmd}`, 'Loading system status...']);
        setView('status');
        break;
      case COMMANDS.METRICS:
        setHistory(prev => [...prev, `> ${cmd}`, 'Accessing system metrics...']);
        setView('metrics');
        break;
      case COMMANDS.NEURAL:
        setHistory(prev => [...prev, `> ${cmd}`, 'Analyzing neural network...']);
        setView('neural');
        break;
      case COMMANDS.FLOW:
        setHistory(prev => [...prev, `> ${cmd}`, 'Generating neural pathway flowchart...']);
        setView('flow');
        break;
      case COMMANDS.EXIT:
        setHistory(prev => [...prev, `> ${cmd}`, 'Terminating session...']);
        setTimeout(() => window.location.reload(), 1000);
        break;
      default:
        setHistory(prev => [...prev, `> ${cmd}`, `Command not found: ${cmd}`]);
        setView('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      handleCommand(input);
      setInput('');
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-400 p-4 font-mono">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center gap-2 mb-6 border-b border-green-700 pb-4">
          <TerminalIcon className="w-6 h-6" />
          <h1 className="text-2xl font-bold tracking-wider">M.AI NEURAL INTERFACE v3.1.4</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2 border border-green-700 rounded-lg p-4 bg-black/50 h-[60vh] flex flex-col">
            <div 
              ref={terminalRef}
              className="flex-1 overflow-auto mb-4 terminal-output"
            >
              {history.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap mb-1">
                  {line}
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <span className="text-green-500">{'>'}</span>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-green-400 font-mono"
                autoFocus
              />
            </form>
          </div>

          {view === 'metrics' && <SystemMetrics />}
          {view === 'neural' && <NeuralStatus />}
          {view === 'flow' && <FlowChart />}
        </div>
      </div>
    </div>
  );
}