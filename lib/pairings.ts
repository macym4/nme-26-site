export type PairingRecommendation = {
  newMember: string;
  matches: { name: string; score: number; mandatory: boolean; reason: string }[];
  notes: string[];
};
export type ExistingWeekPairing = { primary: string; partners: string[] };
export type ExistingPairings = { pc25: Record<number, ExistingWeekPairing[]>; pc26: Record<number, ExistingWeekPairing[]> };
export type PairingFeedback = Record<string, { comfort: number; conversation: number }>;

function key(value: string) { return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/\([^)]*\)/g, "").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim(); }
export function pairingKey(one: string, two: string) { return [key(one), key(two)].sort().join("|"); }
// Feedback belongs to the respondent, not to both people in the pair.
export function feedbackKey(member: string, partner: string) { return [key(member), key(partner)].join("|"); }
