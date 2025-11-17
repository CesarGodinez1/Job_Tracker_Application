import type { gmail_v1 } from "googleapis";
import type { ApplicationStatus } from "@prisma/client";

const norm = (s: string | undefined | null) =>
  (s ?? "").replace(/\s+/g, " ").trim().toLowerCase();

/** Strip HTML tags & decode a few common entities for rough text parsing */
function htmlToText(html: string): string {
  let s = html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ");
  // Convert common block breaks to newlines so we can grab lines reliably
  s = s
    .replace(/<br\s*\/?>(?=\s*\n?)/gi, "\n")
    .replace(/<\/(p|div|li|tr|table|h[1-6])>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, " ");

  s = s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

  // Normalize whitespace but keep newlines
  s = s.replace(/[\t\r]+/g, " ");
  s = s.replace(/\u00A0/g, " ");
  s = s.replace(/\s*\n\s*/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  s = s.replace(/[ \f\v]{2,}/g, " ");
  return s.trim();
}

export function guessCompany(fromHeader: string | undefined): string | undefined {
  if (!fromHeader) return undefined;

  // "Lockheed Martin <donotreply@trm.brassring.com>"
  const displayMatch = fromHeader.match(/^"?([^"<]+?)"?\s*<[^>]+>/);
  if (displayMatch) {
    const name = displayMatch[1]
      .replace(/\b(careers?|jobs?|talent acquisition|recruit(ing|ment))\b/gi, "")
      .trim();
    if (name) return name;
  }

  const emailMatch = fromHeader.match(/<([^>]+)>|([^\s]+@[^\s>]+)/);
  const email = (emailMatch?.[1] || emailMatch?.[2] || "").toLowerCase();
  const [localPart, domain = ""] = email.split("@");
  if (domain) {
    if (domain.includes("lockheed") || domain.includes("brassring")) return "Lockheed Martin";
    if (domain.includes("google")) return "Google";
    if (domain.includes("amazon")) return "Amazon";
    if (domain.includes("microsoft")) return "Microsoft";
    if (domain.includes("meta")) return "Meta";
    if (domain.includes("myworkday.com") && localPart && !/^(no[-_]?reply|donotreply|noreply|notifications?)$/.test(localPart)) {
      return titleCase(localPart);
    }
    const prim = domain.split(".")[0].replace(/-/g, " ");
    return prim.replace(/\b\w/g, c => c.toUpperCase());
  }
  return undefined;
}

/** Extract plain text. If no text/plain is present, use text/html and strip tags. */
function extractText(msg: gmail_v1.Schema$Message): string {
  const decode = (b64?: string) =>
    !b64 ? "" : Buffer.from(b64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");

  const walk = (p?: gmail_v1.Schema$MessagePart): { text: string; html: string } => {
    if (!p) return { text: "", html: "" };
    if (p.parts?.length) {
      return p.parts
        .map(walk)
        .reduce(
          (acc, cur) => ({ text: acc.text + cur.text, html: acc.html + cur.html }),
          { text: "", html: "" }
        );
    }
    const data = decode(p.body?.data);
    if (p.mimeType?.startsWith("text/plain")) return { text: data, html: "" };
    if (p.mimeType?.startsWith("text/html")) return { text: "", html: data };
    return { text: "", html: "" };
  };

  const res = walk(msg.payload || undefined);
  if (res.text.trim()) return res.text;
  if (res.html.trim()) return htmlToText(res.html);
  return "";
}

function titleCase(s: string | undefined) {
  if (!s) return s;
  return s
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function parseJobEmail(
  msg: gmail_v1.Schema$Message
): { status: ApplicationStatus; company?: string; position?: string } | undefined {
  const headers = msg.payload?.headers ?? [];
  const getHeader = (n: string) => headers.find(h => h.name?.toLowerCase() === n.toLowerCase())?.value ?? "";

  const subjectRaw = getHeader("Subject");
  const subject = norm(subjectRaw);
  const from = getHeader("From");
  const snippet = norm(msg.snippet || "");
  const bodyRaw = extractText(msg);
  const bodyText = norm(bodyRaw);
  const hay = `${subject} ${snippet} ${bodyText}`;
  const hayLower = `${subjectRaw} ${msg.snippet ?? ""} ${bodyRaw}`.toLowerCase();

  // ====== Status heuristics (expanded) ======
  const isApplied =
    /\b(thank you (for|in) (your )?(interest|applying)|thanks? for applying|application (has been )?(received|submitted)|application is in|we (?:have )?received your application|submission (?:has been )?received|your application (?:has been )?received|resume has been submitted|candidate reference (number)?)\b/i.test(hay);

  const isOA =
    /\b(online (coding )?assessment|assessment invitation|hacker?rank|codility|code(signal|signal)|karat)\b/i.test(hay);

  // "Interview" is often mentioned in application receipts (e.g., "if selected for an interview...").
  // Use a stronger heuristic that requires scheduling/confirming context.
  const isInterviewStrong =
    /\b((schedule|scheduled|scheduling|book|confirm|confirmed|availability|timeslot|calendar).{0,40}interview|interview.{0,40}(schedule|scheduled|scheduling|book|confirm|confirmed|availability|timeslot|calendar)|phone screen|recruiter screen|onsite|on-site)\b/i.test(hay);
  const isConditionalInterview = /\bif selected for an interview\b/i.test(bodyRaw);

  const isOffer =
    /\b(offer letter|extend(ed)? an offer|we are pleased to offer)\b/i.test(hay);

  const isRejectedStrong = /\b(we\s+regret\s+to\s+inform\s+you|will\s+not\s+be\s+moving\s+forward|not\s+moving\s+forward|are\s+unable\s+to\s+move\s+forward|application\s+(?:has\s+been\s+)?(unsuccessful|rejected)|no\s+longer\s+under\s+consideration)\b/i.test(hayLower);
  const mentionsNoLongerConsidered = /\bno\s+longer\s+(?:being\s+)?considered\b/i.test(hayLower);
  const isFutureNotice = /(will\s+(?:receive|be\s+notified|be\s+sent).{0,80}no\s+longer\s+(?:being\s+)?considered|when\s+you\s+are\s+no\s+longer\s+(?:being\s+)?considered)/i.test(hayLower);
  const isRejected = isRejectedStrong || (mentionsNoLongerConsidered && !isFutureNotice);

  let status: ApplicationStatus | undefined;
  if (isOffer) status = "OFFER";
  else if (isInterviewStrong && !isConditionalInterview) status = "INTERVIEW";
  else if (isOA) status = "OA";
  else if (isRejected) status = "REJECTED";
  else if (isApplied) status = "APPLIED";

  if (!status) return undefined;

  // ====== Company + Position guesses ======
  let company = guessCompany(from);

  // Try to pull company from subjects like "Your Disney Careers Application Is In!"
  if (!company) {
    const mCompany = subjectRaw.match(/your\s+(.+?)\s+careers?\s+application\s+is\s+in/i);
    if (mCompany?.[1]) company = titleCase(mCompany[1]);
  }

  // “Subject — …” or “… at Company”
  const dash = subjectRaw.match(/^(.*?)\s[-–—]\s(.*)$/);
  if (dash && !company) company = titleCase(dash[1]);

  const atPat = subjectRaw.match(/^(.*?)\s(?:at|@)\s(.*)$/i);
  if (atPat && !company) company = titleCase(atPat[2]);

  // Position: try body context like "submitted for the following position(s): <line>"
  let position: string | undefined;
  // Use a regex to capture the first line after "position(s):"
  const m = bodyRaw.match(/position\(s\):\s*([^\n\r]+)/i);
  if (m?.[1]) {
    let p = m[1]
      .replace(/\b[A-Z0-9]{5,}\b/g, "") // drop req IDs like 700722BR
      .replace(/[:.,;]+\s*$/, "")
      .trim();
    position = titleCase(p);
  }
  if (!position) {
    const posMatch = subject.match(/\b(intern|internship|software engineer|swe|frontend|back\s?end|full[- ]stack|data|ml|security|devops)\b/i);
    if (posMatch) position = titleCase(posMatch[0]);
  }
  if (!position) {
    const m2 = bodyRaw.match(/\b(?:interest (?:you(?:'|’)ve|you have) shown in the|for the|regarding the)\s+(.+?)\s+position\b/i);
    if (m2?.[1]) {
      let p = m2[1]
        .replace(/[,\-]\s*(spring|summer|fall|winter)\s*\d{4}/i, "")
        .replace(/\s*\(.*?\)$/, "")
        .trim();
      position = titleCase(p);
    }
  }

  return { status, company, position };
}
