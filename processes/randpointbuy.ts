import { EditionsEnum } from '../helpers/enums';
import DnDHelper from '../helpers/dndHelper';

/**
 * Randomly generates point buy arrays and its cost based on provided edition
 *
 * @param edition - (optional) - Edition to use, defaults to 5e
 * @param generateCount - (optional) - Amount of point buys to generate, defaults to 1
 * @param pointMax - (optional) - Max points to spend, defaults to 27
 */
export default function randpointbuy(edition?: EditionsEnum, generateCount?: number, pointMax?: number) {
  const dndHelper = new DnDHelper();

  // Max points to spend or default to 27 (5e default) if none is set
  let maxPoints = pointMax ?? 27;

  // Check if defined points exceed the maximum allowed and set it to max if they do
  if (maxPoints > dndHelper.costs['Maximums'][edition ?? EditionsEnum.FifthEdition]) {
    maxPoints = dndHelper.costs['Maximums'][edition ?? EditionsEnum.FifthEdition];
  }

  // Check how many to generate
  let maxGenerates = generateCount ?? 1;

  // Check if maximum is greater than 10 and set it to 10
  if (maxGenerates > 10) {
    maxGenerates = 10;
  }

  // Define pointBuys array and run pointBuy function based on how many we want generated
  const pointBuys = [];

  // Run through and generate defined amounts of arrays
  for (let generated = 0; generated < maxGenerates; generated++) {
    pointBuys.push(dndHelper.randomPointBuy(maxPoints, edition ?? EditionsEnum.FifthEdition));
  }

  // Define final reply
  let finalReply = `\n`;
  finalReply += maxGenerates > 1 ? `Generating ${maxGenerates} Point Buy arrays...` : ``;

  // Create final response based on how many arrays we generated
  for (let generated = 0; generated < maxGenerates; generated++) {
    if (pointBuys[generated]) {
      if (maxGenerates > 1) {
        finalReply += `\n*Point Buy ${generated + 1}:*\n`;
      }
      finalReply += `**Scores:** ${pointBuys[generated]?.scores}\n**Costs:** ${pointBuys[generated]?.costs}\n**Total Cost:** ${pointBuys[generated]?.totalCost}`;
    } else {
      return 'Something went wrong. Please try again or contact an administrator if this keeps occurring.';
    }
  }

  return finalReply;
}
