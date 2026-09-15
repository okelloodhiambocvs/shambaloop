import { UserRole, ListingType } from '../types';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  success: boolean;
  errors: Record<string, string>;
}

export type FieldValidator<T> = (value: T, context: any) => string | null;

export interface FieldSchema<T> {
  required?: boolean;
  validators?: FieldValidator<T>[];
}

export type Schema<T> = {
  [K in keyof T]?: FieldSchema<T[K]>;
};

// Common Validators
export const Validators = {
  minLength: (len: number, fieldName: string): FieldValidator<string> => {
    return (val) => {
      if (!val || val.length < len) {
        return `${fieldName} must be at least ${len} characters long`;
      }
      return null;
    };
  },
  
  maxLength: (len: number, fieldName: string): FieldValidator<string> => {
    return (val) => {
      if (val && val.length > len) {
        return `${fieldName} cannot exceed ${len} characters`;
      }
      return null;
    };
  },

  pattern: (regex: RegExp, message: string): FieldValidator<string> => {
    return (val) => {
      if (val && !regex.test(val)) {
        return message;
      }
      return null;
    };
  },

  min: (minValue: number, fieldName: string): FieldValidator<number> => {
    return (val) => {
      if (val === undefined || val === null || val < minValue) {
        return `${fieldName} must be at least ${minValue}`;
      }
      return null;
    };
  },

  oneOf: <T>(allowed: T[], fieldName: string): FieldValidator<T> => {
    return (val) => {
      if (val && !allowed.includes(val)) {
        return `${fieldName} must be one of: ${allowed.join(', ')}`;
      }
      return null;
    };
  },

  isDate: (fieldName: string): FieldValidator<string> => {
    return (val) => {
      if (!val) return null;
      const d = Date.parse(val);
      if (isNaN(d)) {
        return `${fieldName} must be a valid date`;
      }
      return null;
    };
  },

  isFutureDate: (fieldName: string): FieldValidator<string> => {
    return (val) => {
      if (!val) return null;
      const d = Date.parse(val);
      if (isNaN(d)) {
        return `${fieldName} must be a valid date`;
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(d) < today) {
        return `${fieldName} cannot be in the past`;
      }
      return null;
    };
  }
};

// Password complexity check
export function validatePasswordStrength(password: string): string | null {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 12) {
    return 'Password must be at least 12 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  if (!/[!@#$%^&*()_+~`\|}{[\]:;?><,./\-="]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  return null;
}

// Schema descriptions
export interface RegistrationInput {
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  county: string;
}

export interface ListingInput {
  type: ListingType;
  title: string;
  description: string;
  priceKES: number;
  locationCounty: string;
}

export interface LeaseInput {
  acreageLeased: number;
  pricePerAcreKES: number;
  durationMonths: number;
  startDate: string;
}

// Validator Runner
export function validateSchema<T>(data: Partial<T>, schema: Schema<T>): ValidationResult {
  const errors: Record<string, string> = {};
  
  for (const key in schema) {
    const fieldSchema = schema[key];
    if (!fieldSchema) continue;
    
    const val = data[key];
    
    // Check required
    if (fieldSchema.required) {
      if (val === undefined || val === null || val === '') {
        errors[key] = `${String(key)} is a required field`;
        continue;
      }
    }
    
    // Run validation rules
    if (fieldSchema.validators && val !== undefined && val !== null && val !== '') {
      for (const validator of fieldSchema.validators) {
        const err = validator(val as any, data);
        if (err) {
          errors[key] = err;
          break; // Stop on first error for this field
        }
      }
    }
  }
  
  return {
    success: Object.keys(errors).length === 0,
    errors
  };
}

// Concrete schemas list
export const registrationSchema: Schema<RegistrationInput> = {
  name: {
    required: true,
    validators: [Validators.minLength(2, 'Name'), Validators.maxLength(50, 'Name')]
  },
  phone: {
    required: true,
    validators: [
      Validators.pattern(
        /^(?:\+254|0)[17]\d{8}$/,
        'Phone number must be a valid Kenyan mobile format (e.g. 0712345678)'
      )
    ]
  },
  email: {
    required: false,
    validators: [
      Validators.pattern(
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address'
      )
    ]
  },
  role: {
    required: true,
    validators: [Validators.oneOf(Object.values(UserRole), 'User Role')]
  },
  county: {
    required: true,
    validators: [Validators.minLength(1, 'County')]
  }
};

export const listingSchema: Schema<ListingInput> = {
  type: {
    required: true,
    validators: [Validators.oneOf(Object.values(ListingType), 'Asset Type')]
  },
  title: {
    required: true,
    validators: [Validators.minLength(3, 'Listing Title'), Validators.maxLength(100, 'Listing Title')]
  },
  description: {
    required: true,
    validators: [Validators.minLength(10, 'Listing Description'), Validators.maxLength(1000, 'Listing Description')]
  },
  priceKES: {
    required: true,
    validators: [Validators.min(100, 'Price in KES')]
  },
  locationCounty: {
    required: true,
    validators: [Validators.minLength(2, 'County Location')]
  }
};

export const leaseSchema: Schema<LeaseInput> = {
  acreageLeased: {
    required: true,
    validators: [Validators.min(0.1, 'Acreage leased')]
  },
  pricePerAcreKES: {
    required: true,
    validators: [Validators.min(500, 'Price per acre')]
  },
  durationMonths: {
    required: true,
    validators: [Validators.min(1, 'Duration in months')]
  },
  startDate: {
    required: true,
    validators: [Validators.isFutureDate('Start date')]
  }
};
