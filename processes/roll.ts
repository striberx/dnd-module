import { DiceRoller, NumberGenerator, DiceRoll } from '@dice-roller/rpg-dice-roller';
import { NotationError } from '@dice-roller/rpg-dice-roller/types/exceptions';
import { escapeMarkdown } from '../helpers/escapers';
import DnDHelper from '../helpers/dndHelper';

function styleRoll(unstyledRoll: string, max: string, hasSpace: boolean, comparison: boolean) {
  // We do not want to highlight max/min on comparisons
  const maxMinReplacements = !comparison
    ? {
        max: '**',
        '^1$': '**',
      }
    : {};

  const replacements = {
    d$: '~~',
    '!!$': '**',
    '!$': '**',
    r$: '~~',
    '[**]$': '**',
    '[*]$': '**',
    __$: '**__',
    _$: '_',
    ...maxMinReplacements,
  };

  let styledRoll = unstyledRoll.trim();
  let adjusted = false;

  for (const [item, replacement] of Object.entries(replacements)) {
    if (styledRoll.search(item === 'max' ? max : new RegExp(item)) !== -1) {
      styledRoll = replacement + (hasSpace ? ' ' : '') + unstyledRoll + replacement.reverse();
      adjusted = true;
      break;
    }
  }

  // Re-add space if it hasn't been adjusted
  return (!adjusted && hasSpace ? ' ' : '') + styledRoll;
}

/**
 * Rolls dice
 *
 * @param die - Dice input (https://dice-roller.github.io/documentation/guide/#features)
 * @param title - (optional) - Title to attach to roll result
 */
export default function roll(die: string, title?: string) {
  // Instantiate a dndHelper
  const dndHelper = new DnDHelper();

  const roller = new DiceRoller();

  const generator = NumberGenerator.generator;

  // Force roll engine to follow our random seed
  generator.engine = {
    next() {
      return dndHelper.randomInt(-2147483648, 2147483647);
    },
  };

  // Check if die was provided and take it, else set to default
  const dieNotation = die ? die : '1d20';

  // Check if we're doing comparison
  const comparison = dieNotation.includes('>') || dieNotation.includes('<');

  // Prevent infinite loops that occur due to low comparison
  const compPos = dieNotation.indexOf('>');
  if (compPos > 0) {
    let compNum = '';
    for (let nPos = compPos + 1; nPos < dieNotation.length; nPos++) {
      compNum += dieNotation.charAt(nPos);
      if (/^\d+$/.test(dieNotation.charAt(nPos)) && nPos + 1 < dieNotation.length && !/^\d+$/.test(dieNotation.charAt(nPos + 1))) {
        break;
      }
    }
    if (parseInt(compNum) < 1) {
      return 'Please enter a comparison greater than 1.';
    }
  }

  // Check if title was provided and take it, otherwise set to default
  const resultTitle = title ?? 'Result';

  // Figure out value possibles that we need for adjustments
  // Maybe parse the string into something else?
  const maximum = [];
  const diceRequested = [];
  let maxPos = 0;
  let dicePos = 0;
  let totalDieCount = 0;
  let addingWhich = 'dice';
  for (let i = 0; i < dieNotation.length; i++) {
    // Check characters and add properly
    if (/^\d+$/.test(dieNotation.charAt(i))) {
      if (addingWhich === 'max') {
        if (!maximum[maxPos]) {
          maximum[maxPos] = '';
        }
        maximum[maxPos] += dieNotation.charAt(i);
      } else if (addingWhich === 'dice') {
        if (!diceRequested[dicePos]) {
          diceRequested[dicePos] = '';
        }
        diceRequested[dicePos] += dieNotation.charAt(i);
      }
    } else {
      if (dieNotation.charAt(i) === 'd' && dieNotation.charAt(i - 1) && /^\d+$/.test(dieNotation.charAt(i - 1))) {
        addingWhich = 'max';
        dicePos += 1;
        totalDieCount++;

        if (totalDieCount > 150) {
          return 'Please roll less dice.';
        }
      } else {
        if (addingWhich !== 'dice') {
          addingWhich = 'dice';
          maxPos += 1;
        }
      }
    }
  }

  if (maximum.some((val) => parseInt(val) > 1000)) {
    return 'Please enter a smaller dice face.';
  }

  if (diceRequested.some((val) => parseInt(val) >= 9007199254740992)) {
    return 'Please roll less dice or addition value.';
  }

  // Roll notation die and get roll with error handling
  let dieResult;

  try {
    dieResult = roller.roll(dieNotation) as DiceRoll;
  } catch (e) {
    // Reply with expected for NotationError
    if (typeof e === typeof NotationError) {
      return `Invalid notation; Expected "(" or [1-9] but '${(e as NotationError).notation}' found`;
    }

    return `${e}`;
  }

  // Define final reply
  let finalReply = ` :game_die:\n`;

  // Add actual result to roll
  finalReply += `**${resultTitle}:** ${escapeMarkdown(dieNotation)} `;

  const resultOutput = dieResult.output
    .substring(dieResult.output.indexOf(':') + 1, dieResult.output.lastIndexOf('='))
    .replaceAll('[', '(')
    .replaceAll(']', ')')
    .trim();

  const cutChars = ['(', ',', ')'];

  maxPos = 0;
  let rollDie = '';
  let startTracking = false;

  for (let c = 0; c < (resultOutput.length > 500 ? 100 : resultOutput.length); c++) {
    const dieChar = resultOutput.charAt(c);

    if (cutChars.includes(dieChar)) {
      if (rollDie.length > 0) {
        finalReply += styleRoll(rollDie, maximum[maxPos], rollDie.charAt(0) == ' ', comparison);
        rollDie = '';

        if (dieChar === ')') {
          startTracking = false;
          maxPos++;
        }
      } else {
        startTracking = true;
      }

      finalReply += dieChar;
      continue;
    }

    if (startTracking) {
      rollDie += dieChar;
    } else {
      finalReply += escapeMarkdown(dieChar);
    }
  }

  // End result line based on rollsLength
  if (resultOutput.length > 500) {
    /**
     * TODO: Find a way to replace character symbols better (better regex? More complex loop?)
     */
    finalReply = finalReply
      .substring(0, 101)
      .replace(/\*\*(?=\s*$)/, '')
      .replace(/\*(?=\s*$)/, '')
      .replace(/~(?=\s*$)/, '')
      .replace(/_(?=\s*$)/, '')
      .replace(/,(?=\s*$)/, '')
      .trimEnd();
    finalReply += `...`;
  }

  // Add total to roll
  finalReply += `\n**Total: ** ${Math.floor(dieResult.total)}`;

  return finalReply;
}
