export type Mark = 'correct' | 'present' | 'absent';

/** Scores a guess against the answer, handling repeated letters correctly. */
export function score(guess: string, answer: string): Mark[] {
  const marks: Mark[] = Array(guess.length).fill('absent');
  const remaining: Record<string, number> = {};
  for (let i = 0; i < answer.length; i++) {
    if (guess[i] === answer[i]) marks[i] = 'correct';
    else remaining[answer[i]] = (remaining[answer[i]] ?? 0) + 1;
  }
  for (let i = 0; i < guess.length; i++) {
    if (marks[i] === 'correct') continue;
    if (remaining[guess[i]] > 0) {
      marks[i] = 'present';
      remaining[guess[i]]--;
    }
  }
  return marks;
}

const RANK: Record<Mark, number> = { absent: 0, present: 1, correct: 2 };

/** Best mark seen so far for each letter, used to colour the keyboard. */
export function keyMarks(guesses: string[], answer: string): Record<string, Mark> {
  const result: Record<string, Mark> = {};
  for (const g of guesses) {
    score(g, answer).forEach((m, i) => {
      const prev = result[g[i]];
      if (!prev || RANK[m] > RANK[prev]) result[g[i]] = m;
    });
  }
  return result;
}
