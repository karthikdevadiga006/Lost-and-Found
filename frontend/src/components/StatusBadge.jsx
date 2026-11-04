// StatusBadge.jsx — Shared status badge with spec-defined colours.
// open = blue, pending = amber, accepted/returned/resolved = green, rejected = red.

const STATUS_STYLES = {
  open:     "bg-blue-100 text-blue-700 ring-blue-300",
  pending:  "bg-amber-100 text-amber-700 ring-amber-300",
  accepted: "bg-emerald-100 text-emerald-700 ring-emerald-300",
  returned: "bg-emerald-100 text-emerald-700 ring-emerald-300",
  resolved: "bg-emerald-100 text-emerald-700 ring-emerald-300",
  rejected: "bg-red-100 text-red-700 ring-red-300",
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || "bg-surface-100 text-surface-700 ring-surface-300";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${style}`}
    >
      {status}
    </span>
  );
}
