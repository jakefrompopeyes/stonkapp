'use client';

import { useState, useEffect } from 'react';
import { getInsiderTransactions, InsiderTransaction } from '@/lib/stockApi';

interface InsiderTradingProps {
  ticker: string;
}

// Interface for combined transactions
interface CombinedTransaction {
  name: string;
  isDerivative?: boolean;
  transactionDate: string;
  transactionCode: string;
  totalShares: number;
  averagePrice: number;
  totalValue: number;
  // For tracking date ranges in combined transactions
  startDate?: string;
  endDate?: string;
}

export default function InsiderTrading({ ticker }: InsiderTradingProps) {
  const [transactions, setTransactions] = useState<InsiderTransaction[]>([]);
  const [buyTransactions, setBuyTransactions] = useState<CombinedTransaction[]>([]);
  const [sellTransactions, setSellTransactions] = useState<CombinedTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'buys' | 'sells'>('buys');

  useEffect(() => {
    const fetchInsiderData = async () => {
      if (!ticker) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch insider transactions
        const transactionsData = await getInsiderTransactions(ticker);
        console.log('Insider transactions data:', transactionsData);
        
        // Filter out transactions with missing data
        const filteredTransactions = transactionsData.filter(
          transaction => {
            // Ensure we have the necessary data
            const hasRequiredData = transaction.transactionDate && 
                                   transaction.name &&
                                   transaction.transactionCode;
            
            return hasRequiredData;
          }
        );
        
        // Filter for transactions within the last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const recentTransactions = filteredTransactions.filter(transaction => {
          const transactionDate = new Date(transaction.transactionDate);
          return transactionDate >= sixMonthsAgo;
        });
        
        setTransactions(recentTransactions);
        
        // Combine transactions from the same insider within 3 days
        const combined = combineTransactions(recentTransactions);
        
        // Split into buys and sells
        const buys = combined.filter(t => 
          t.transactionCode === 'P' || t.transactionCode === 'B' // Purchase codes
        );
        
        const sells = combined.filter(t => 
          t.transactionCode === 'S' // Sale code
        );
        
        setBuyTransactions(buys);
        setSellTransactions(sells);
      } catch (err) {
        console.error('Error fetching insider data:', err);
        setError('Failed to load insider trading data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInsiderData();
  }, [ticker]);

  // Function to check if two dates are within 3 days of each other
  const isWithinThreeDays = (date1: string, date2: string): boolean => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  };

  // Function to combine transactions from the same insider within 3 days
  const combineTransactions = (transactions: InsiderTransaction[]): CombinedTransaction[] => {
    // First, sort transactions by name, code, and date
    const sortedTransactions = [...transactions].sort((a, b) => {
      // Sort by name
      if (a.name !== b.name) return a.name.localeCompare(b.name);
      // Then by transaction code (safely)
      if (a.transactionCode !== b.transactionCode) {
        // Handle undefined values safely
        const codeA = a.transactionCode || '';
        const codeB = b.transactionCode || '';
        return codeA.localeCompare(codeB);
      }
      // Then by date (oldest first for grouping)
      return new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime();
    });
    
    // Group transactions by insider name and transaction code
    const insiderGroups: Record<string, InsiderTransaction[]> = {};
    
    sortedTransactions.forEach(transaction => {
      // Skip transactions with no price or change data
      if (transaction.transactionPrice === undefined || transaction.change === undefined) {
        return;
      }
      
      const key = `${transaction.name}-${transaction.transactionCode}`;
      if (!insiderGroups[key]) {
        insiderGroups[key] = [];
      }
      insiderGroups[key].push(transaction);
    });
    
    // Process each group to combine transactions within 3 days
    const combinedTransactions: CombinedTransaction[] = [];
    
    Object.values(insiderGroups).forEach(group => {
      if (group.length === 0) return;
      
      // If only one transaction in the group, just convert it
      if (group.length === 1) {
        const t = group[0];
        combinedTransactions.push({
          name: t.name,
          isDerivative: t.isDerivative || false,
          transactionDate: t.transactionDate,
          transactionCode: t.transactionCode || 'U', // 'U' for unknown if undefined
          totalShares: Math.abs(t.sharesTraded || 0), // Use sharesTraded instead of change
          averagePrice: t.transactionPrice || 0,
          totalValue: Math.abs((t.sharesTraded || 0) * (t.transactionPrice || 0)) // Use sharesTraded for value calculation
        });
        return;
      }
      
      // For multiple transactions, group them if they're within 3 days of each other
      let currentGroup: InsiderTransaction[] = [group[0]];
      let currentEndDate = group[0].transactionDate;
      
      for (let i = 1; i < group.length; i++) {
        const transaction = group[i];
        
        // If this transaction is within 3 days of the current group's end date, add it to the group
        if (isWithinThreeDays(currentEndDate, transaction.transactionDate)) {
          currentGroup.push(transaction);
          // Update the end date if this transaction is later
          if (new Date(transaction.transactionDate) > new Date(currentEndDate)) {
            currentEndDate = transaction.transactionDate;
          }
        } else {
          // This transaction is more than 3 days after the current group
          // Process the current group
          processCombinedGroup(currentGroup, combinedTransactions);
          
          // Start a new group with this transaction
          currentGroup = [transaction];
          currentEndDate = transaction.transactionDate;
        }
      }
      
      // Process the last group
      processCombinedGroup(currentGroup, combinedTransactions);
    });
    
    // Sort by date (newest first) and then by value (largest first)
    return combinedTransactions.sort((a, b) => {
      // Sort by date (newest first)
      const dateA = a.endDate || a.transactionDate;
      const dateB = b.endDate || b.transactionDate;
      const dateComparison = new Date(dateB).getTime() - new Date(dateA).getTime();
      if (dateComparison !== 0) return dateComparison;
      
      // If same date, sort by value (largest first)
      return b.totalValue - a.totalValue;
    });
  };
  
  // Helper function to process a group of transactions and add the combined result
  const processCombinedGroup = (group: InsiderTransaction[], results: CombinedTransaction[]) => {
    if (group.length === 0) return;
    
    // Calculate total shares and weighted average price
    let totalShares = 0;
    let totalValue = 0;
    let startDate = group[0].transactionDate;
    let endDate = group[0].transactionDate;
    
    group.forEach(t => {
      // Use sharesTraded for the number of shares - this is the actual transaction size
      const shares = Math.abs(t.sharesTraded || 0);
      
      // For price, prioritize transactionPrice, then price, defaulting to 0 if neither is available
      const price = t.transactionPrice || t.price || 0;
      
      // Skip transactions with zero price for average calculation, but still count the shares
      totalShares += shares;
      
      // Only add to total value if price is non-zero
      if (price > 0) {
        totalValue += shares * price;
      }
      
      // Track the date range
      if (new Date(t.transactionDate) < new Date(startDate)) {
        startDate = t.transactionDate;
      }
      if (new Date(t.transactionDate) > new Date(endDate)) {
        endDate = t.transactionDate;
      }
    });
    
    // Calculate weighted average price, avoiding division by zero
    // If all transactions have zero price, the average price will be 0
    const averagePrice = totalShares > 0 ? totalValue / totalShares : 0;
    
    // Create combined transaction
    results.push({
      name: group[0].name,
      isDerivative: group[0].isDerivative || false,
      transactionDate: endDate, // Use the most recent date as the main date
      transactionCode: group[0].transactionCode || 'U', // 'U' for unknown if undefined
      totalShares: totalShares,
      averagePrice: averagePrice,
      totalValue: totalValue,
      startDate: startDate,
      endDate: endDate
    });
  };

  // Format date from ISO string to readable format
  const formatDate = (dateString: string, startDate?: string) => {
    if (!dateString) return 'N/A';
    
    // If we have a start date and it's different from the end date, show a range
    if (startDate && startDate !== dateString) {
      const start = new Date(startDate);
      const end = new Date(dateString);
      
      // If in the same month, show "Jan 1-5, 2024"
      if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
        return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()}-${end.getDate()}, ${end.getFullYear()}`;
      }
      
      // Otherwise show full dates for both
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    
    // Single date
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Format transaction code to readable description
  const formatTransactionCode = (code: string) => {
    const codes: Record<string, string> = {
      'P': 'Purchase',
      'S': 'Sale',
      'B': 'Buy',
      'A': 'Grant/Award',
      'D': 'Sale to/by Issuer',
      'F': 'Payment of Exercise',
      'I': 'Discretionary Transaction',
      'M': 'Exercise/Conversion',
      'C': 'Conversion',
      'E': 'Expiration',
      'G': 'Gift',
      'H': 'Shares Held',
      'L': 'Small Acquisition',
      'O': 'Exercise of Out-of-Money Derivative',
      'X': 'Exercise of In-Money Derivative',
      'Z': 'Voting Trust',
      'W': 'Acquisition or Disposition by Will'
    };
    
    return codes[code] || code;
  };

  // Determine role from name (common executive titles)
  const determineRole = (name: string, isDerivative?: boolean) => {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('ceo') || nameLower.includes('chief executive')) {
      return 'CEO';
    } else if (nameLower.includes('cfo') || nameLower.includes('chief financial') || nameLower.includes('treasurer')) {
      return 'CFO';
    } else if (nameLower.includes('coo') || nameLower.includes('chief operating')) {
      return 'COO';
    } else if (nameLower.includes('cto') || nameLower.includes('chief technology')) {
      return 'CTO';
    } else if (nameLower.includes('president')) {
      return 'President';
    } else if (nameLower.includes('director')) {
      return 'Director';
    } else if (nameLower.includes('chairman')) {
      return 'Chairman';
    } else if (nameLower.includes('secretary')) {
      return 'Secretary';
    } else if (nameLower.includes('officer')) {
      return 'Officer';
    } else if (isDerivative) {
      return 'Insider (Derivative)';
    } else {
      return 'Insider';
    }
  };

  // Format large numbers with commas
  const formatNumber = (num: number) => {
    if (num === undefined || num === null) return 'N/A';
    return num.toLocaleString();
  };

  // Format currency
  const formatCurrency = (num: number) => {
    if (num === undefined || num === null) return 'N/A';
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Get color class based on value (positive/negative)
  const getColorClass = (value: number, transactionCode: string) => {
    // For purchases (P) and grants (A), use green
    if (transactionCode === 'P' || transactionCode === 'A') {
      return 'text-green-600';
    }
    // For sales (S) and other dispositions, use red
    if (transactionCode === 'S' || transactionCode === 'D') {
      return 'text-red-600';
    }
    // For other transactions, use default color
    return 'text-gray-600';
  };

  // Calculate total value for a transaction set
  const calculateTotalValue = (transactions: CombinedTransaction[]): number => {
    return transactions.reduce((total, t) => total + t.totalValue, 0);
  };

  // Calculate total shares for a transaction set
  const calculateTotalShares = (transactions: CombinedTransaction[]): number => {
    return transactions.reduce((total, t) => total + t.totalShares, 0);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Insider Trading
        </h2>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Insider Trading
        </h2>
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (buyTransactions.length === 0 && sellTransactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Insider Trading
        </h2>
        <p className="text-gray-600">
          No insider trading data available for this stock in the last 6 months.
        </p>
      </div>
    );
  }

  // Calculate totals for summary
  const totalBuyValue = calculateTotalValue(buyTransactions);
  const totalSellValue = calculateTotalValue(sellTransactions);
  const totalBuyShares = calculateTotalShares(buyTransactions);
  const totalSellShares = calculateTotalShares(sellTransactions);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Insider Trading (Last 6 Months)
      </h2>
      
      {/* Summary section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-green-700 mb-2">
            Insider Purchases
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(totalBuyValue)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Shares</p>
              <p className="text-lg font-semibold text-green-600">
                {formatNumber(totalBuyShares)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Transactions</p>
              <p className="text-lg font-semibold text-green-600">
                {buyTransactions.length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-red-700 mb-2">
            Insider Sells
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-lg font-semibold text-red-600">
                {formatCurrency(totalSellValue)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Shares</p>
              <p className="text-lg font-semibold text-red-600">
                {formatNumber(totalSellShares)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Transactions</p>
              <p className="text-lg font-semibold text-red-600">
                {sellTransactions.length}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('buys')}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === 'buys'
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Buys ({buyTransactions.length})
          </button>
          <button
            onClick={() => setActiveTab('sells')}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === 'sells'
                ? 'border-b-2 border-red-500 text-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sells ({sellTransactions.length})
          </button>
        </nav>
      </div>
      
      {/* Transaction tables */}
      <div className="overflow-x-auto">
        {activeTab === 'buys' && (
          <>
            {buyTransactions.length === 0 ? (
              <p className="text-gray-600 py-4">
                No insider purchases in the last 6 months.
              </p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Insider
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shares
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg. Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {buyTransactions.map((transaction, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.name || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {determineRole(transaction.name, transaction.isDerivative)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.transactionDate, transaction.startDate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatTransactionCode(transaction.transactionCode)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600">
                        {formatNumber(transaction.totalShares)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                        {formatCurrency(transaction.averagePrice)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600">
                        {formatCurrency(transaction.totalValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
        
        {activeTab === 'sells' && (
          <>
            {sellTransactions.length === 0 ? (
              <p className="text-gray-600 py-4">
                No insider sales in the last 6 months.
              </p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Insider
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shares
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg. Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sellTransactions.map((transaction, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.name || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {determineRole(transaction.name, transaction.isDerivative)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.transactionDate, transaction.startDate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatTransactionCode(transaction.transactionCode)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600">
                        {formatNumber(transaction.totalShares)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                        {formatCurrency(transaction.averagePrice)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600">
                        {formatCurrency(transaction.totalValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>
          Data shows combined insider transactions within the last 6 months, excluding grants, awards, and issuer sales. Transactions by the same insider within 3 days are combined with weighted average prices.
        </p>
      </div>
    </div>
  );
} 