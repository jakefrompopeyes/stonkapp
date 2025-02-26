// This file contains type declarations for the project

// Declare modules that don't have type definitions
declare module 'next/font/google' {
  export interface FontOptions {
    subsets?: string[];
    weight?: string | string[];
    style?: string | string[];
    display?: string;
  }

  export function Inter(options: FontOptions): {
    className: string;
    style: any;
  };
} 