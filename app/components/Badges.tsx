import React from "react";

export function BadgeOpening() {
  return (
    <div
      className="w-4 h-4 text-center text-xs bg-lime-400/50 rounded"
      title="Opening"
    >
      O
    </div>
  );
}

export function BadgeClosing() {
  return (
    <div
      className="w-4 h-4 text-center text-xs bg-rose-400/50 rounded"
      title="Closing"
    >
      C
    </div>
  );
}

export function BadgePaidBreak() {
  return (
    <div className="text-xs px-1 border border-gray-400 rounded">
      <span>PB</span>
    </div>
  );
}

export function BadgeMealBreak() {
  return (
    <div className="text-xs px-1 border border-gray-400 rounded">
      <span>MB</span>
    </div>
  );
}

interface BreakBadgeProps {
  text: string;
}

export function BreakBadge(props: BreakBadgeProps) {
  return (
    <div className="text-tiny px-0.5 text-gray-600 border border-gray-400 rounded">
      <span>{props.text}</span>
    </div>
  );
}
