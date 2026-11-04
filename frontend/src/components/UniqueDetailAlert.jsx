// UniqueDetailAlert.jsx — The alert shown on the found-item form.
// Warns finders not to reveal unique details in the description or photo.

export default function UniqueDetailAlert() {
  return (
    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800" role="alert">
      <div className="flex items-start gap-3">
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-amber-400 text-xs font-bold">!</span>
        <div>
          <p className="font-bold text-sm mb-1">Don't reveal unique details.</p>
          <p className="text-sm leading-relaxed">
            Leave out marks, stickers, scratches, names, serial numbers, and what's inside.
            Describe it in general terms only, such as colour, type, or brand.
            Keep the unique details to yourself, so the real owner can prove it's theirs.
          </p>
        </div>
      </div>
    </div>
  );
}
