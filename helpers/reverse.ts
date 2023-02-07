/**
 * Reversed a string.
 *
 * @param input - Content to reverse
 */
export default function reverse(input: string) {
  let o = '';
  for (let i = input.length - 1; i >= 0; i--) o += input[i];
  return o;
}
