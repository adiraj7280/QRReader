/**
 * Checks if a given string is a valid URL
 * @param {string} text - Text to check
 * @returns {boolean} - True if valid URL, false otherwise
 */
export const isValidUrl = (text) => {
    try {
      new URL(text);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  /**
   * Formats a date to a human-readable string
   * @param {Date} date - Date to format
   * @returns {string} - Formatted date string
   */
  export const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  /**
   * Saves an item to localStorage
   * @param {string} key - Storage key
   * @param {any} value - Value to store (will be JSON stringified)
   */
  export const saveToStorage = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  };
  
  /**
   * Retrieves an item from localStorage
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if key not found
   * @returns {any} - Retrieved value or default value
   */
  export const getFromStorage = (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Error retrieving from localStorage:', e);
      return defaultValue;
    }
  };