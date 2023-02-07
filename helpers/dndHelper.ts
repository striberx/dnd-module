import random from 'random';
import seedrandom from 'seedrandom';
import { EditionsEnum } from './enums';

export default class DnDHelper {
  public costs = {
    [EditionsEnum.FifthEdition]: [
      { score: 8, cost: 0 },
      { score: 9, cost: 1 },
      { score: 10, cost: 2 },
      { score: 11, cost: 3 },
      { score: 12, cost: 4 },
      { score: 13, cost: 5 },
      { score: 14, cost: 7 },
      { score: 15, cost: 9 },
    ],
    [EditionsEnum.FourthEdition]: [
      { score: 8, cost: 0 },
      { score: 9, cost: 1 },
      { score: 10, cost: 2 },
      { score: 11, cost: 3 },
      { score: 12, cost: 4 },
      { score: 13, cost: 5 },
      { score: 14, cost: 7 },
      { score: 15, cost: 9 },
      { score: 16, cost: 11 },
      { score: 17, cost: 14 },
      { score: 18, cost: 18 },
    ],
    [EditionsEnum.ThirdEditionRevised]: [
      { score: 8, cost: 0 },
      { score: 9, cost: 1 },
      { score: 10, cost: 2 },
      { score: 11, cost: 3 },
      { score: 12, cost: 4 },
      { score: 13, cost: 5 },
      { score: 14, cost: 6 },
      { score: 15, cost: 8 },
      { score: 16, cost: 10 },
      { score: 17, cost: 13 },
      { score: 18, cost: 16 },
    ],
    [EditionsEnum.Pathfinder]: [
      { score: 7, cost: -4 },
      { score: 8, cost: -2 },
      { score: 9, cost: -1 },
      { score: 10, cost: 0 },
      { score: 11, cost: 1 },
      { score: 12, cost: 2 },
      { score: 13, cost: 3 },
      { score: 14, cost: 5 },
      { score: 15, cost: 7 },
      { score: 16, cost: 10 },
      { score: 17, cost: 13 },
      { score: 18, cost: 17 },
    ],
    Maximums: {
      [EditionsEnum.FifthEdition]: 54,
      [EditionsEnum.FourthEdition]: 108,
      [EditionsEnum.ThirdEditionRevised]: 96,
      [EditionsEnum.Pathfinder]: 102,
    },
  };

  public constructor() {
    const clone = random.clone(seedrandom());
    random.use(clone.rng);
  }

  /**
   * Generate random int
   *
   * @param min - (optional) - Minimum number to generate, inclusive
   * @param max - (optional) - Maximum number to generate, inclusive
   */
  public randomInt = (min = 0, max = 1) => {
    return random.int(min, max);
  };

  /**
   * Generate random float
   *
   * @param min - (optional) - Minimum number to generate, inclusive
   * @param max - (optional) - Maximum number to generate, exclusive
   */
  public randomFloat = (min = 0, max = 1) => {
    return random.float(min, max);
  };

  /*
    POINT BUY FUNCTIONS
    These functions are helpers for point buy related operations
  */

  /**
   * Get score of item based on provided array position and edition
   *
   * Returns '-' if there is no found score
   *
   * @param position - Position in array
   * @param edition - Edition to check
   */
  public getPositionScore = (position: number, edition: EditionsEnum) => {
    const scoreItem = this.costs[edition][position];
    return scoreItem ? scoreItem.score : '-';
  };

  /**
   * Get score of item based on provided score and edition
   *
   * Returns '-' if there is no found score
   *
   * @param score - Score value
   * @param edition - Edition to check
   *
   */
  public getScore = (score: number, edition: EditionsEnum) => {
    const scoreItem = this.costs[edition].find((c) => c.score === score);
    return scoreItem ? scoreItem.score : '-';
  };

  /**
   * Get cost of item based on provided score and edition
   *
   * Returns '-' if there is no found item
   *
   * @param score - Score value
   * @param edition - Edition to check
   */
  public getCost = (score: number, edition: EditionsEnum) => {
    const costItem = this.costs[edition].find((c) => c.score === score);
    return costItem ? costItem.cost : '-';
  };

  /**
   * Validate if we can go onto the next cost based on our remaining and current score of the variable
   *
   * @param currentScore - Score value that we are currently at
   * @param remaining - Amount of points we have remaining to spend
   * @param edition - Edition to check
   */
  public validateNextCost = (currentScore: number, remaining: number, edition: EditionsEnum) => {
    const currentCost = this.getCost(currentScore, edition);
    const nextCost = this.getCost(currentScore + 1, edition);

    if (currentCost !== '-' && nextCost !== '-') {
      const costDiff = currentCost - nextCost;

      return remaining + costDiff >= 0;
    }

    return false;
  };

  /**
   * Validate if we can accept the selected cost
   *
   * @param selectedScore - Score value that we are validating
   * @param remaining - Amount of points we have remaining to spend
   * @param edition - Edition to check
   */
  validateCost = (selectedScore: number, remaining: number, edition: EditionsEnum) => {
    const currentCost = this.getCost(selectedScore, edition);

    if (currentCost !== '-') {
      return remaining - currentCost >= 0;
    }

    return false;
  };

  /**
   * Randomly generates a Point Buy array and its cost based on provided maximum cost and edition
   *
   * @param maxCost - Maximum combined cost of points
   * @param edition - Edition to use
   */
  public randomPointBuy = (maxCost: number, edition: EditionsEnum) => {
    let remaining = maxCost;
    const pointBuy = {
      scores: new Array<number>(),
      costs: new Array<number>(),
      totalCost: 0,
    };
    let attempts = 0;

    // Get initial numbers
    while (remaining > 0 && pointBuy.scores.length < 6) {
      // Get random score
      const scoreSelected = this.getPositionScore(random.int(0, this.costs[edition].length - 1), edition);

      // Something went terribly wrong
      if (typeof scoreSelected !== 'number') return null;

      // Get cost of selected score
      const costSelected = this.getCost(scoreSelected, edition);

      // Something went terribly wrong
      if (typeof costSelected !== 'number') return null;

      // Validate that we can push this value at it's cost
      if (this.validateCost(scoreSelected, remaining, edition)) {
        // Subtract remaining from cost
        remaining -= costSelected;

        // Push points into cost and scores
        pointBuy.scores.push(scoreSelected);
        pointBuy.costs.push(costSelected);

        pointBuy.totalCost += costSelected;
      }
    }

    // Navigate through and correct values until we truly have no more points left
    while (remaining > 0 && attempts !== 500) {
      // Get random item in pointBuy
      const selectedPoint = random.int(0, 5);

      // Retrieve it's score and cost
      const score = pointBuy.scores[selectedPoint];

      // Retrieve nextScore
      const nextScore = this.getScore(Number(score + 1), edition);

      // Check if this score is the last in the series, skip it if it is
      if (typeof nextScore !== 'number') continue;

      // Validate if we can upgrade this score
      if (this.validateNextCost(score, remaining, edition)) {
        // Get upgraded cost
        const nextCost = this.getCost(nextScore, edition);

        if (typeof nextCost !== 'number') continue;

        // Remove upgraded cost from remaining and total
        remaining += pointBuy.costs[selectedPoint] - nextCost;
        pointBuy.totalCost = pointBuy.totalCost - pointBuy.costs[selectedPoint] + nextCost;

        // Replace score and cost with new ones
        pointBuy.scores[selectedPoint] = nextScore;
        pointBuy.costs[selectedPoint] = nextCost;
      }

      // Add attempts to stop it if it gets stuck
      attempts += 1;
    }

    // If we hit remainder and score count isn't maximum, fill with 0 costs
    while (pointBuy.scores.length < 6) {
      const freeScore = this.getPositionScore(0, edition);
      if (typeof freeScore !== 'number') continue;

      pointBuy.scores.push(freeScore);

      const freeCost = this.getCost(freeScore, edition);
      if (typeof freeCost !== 'number') continue;

      pointBuy.costs.push(freeCost);
    }

    return pointBuy;
  };
}
