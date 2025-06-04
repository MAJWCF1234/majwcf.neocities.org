import React from 'react';

export function FlowChart() {
  return (
    <div className="lg:col-span-2 border border-green-700 rounded-lg p-4 bg-black/50">
      <h2 className="text-xl mb-4">Neural Pathway Flowchart</h2>
      <div className="overflow-auto text-xs">
        <pre className="whitespace-pre">
{`
Input Layer → Processing Layer → Output Layer
   ↓              ↓               ↓
Voice Input → Audio Process → Speech Output
   ↓              ↓               ↓
Text Input  → Text Process  → Text Output
   ↓              ↓               ↓
Visual Input→ Visual Process→ Action Output
   ↓              ↓               ↓
Sensor Data → Data Process  → Control Output
`}
        </pre>
      </div>
    </div>
  );
}