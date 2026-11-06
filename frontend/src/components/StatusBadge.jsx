// StatusBadge.jsx — Shared status badge with spec-defined colours and indicator dot.
// open = blue, pending = amber, accepted/returned/resolved = green, rejected = red.

const STATUS_CONFIG = {
  open: {
    badge: "bg-blue-50 text-blue-700 ring-blue-200/80",
    dot: "bg-blue-500",
  },
  pending: {
    badge: "bg-amber-50 text-amber-700 ring-amber-200/80",
    dot: "bg-amber-500",
  },
  accepted: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200/80",
    dot: "bg-emerald-500",
  },
  returned: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200/80",
    dot: "bg-emerald-500",
  },
  resolved: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200/80",
    dot: "bg-emerald-500",
  },
  rejected: {
    badge: "bg-red-50 text-red-700 ring-red-200/80",
    dot: "bg-red-500",
  },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || {
    badge: "bg-surface-100 text-surface-700 ring-surface-300",
    dot: "bg-surface-400",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset ${config.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.dot}`} />
      <span className="capitalize">{status}</span>
    </span>
  );
}
