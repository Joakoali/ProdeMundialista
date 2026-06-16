function countOccurrences(arr) {
  return arr.reduce((acc, name) => {
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
}

export function goalscorerBadge(predictedScorers, homeScorers, awayScorers) {
  if (!predictedScorers || predictedScorers.length === 0) return null;
  const actual = countOccurrences([...(homeScorers || []), ...(awayScorers || [])]);
  const predicted = countOccurrences(predictedScorers);
  let hits = 0;
  for (const [player, count] of Object.entries(predicted)) {
    hits += Math.min(count, actual[player] || 0);
  }
  return `${hits}/${predictedScorers.length} goleadores`;
}
