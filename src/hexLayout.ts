/**
 * @license
 * SPDX-License-Identifier: MIT
 */

export const axialToPixel = (q: number, r: number, size: number) => ({
  x: size * Math.sqrt(3) * (q + r / 2),
  y: size * -1.5 * r,
});
