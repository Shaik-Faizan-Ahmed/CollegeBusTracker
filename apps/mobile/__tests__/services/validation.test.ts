import { validateBusNumber, sanitizeBusNumberInput, isValidBusNumberFormat } from '../../src/services/validation';

describe('Bus Number Validation Service', () => {
  describe('validateBusNumber', () => {
    // Test numeric bus numbers (1-50)
    describe('Numeric bus numbers', () => {
      it('should accept valid numeric bus numbers', () => {
        const validNumbers = ['1', '15', '25', '50'];
        
        validNumbers.forEach(busNumber => {
          const result = validateBusNumber(busNumber);
          expect(result.isValid).toBe(true);
          expect(result.error).toBeUndefined();
          expect(result.normalizedValue).toBe(busNumber);
        });
      });

      it('should reject numeric bus numbers outside valid range', () => {
        const invalidNumbers = ['0', '51', '100', '999'];
        
        invalidNumbers.forEach(busNumber => {
          const result = validateBusNumber(busNumber);
          expect(result.isValid).toBe(false);
          expect(result.error).toBe('Bus number must be between 1 and 50');
        });
      });

      it('should normalize numeric bus numbers by removing leading zeros', () => {
        const result = validateBusNumber('05');
        expect(result.isValid).toBe(true);
        expect(result.normalizedValue).toBe('5');
      });
    });

    // Test alphanumeric bus numbers (A1-A20, B1-B20, C1-C10)
    describe('Alphanumeric bus numbers', () => {
      it('should accept valid A route bus numbers (A1-A20)', () => {
        const validNumbers = ['A1', 'A10', 'A20', 'a5', 'a15'];
        
        validNumbers.forEach(busNumber => {
          const result = validateBusNumber(busNumber);
          expect(result.isValid).toBe(true);
          expect(result.error).toBeUndefined();
          expect(result.normalizedValue).toMatch(/^A\d+$/);
        });
      });

      it('should accept valid B route bus numbers (B1-B20)', () => {
        const validNumbers = ['B1', 'B10', 'B20', 'b5', 'b15'];
        
        validNumbers.forEach(busNumber => {
          const result = validateBusNumber(busNumber);
          expect(result.isValid).toBe(true);
          expect(result.error).toBeUndefined();
          expect(result.normalizedValue).toMatch(/^B\d+$/);
        });
      });

      it('should accept valid C route bus numbers (C1-C10)', () => {
        const validNumbers = ['C1', 'C5', 'C10', 'c3', 'c7'];
        
        validNumbers.forEach(busNumber => {
          const result = validateBusNumber(busNumber);
          expect(result.isValid).toBe(true);
          expect(result.error).toBeUndefined();
          expect(result.normalizedValue).toMatch(/^C\d+$/);
        });
      });

      it('should reject A route numbers outside valid range', () => {
        const invalidNumbers = ['A0', 'A21', 'A25', 'A100'];
        
        invalidNumbers.forEach(busNumber => {
          const result = validateBusNumber(busNumber);
          expect(result.isValid).toBe(false);
          expect(result.error).toBe('A route buses must be between A1 and A20');
        });
      });

      it('should reject B route numbers outside valid range', () => {
        const invalidNumbers = ['B0', 'B21', 'B25', 'B100'];
        
        invalidNumbers.forEach(busNumber => {
          const result = validateBusNumber(busNumber);
          expect(result.isValid).toBe(false);
          expect(result.error).toBe('B route buses must be between B1 and B20');
        });
      });

      it('should reject C route numbers outside valid range', () => {
        const invalidNumbers = ['C0', 'C11', 'C15', 'C20'];
        
        invalidNumbers.forEach(busNumber => {
          const result = validateBusNumber(busNumber);
          expect(result.isValid).toBe(false);
          expect(result.error).toBe('C route buses must be between C1 and C10');
        });
      });

      it('should reject invalid route letters', () => {
        const invalidRoutes = ['D1', 'E5', 'F10', 'Z1'];
        
        invalidRoutes.forEach(busNumber => {
          const result = validateBusNumber(busNumber);
          expect(result.isValid).toBe(false);
          expect(result.error).toBe('Invalid bus number format. Use numbers (1-50) or letter-number (A1-A20, B1-B20, C1-C10)');
        });
      });

      it('should normalize alphanumeric bus numbers to uppercase', () => {
        const testCases = [
          { input: 'a5', expected: 'A5' },
          { input: 'b12', expected: 'B12' },
          { input: 'c3', expected: 'C3' },
        ];

        testCases.forEach(({ input, expected }) => {
          const result = validateBusNumber(input);
          expect(result.isValid).toBe(true);
          expect(result.normalizedValue).toBe(expected);
        });
      });
    });

    // Test edge cases and invalid inputs
    describe('Edge cases and invalid inputs', () => {
      it('should reject empty or null inputs', () => {
        const invalidInputs = ['', ' ', '   ', null, undefined];
        
        invalidInputs.forEach(input => {
          const result = validateBusNumber(input as string);
          expect(result.isValid).toBe(false);
          expect(result.error).toBe('Bus number is required');
        });
      });

      it('should reject invalid formats', () => {
        const invalidFormats = [
          'ABC', '123ABC', 'A', 'B', 'C', '1A', '2B', '3C',
          'AA1', 'BB2', 'CC3', 'A1B', 'B2C', 'C3A',
          '!@#', '$%^', '&*(', '1.5', 'A1.5', 'B2.3'
        ];
        
        invalidFormats.forEach(busNumber => {
          const result = validateBusNumber(busNumber);
          expect(result.isValid).toBe(false);
          expect(result.error).toBe('Invalid bus number format. Use numbers (1-50) or letter-number (A1-A20, B1-B20, C1-C10)');
        });
      });

      it('should handle whitespace by trimming', () => {
        const testCases = [
          ' 15 ', ' A5 ', ' B10 ', ' C3 '
        ];
        
        testCases.forEach(busNumber => {
          const result = validateBusNumber(busNumber);
          expect(result.isValid).toBe(true);
        });
      });
    });
  });

  describe('sanitizeBusNumberInput', () => {
    it('should remove special characters and spaces', () => {
      const testCases = [
        { input: 'A1!@#', expected: 'A1' },
        { input: 'B 2', expected: 'B2' },
        { input: ' C3 ', expected: 'C3' },
        { input: '15$%^', expected: '15' },
        { input: 'A1B2C3', expected: 'A1B2C3' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = sanitizeBusNumberInput(input);
        expect(result).toBe(expected);
      });
    });

    it('should convert to uppercase', () => {
      const testCases = [
        { input: 'a1', expected: 'A1' },
        { input: 'b2', expected: 'B2' },
        { input: 'c3', expected: 'C3' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = sanitizeBusNumberInput(input);
        expect(result).toBe(expected);
      });
    });

    it('should limit length to 10 characters', () => {
      const longInput = 'A1B2C3D4E5F6G7H8I9J0';
      const result = sanitizeBusNumberInput(longInput);
      expect(result).toBe('A1B2C3D4E5');
      expect(result.length).toBe(10);
    });
  });

  describe('isValidBusNumberFormat', () => {
    it('should return true for valid bus numbers', () => {
      const validNumbers = ['1', '15', '50', 'A1', 'B20', 'C10'];
      
      validNumbers.forEach(busNumber => {
        expect(isValidBusNumberFormat(busNumber)).toBe(true);
      });
    });

    it('should return false for invalid bus numbers', () => {
      const invalidNumbers = ['0', '51', 'A21', 'B21', 'C11', 'D1', ''];
      
      invalidNumbers.forEach(busNumber => {
        expect(isValidBusNumberFormat(busNumber)).toBe(false);
      });
    });
  });
});