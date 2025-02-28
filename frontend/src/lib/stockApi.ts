// This file now serves as a bridge to the new implementation
import * as stockApiNew from './stockApiNew';

// Re-export everything from the new implementation
export const {
  searchStocks,
  getStockDetails,
  getStockPrices,
  getStockNews,
  getFinancialData,
  getInsiderTransactions,
  getInsiderSentiment,
  getServerStatus,
  getValuationMetrics
} = stockApiNew;

// Re-export all types
export type {
  StockSearchResult,
  StockDetails,
  PriceData,
  NewsItem,
  FinancialData,
  InsiderTransaction,
  InsiderSentiment,
  ValuationMetrics
} from './stockApiNew'; 