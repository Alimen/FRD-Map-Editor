/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const axialToPixel = (q: number, r: number, size: number) => ({
  x: size * Math.sqrt(3) * (q + r / 2),
  y: size * -1.5 * r,
});
