import type { gmail_v1 } from "googleapis";
import type { ApplicationStatus } from "@prisma/client";

const norm = (s: string | undefined | null) =>
  (s ?? "").replace(/\s+/g, " ").trim().toLowerCase();

/** Strip HTML tags & decode a few common entities for rough text parsing */
function htmlToText(html: string): string {
  const withoutTags = html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return withoutTags
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
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

  const domainMatch = fromHeader.match(/@([a-z0-9.-]+\.[a-z]{2,})/i);
  if (domainMatch) {
    const domain = domainMatch[1].toLowerCase();
    if (domain.includes("lockheed") || domain.includes("brassring")) return "Lockheed Martin";
    if (domain.includes("google")) return "Google";
    if (domain.includes("amazon")) return "Amazon";
    if (domain.includes("microsoft")) return "Microsoft";
    if (domain.includes("meta")) return "Meta";
    return domain.split(".")[0].replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
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
  const bodyText = norm(extractText(msg));
  const hay = `${subject} ${snippet} ${bodyText}`;

  // ====== Status heuristics (expanded) ======
  const isApplied =
    /\b(thank you (for|in) (your )?(interest|applying)|application (has been )?(received|submitted)|resume has been submitted|candidate reference (number)?)\b/i.test(hay);

  const isOA =
    /\b(online (coding )?assessment|assessment invitation|hacker?rank|codility|code(signal|signal)|karat)\b/i.test(hay);

  const isInterview =
    /\b(interview|phone screen|recruiter screen|onsite|on-site|schedule (an|your)? interview)\b/i.test(hay);

  const isOffer =
    /\b(offer letter|extend(ed)? an offer|we are pleased to offer)\b/i.test(hay);

  const isRejected =
    /\b(no longer being considered|unfortunately|we (regret|are unable) to move forward|after careful consideration)\b/i.test(hay);

  let status: ApplicationStatus | undefined;
  if (isOffer) status = "OFFER";
  else if (isInterview) status = "INTERVIEW";
  else if (isOA) status = "OA";
  else if (isRejected) status = "REJECTED";
  else if (isApplied) status = "APPLIED";

  if (!status) return undefined;

  // ====== Company + Position guesses ======
  let company = guessCompany(from);

  // “Subject — …” or “… at Company”
  const dash = subjectRaw.match(/^(.*?)\s[-–—]\s(.*)$/);
  if (dash && !company) company = titleCase(dash[1]);

  const atPat = subjectRaw.match(/^(.*?)\s(?:at|@)\s(.*)$/i);
  if (atPat && !company) company = titleCase(atPat[2]);

  // Loose position term from subject
  let position: string | undefined;
  const posMatch =
    subject.match(/\b(intern|internship|software engineer|swe|frontend|back\s?end|full[- ]stack|data|ml|security|devops)\b/i);
  if (posMatch) position = titleCase(posMatch[0]);

  return { status, company, position };
}