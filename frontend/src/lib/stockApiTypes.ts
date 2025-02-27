// Simplified types for testing
export interface SimpleStockDetails {
  ticker: string;
  name: string;
  description: string;
  market: string;
  type: string;
  active: boolean;
}

// Function to convert any object to SimpleStockDetails
export function toSimpleStockDetails(data: any): SimpleStockDetails {
  return {
    ticker: data.ticker || '',
    name: data.name || '',
    description: data.description || '',
    market: data.market || 'stocks',
    type: data.type || 'CS',
    active: data.active || true
  };
} 