const { calculatePoints } = require('../src/services/scoring');

const makeMatch = (homeScore, awayScore, homeScorers = [], awayScorers = []) => ({
  home_score: homeScore,
  away_score: awayScore,
  home_scorers: homeScorers,
  away_scorers: awayScorers,
});

const makePred = (home, away, scorers = []) => ({
  predicted_home: home,
  predicted_away: away,
  predicted_scorers: scorers,
});

describe('calculatePoints — result', () => {
  it('exact result → 5 pts', () => {
    expect(calculatePoints(makePred(2, 1), makeMatch(2, 1))).toBe(5);
  });

  it('correct winner (wrong score) → 2 pts', () => {
    expect(calculatePoints(makePred(1, 0), makeMatch(2, 1))).toBe(2);
  });

  it('correct draw (wrong exact score) → 3 pts', () => {
    expect(calculatePoints(makePred(0, 0), makeMatch(1, 1))).toBe(3);
  });

  it('exact draw → 5 pts (not 3)', () => {
    expect(calculatePoints(makePred(1, 1), makeMatch(1, 1))).toBe(5);
  });

  it('wrong winner → 0 pts', () => {
    expect(calculatePoints(makePred(0, 2), makeMatch(2, 1))).toBe(0);
  });

  it('0-0 exact → 5 pts', () => {
    expect(calculatePoints(makePred(0, 0), makeMatch(0, 0))).toBe(5);
  });
});

describe('calculatePoints — goalscorers', () => {
  it('wrong result + correct scorers → result pts + scorer pts (no multiplier)', () => {
    // correct winner (2 pts) + 2 scorers (2 pts, no ×2) = 4
    const match = makeMatch(2, 1, ['Messi', 'Lautaro'], []);
    expect(calculatePoints(makePred(1, 0, ['Messi', 'Lautaro']), match)).toBe(4);
  });

  it('exact result + correct scorers → 5 + scorers×2', () => {
    const match = makeMatch(2, 1, ['Messi', 'Lautaro'], []);
    expect(calculatePoints(makePred(2, 1, ['Messi', 'Lautaro']), match)).toBe(9);
  });

  it('scorer pts apply even with completely wrong result', () => {
    const match = makeMatch(2, 1, ['Messi'], []);
    expect(calculatePoints(makePred(0, 2, ['Messi']), match)).toBe(1);
  });

  it('partial scorer match — only matched goals count', () => {
    const match = makeMatch(2, 1, ['Messi', 'Lautaro'], []);
    // wrong result (correct winner=2pts) + 1 of 2 scorers = 3
    expect(calculatePoints(makePred(1, 0, ['Messi']), match)).toBe(3);
  });

  it('multi-goal scorer — min(predicted, actual) goals count', () => {
    // Messi scores 2, predict Messi×2: both counted
    const match = makeMatch(3, 0, ['Messi', 'Messi', 'Lautaro'], []);
    // exact result + Messi×2 = 5 + (2×2) = 9
    expect(calculatePoints(makePred(3, 0, ['Messi', 'Messi']), match)).toBe(9);
  });

  it('over-predicted scorer — capped at actual goals', () => {
    // Messi scores 1, predict Messi×3: only 1 counts
    const match = makeMatch(1, 0, ['Messi'], []);
    // exact result + min(3,1)×2 = 5 + 2 = 7
    expect(calculatePoints(makePred(1, 0, ['Messi', 'Messi', 'Messi']), match)).toBe(7);
  });

  it('no scorers predicted → only result pts', () => {
    const match = makeMatch(2, 1, ['Messi', 'Lautaro'], []);
    expect(calculatePoints(makePred(2, 1, []), match)).toBe(5);
  });
});
