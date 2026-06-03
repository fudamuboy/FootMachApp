import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Based on iPhone 14 / iPhone 13 Pro (390 width)
const baseWidth = 390;

/**
 * Responsive size scaling based on screen width.
 * @param {number} size - The original size to scale
 * @returns {number} The scaled size
 */
export const rs = (size) => {
    const newSize = size * (SCREEN_WIDTH / baseWidth);
    if (Platform.OS === 'ios') {
        return Math.round(newSize);
    } else {
        return Math.round(newSize) - 1;
    }
};

/**
 * Calculate responsive width based on percentage of screen width
 * @param {number} percentage - Percentage of screen width (0-100)
 * @returns {number} Calculated width in pixels
 */
export const rw = (percentage) => {
    return (SCREEN_WIDTH * percentage) / 100;
};

// Determine if device is tablet
export const isTablet = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) >= 768;

/**
 * Returns a max width value for tablet layouts to prevent excessive stretching
 * @param {number} maxForTablet - The maximum width on tablet (e.g. 600, 800)
 * @param {number|string} defaultWidth - The width for phones (e.g. '100%')
 * @returns {number|string} The resolved width value
 */
export const getResponsiveWidth = (maxForTablet = 600, defaultWidth = '100%') => {
    return isTablet ? maxForTablet : defaultWidth;
};
