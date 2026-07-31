// corrects a mistyped suburb against the suburbs that actually exist nearby.
// street names are never corrected — they collide far too densely, so a
// "correction" would quietly send someone to a different real street.
// only runs when a strict search found nothing, so the common path never pays for it

// bounded damerau-levenshtein — counts a swapped pair as one edit, because
// "waratha" for "waratah" is the typo people actually make. bails out early
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prevPrev: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(row[j - 1]! + 1, prev[j]! + 1, prev[j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, prevPrev[j - 2]! + 1);
      }
      row.push(v);
      if (v < best) best = v;
    }
    if (best > max) return max + 1;
    prevPrev = prev;
    prev = row;
  }
  return prev[b.length]!;
}

// one edit, never two — nearly half of all street words sit within one edit of
// another real street word, so a second edit is invention rather than correction
const MAX_EDITS = 1;

// short words carry too little signal: "st" must not become "at"
const MIN_LENGTH = 5;

export type Vocab = { term: string; uses: number }[];

// the closest real word, or null when nothing is near enough OR more than one
// word is equally close. milson/wilson/milton are all real streets, so guessing
// the popular one is worse than returning nothing
export function correct(word: string, vocab: Vocab): string | null {
  if (word.length < MIN_LENGTH) return null;

  let best: string | null = null;
  let bestDist = MAX_EDITS + 1;
  let tied = false;

  for (const entry of vocab) {
    if (Math.abs(entry.term.length - word.length) > MAX_EDITS) continue;
    const dist = editDistance(word, entry.term, MAX_EDITS);
    if (dist > MAX_EDITS) continue;
    if (dist < bestDist) {
      best = entry.term;
      bestDist = dist;
      tied = false;
    } else if (dist === bestDist && entry.term !== best) {
      tied = true;
    }
  }

  return tied ? null : best;
}
