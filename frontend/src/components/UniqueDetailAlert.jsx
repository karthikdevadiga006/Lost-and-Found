// UniqueDetailAlert.jsx — The alert shown on the found-item form.
// Warns finders not to reveal unique details in the description or photo.

export default function UniqueDetailAlert() {
  return (
    <div className="p-4 sm:p-5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900" role="alert">
      <div className="flex items-start gap-3.5">
        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-800 text-base font-bold shadow-xs">
          !
        </div>
        <div>
          <p className="font-extrabold text-sm mb-1 text-amber-900 tracking-tight">Protect the item verification detail</p>
          <p className="text-xs sm:text-sm leading-relaxed text-amber-800/90">
            Leave out scratches, stickers, serial numbers, case colors, or bag contents from the public listing.
            Describe it in general terms only so that the genuine owner can prove ownership by describing those exact hidden details.
          </p>
        </div>
      </div>
    </div>
  );
}
