function countOccurrences(arr) {
  return arr.reduce((acc, name) => {
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
}

function calculatePoints(prediction, match) {
  const { predicted_home, predicted_away, predicted_scorers = [] } = prediction;
  const { home_score, away_score, home_scorers = [], away_scorers = [] } = match;

  const isExact = predicted_home === home_score && predicted_away === away_score;
  let resultPoints = 0;

  if (isExact) {
    resultPoints = 5;
  } else {
    const predictedWinner =
      predicted_home > predicted_away ? 'home' :
      predicted_home < predicted_away ? 'away' : 'draw';
    const actualWinner =
      home_score > away_score ? 'home' :
      home_score < away_score ? 'away' : 'draw';

    if (predictedWinner === actualWinner) {
      resultPoints = predictedWinner === 'draw' ? 3 : 2;
    }
  }

  const allActualScorers = [...home_scorers, ...away_scorers];
  const actualCounts = countOccurrences(allActualScorers);
  const predictedCounts = countOccurrences(predicted_scorers);

  let goalscorerPoints = 0;
  for (const [player, predictedCount] of Object.entries(predictedCounts)) {
    const actualCount = actualCounts[player] || 0;
    goalscorerPoints += Math.min(predictedCount, actualCount);
  }

  if (isExact) {
    goalscorerPoints *= 2;
  }

  return resultPoints + goalscorerPoints;
}

module.exports = { calculatePoints };
