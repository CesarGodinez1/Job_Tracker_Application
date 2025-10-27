type Counts = Record<
  "TOTAL" | "SAVED" | "APPLIED" | "OA" | "INTERVIEW" | "OFFER" | "REJECTED" | "WITHDRAWN",
  number
>;

export default function StatsBar({ counts }: { counts: Counts }) {
  const items: Array<[keyof Counts, string]> = [
    ["TOTAL", "Total"],
    ["SAVED", "Saved"],
    ["APPLIED", "Applied"],
    ["OA", "OA"],
    ["INTERVIEW", "Interview"],
    ["OFFER", "Offer"],
    ["REJECTED", "Rejected"],
    ["WITHDRAWN", "Withdrawn"],
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map(([key, label]) => (
        <div
          key={key}
          className="rounded-full border px-3 py-1 text-sm bg-white text-black"
          title={label}
        >
          <span className="opacity-70 mr-2">{label}</span>
          <span className="font-semibold">{counts[key]}</span>
        </div>
      ))}
    </div>
  );
}