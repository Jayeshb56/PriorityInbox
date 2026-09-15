const CRITICAL_RULES = [
  { re: /\b(otp|one[- ]time (password|code)|verification code)\b/i, weight: 10 },
  { re: /\b(emi|loan|instal?lment|credit card|debit card|bank account)\b/i, weight: 9 },
  { re: /\b(income tax|tax dept|it department|gst)\b/i, weight: 9 },
  { re: /\b(legal|court|notice|summons|advocate|police|fir)\b/i, weight: 9 },
  { re: /\b(payment (due|failed|declined)|overdue|outstanding|due (today|tomorrow|immediately))\b/i, weight: 9 },
  { re: /\b(suspended|blocked|frozen|deactivated)\b/i, weight: 8 },
  { re: /\b(fraud|unauthorized|suspicious (activity|login)|security alert)\b/i, weight: 9 },
  { re: /\b(final (warning|reminder)|last (day|chance|notice))\b/i, weight: 8 },
  { re: /\b(balance|account)\b.*\b(low|insufficient)\b/i, weight: 7 },
  { re: /\b(hospital|medical|emergency|ambulance)\b/i, weight: 8 },
];

const HIGH_RULES = [
  { re: /\b(meeting|appointment|interview|call (at|on|today)|schedule[d]?)\b/i, weight: 6 },
  { re: /\b(deadline|due (date|soon)|renewal|expire[sd]?|expiring)\b/i, weight: 6 },
  { re: /\b(today|tomorrow|tonight|asap|urgent(?!ly needed money))\b/i, weight: 5 },
  { re: /\b(reminder|pending|awaiting|action required)\b/i, weight: 5 },
  { re: /\b(flight|train|booking|reservation|pnr)\b/i, weight: 6 },
  { re: /\b(exam|result|admission|fee payment)\b/i, weight: 5 },
  { re: /\b(delivery|shipment|out for delivery|arriving)\b/i, weight: 4 },
  { re: /\b(rent|landlord|agreement)\b/i, weight: 5 },
  { re: /\b(invoice|receipt|bill)\b/i, weight: 4 },
];

const LOW_RULES = [
  { re: /\b(newsletter|digest|unsubscribe|weekly|monthly roundup)\b/i, weight: -8 },
  { re: /\b(sale|discount|offer|coupon|deal|cashback|%\s?off)\b/i, weight: -8 },
  { re: /\b(promotional|marketing|advert|sponsored)\b/i, weight: -8 },
  { re: /\b(congratulations|you (have )?won|lucky (draw|winner)|prize)\b/i, weight: -10 },
  { re: /\b(no[- ]?reply|donotreply|noreply)\b/i, weight: -5 },
];

const CRITICAL_SENDERS = [
  /income.?tax/i, /\bbank\b/i, /\bhdfc\b/i, /\bicici\b/i, /\bsbi\b/i, /\baxis\b/i,
  /gov|govt|nic\.in|gov\.in/i, /court/i, /police/i, /\bcbdt\b/i, /\bepfo\b/i,
];

export function classify({ from = '', subject = '', body = '' }) {
  const text = `${subject} ${body}`;
  let score = 0;
  let matched = [];

  for (const r of CRITICAL_RULES) {
    if (r.re.test(text)) { score += r.weight; matched.push(r.re.source.slice(0, 24)); }
  }
  for (const r of HIGH_RULES) {
    if (r.re.test(text)) { score += r.weight; }
  }
  for (const r of LOW_RULES) {
    if (r.re.test(text)) { score += r.weight; }
  }
  if (CRITICAL_SENDERS.some((re) => re.test(from))) score += 7;

  let priority;
  if (score >= 7) priority = 'Critical';
  else if (score >= 2) priority = 'High';
  else priority = 'Low';

  return { priority, score };
}

export function formatTime(ms) {
  if (!ms) return '';
  const d = new Date(Number(ms));
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}
