/**
 * Bus number validation service for CVR College bus tracking system
 * Supports both numeric (1-50) and alphanumeric (A1-A20, B1-B20, C1-C10) formats
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  normalizedValue?: string;
}

/**
 * Validates CVR College bus number format
 * @param busNumber - The bus number to validate
 * @returns ValidationResult with validation status and normalized value
 */
export const validateBusNumber = (busNumber: string): ValidationResult => {
  if (!busNumber || busNumber.trim() === '') {
    return {
      isValid: false,
      error: 'Bus number is required',
    };
  }

  const trimmed = busNumber.trim().toUpperCase();
  
  // Check for numeric format (1-50)
  if (/^\d+$/.test(trimmed)) {
    const number = parseInt(trimmed, 10);
    
    if (number < 1 || number > 50) {
      return {
        isValid: false,
        error: 'Bus number must be between 1 and 50',
      };
    }
    
    return {
      isValid: true,
      normalizedValue: number.toString(),
    };
  }
  
  // Check for alphanumeric format (A1-A20, B1-B20, C1-C10)
  const alphanumericMatch = trimmed.match(/^([A-C])(\d+)$/);
  
  if (alphanumericMatch) {
    const letter = alphanumericMatch[1];
    const number = parseInt(alphanumericMatch[2], 10);
    
    let maxNumber: number;
    switch (letter) {
      case 'A':
      case 'B':
        maxNumber = 20;
        break;
      case 'C':
        maxNumber = 10;
        break;
      default:
        return {
          isValid: false,
          error: 'Invalid bus route. Use A, B, or C routes only',
        };
    }
    
    if (number < 1 || number > maxNumber) {
      return {
        isValid: false,
        error: `${letter} route buses must be between ${letter}1 and ${letter}${maxNumber}`,
      };
    }
    
    return {
      isValid: true,
      normalizedValue: `${letter}${number}`,
    };
  }
  
  return {
    isValid: false,
    error: 'Invalid bus number format. Use numbers (1-50) or letter-number (A1-A20, B1-B20, C1-C10)',
  };
};

/**
 * Sanitizes bus number input by removing invalid characters
 * @param input - Raw input string
 * @returns Sanitized string
 */
export const sanitizeBusNumberInput = (input: string): string => {
  return input
    .replace(/[^A-Za-z0-9]/g, '') // Remove special characters and spaces
    .toUpperCase()
    .slice(0, 10); // Limit length
};

/**
 * Checks if a bus number is in the valid CVR College format
 * @param busNumber - The bus number to check
 * @returns Boolean indicating if format is valid
 */
export const isValidBusNumberFormat = (busNumber: string): boolean => {
  const result = validateBusNumber(busNumber);
  return result.isValid;
};