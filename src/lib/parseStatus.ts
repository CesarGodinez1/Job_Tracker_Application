import type { ApplicationStatus } from "@prisma/client";

// crude keyword mapping; tweak as you like
const rules: Array<[ApplicationStatus, RegExp[]]> = [
  ["APPLIED",   [/\b(thank you for (your )?application|application received)\b/i]],
  ["OA",        [/\b(assessment|coding challenge|online assessment|hackerrank)\b/i]],
  ["INTERVIEW", [/\b(interview|phone screen|onsite|schedule|recruiter call)\b/i]],
  ["OFFER",     [/\b(offer|compensation package|congratulations\s+we'?d like)\b/i]],
  ["REJECTED",  [/\b(we regret|unfortunately|not moving forward|reject)\b/i]],
  ["WITHDRAWN", [/\b(withdraw|withdrawn)\b/i]],
];

export function detectStatus(text: string): ApplicationStatus | null {
  for (const [status, patterns] of rules) {
    if (patterns.some((rx) => rx.test(text))) return status;
  }
  return null;
}

export function guessCompany(fromHeader: string, subject: string): string | null {
  // try domain name from "From"
  const m = fromHeader.match(/@([a-z0-9-]+)\.[a-z]{2,}/i);
  if (m?.[1] && !["gmail","outlook","microsoft","googlemail","yahoo"].includes(m[1].toLowerCase())) {
    return capitalize(m[1].replace(/-/g, " "));
  }
  // fallback: first word before ":" or "-" in subject
  const s = subject.split(/:|-/)[0]?.trim();
  if (s && s.length <= 32) return capitalize(s.replace(/[^a-z ]/gi, ""));
  return null;
}

export function guessPosition(subject: string, snippet: string): string | null {
  const m = subject.match(/\b(software|swe|engineer|developer|intern|data|ml|frontend|backend)[^,|;]*/i);
  if (m) return capitalize(m[0]);
  const n = snippet.match(/\b(software|swe|engineer|developer|intern|data|ml|frontend|backend)[^,|;]*/i);
  return n ? capitalize(n[0]) : null;
}

function capitalize(s: string) {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}