
/**
 * Football Predictor AI
 * Version 1: Poisson score probability engine
 *
 * Input expected goals must come from a model or reliable data.
 * Example values in the tests are illustrative, not real predictions.
 */

function poissonProbabilities(expectedGoals, maxGoals = 10) {
  if (!Number.isFinite(expectedGoals) || expectedGoals < 0) {
    throw new Error("Expected goals must be a non-negative number.");
  }

  if (!Number.isInteger(maxGoals) || maxGoals < 1 || maxGoals > 20) {
    throw new Error("maxGoals must be an integer from 1 to 20.");
  }

  const probabilities = [];
  probabilities[0] = Math.exp(-expectedGoals);

  for (let goals = 1; goals <= maxGoals; goals++) {
    probabilities[goals] =
      probabilities[goals - 1] * expectedGoals / goals;
  }

  // Normalize the truncated distribution so it sums to 1.
  const total = probabilities.reduce((sum, p) => sum + p, 0);

  return probabilities.map(p => p / total);
}

function predictMatch(homeXG, awayXG, maxGoals = 10) {
  const home = poissonProbabilities(homeXG, maxGoals);
  const away = poissonProbabilities(awayXG, maxGoals);

  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;
  let over25 = 0;
  let bttsYes = 0;
  const scores = [];

  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      const probability = home[h] * away[a];

      scores.push({
        score: `${h}-${a}`,
        homeGoals: h,
        awayGoals: a,
        probability
      });

      if (h > a) homeWin += probability;
      else if (h === a) draw += probability;
      else awayWin += probability;

      if (h + a >= 3) over25 += probability;
      if (h > 0 && a > 0) bttsYes += probability;
    }
  }

  const percentage = p => Number((p * 100).toFixed(2));

  scores.sort((a, b) => b.probability - a.probability);

  return {
    expectedGoals: {
      home: homeXG,
      away: awayXG
    },
    markets: {
      homeWin: percentage(homeWin),
      draw: percentage(draw),
      awayWin: percentage(awayWin),
      over25: percentage(over25),
      under25: percentage(1 - over25),
      bttsYes: percentage(bttsYes),
      bttsNo: percentage(1 - bttsYes)
    },
    mostLikelyScores: scores.slice(0, 5).map(item => ({
      score: item.score,
      probability: percentage(item.probability)
    })),
    modelNote:
      "Statistical estimates, not guarantees. Accuracy depends on the quality of the expected-goals inputs and model validation."
  };
}

// Run with: node engine.js
if (typeof require !== "undefined" && require.main === module) {
  console.log(
    JSON.stringify(predictMatch(1.6, 1.0), null, 2)
  );
}

if (typeof module !== "undefined") {
  module.exports = { poissonProbabilities, predictMatch };
      }
                              
