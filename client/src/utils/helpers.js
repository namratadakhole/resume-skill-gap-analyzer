/**
 * Helper utilities for the client application.
 */

/**
 * Capitalizes the first letter of a string.
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Rounds a number to a specific decimal place.
 */
export const roundTo = (num, decimals = 1) => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Extracts a neat file name without path and extension.
 */
export const getCleanFileName = (fileName) => {
  if (!fileName) return 'candidate';
  return fileName.split('\\').pop().split('/').pop().replace(/\.[^/.]+$/, "");
};
