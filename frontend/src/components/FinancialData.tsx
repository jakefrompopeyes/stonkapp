'use client';

import React, { useState, useEffect } from 'react';
import { FinancialData, getFinancialData } from '@/lib/stockApi';

interface FinancialDataProps {
  ticker: string;
}

const FinancialDataComponent: React.FC<FinancialDataProps> = ({ ticker }) => {
  const [financials, setFinancials] = useState<FinancialData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('income');

  useEffect(() => {
    const fetchFinancials = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await getFinancialData(ticker);
        console.log('Financial data received:', JSON.stringify(data, null, 2));
        
        // Log the first item's structure to debug
        if (data && data.length > 0) {
          console.log('First financial item structure:', {
            fiscal_period: data[0].fiscal_period,
            fiscal_year: data[0].fiscal_year,
            period_of_report_date: data[0].period_of_report_date,
            income_statement: data[0].financials?.income_statement ? Object.keys(data[0].financials.income_statement) : 'none',
            balance_sheet: data[0].financials?.balance_sheet ? Object.keys(data[0].financials.balance_sheet) : 'none',
            cash_flow: data[0].financials?.cash_flow_statement ? Object.keys(data[0].financials.cash_flow_statement) : 'none'
          });
        }
        
        // Filter out any items without valid fiscal period or year
        const validData = data.filter(item => item.fiscal_period && item.fiscal_year);
        
        // Sort the data by fiscal_year and fiscal_period
        // This ensures quarters are displayed in chronological order
        const sortedData = [...validData].sort((a, b) => {
          // First compare by year
          const yearA = a.fiscal_year ? parseInt(a.fiscal_year.toString()) : 0;
          const yearB = b.fiscal_year ? parseInt(b.fiscal_year.toString()) : 0;
          
          if (yearA !== yearB) {
            return yearA - yearB;
          }
          
          // If years are the same, compare by quarter
          const quarterMap: Record<string, number> = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
          const quarterA = a.fiscal_period && typeof a.fiscal_period === 'string' ? quarterMap[a.fiscal_period] || 0 : 0;
          const quarterB = b.fiscal_period && typeof b.fiscal_period === 'string' ? quarterMap[b.fiscal_period] || 0 : 0;
          
          return quarterA - quarterB;
        });
        
        // Take only the last 4 quarters if we have more
        const lastFourQuarters = sortedData.slice(-4);
        
        console.log('Sorted financial data:', lastFourQuarters.map(item => ({
          fiscal_period: item.fiscal_period,
          fiscal_year: item.fiscal_year,
          date: item.period_of_report_date
        })));
        
        setFinancials(lastFourQuarters);
      } catch (err) {
        console.error('Error fetching financial data:', err);
        setError('Failed to load financial data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFinancials();
  }, [ticker]);

  // Format currency
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format large numbers with abbreviations (K, M, B, T)
  const formatLargeNumber = (valueObj: any) => {
    if (!valueObj || valueObj === undefined || valueObj === null) return 'N/A';
    
    // Extract the value from the object if it's an object with a value property
    let value;
    if (typeof valueObj === 'object' && valueObj !== null && 'value' in valueObj) {
      value = valueObj.value;
    } else {
      value = valueObj;
    }
    
    // Ensure value is a number
    const numValue = Number(value);
    if (isNaN(numValue)) return 'N/A';
    
    // Handle negative numbers properly
    const absValue = Math.abs(numValue);
    const sign = numValue < 0 ? '-' : '';
    
    if (absValue >= 1e12) return sign + (absValue / 1e12).toFixed(2) + 'T';
    if (absValue >= 1e9) return sign + (absValue / 1e9).toFixed(2) + 'B';
    if (absValue >= 1e6) return sign + (absValue / 1e6).toFixed(2) + 'M';
    if (absValue >= 1e3) return sign + (absValue / 1e3).toFixed(2) + 'K';
    
    return numValue.toFixed(2);
  };

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Extract quarter from date
  const getQuarterFromDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      const month = date.getMonth();
      
      // Determine quarter based on month
      if (month >= 0 && month <= 2) return 'Q1';
      if (month >= 3 && month <= 5) return 'Q2';
      if (month >= 6 && month <= 8) return 'Q3';
      if (month >= 9 && month <= 11) return 'Q4';
    } catch (error) {
      console.error('Error parsing date:', error);
      return 'N/A';
    }
    
    return 'Q?';
  };

  // Extract year from date
  const getYearFromDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.getFullYear().toString();
    } catch (error) {
      console.error('Error parsing date:', error);
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (financials.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <p className="text-gray-500">No financial data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Financial Data
      </h2>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === 'income'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('income')}
        >
          Income Statement
        </button>
        <button
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === 'balance'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('balance')}
        >
          Balance Sheet
        </button>
        <button
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === 'cash'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('cash')}
        >
          Cash Flow
        </button>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Metric
              </th>
              {financials.map((item, index) => {
                return (
                  <th key={index} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {item.fiscal_period} {item.fiscal_year}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {activeTab === 'income' && (
              <>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">
                    Revenue
                  </td>
                  {financials.map((item, index) => {
                    // Debug the specific value
                    console.log(`Revenue for ${item.fiscal_period} ${item.fiscal_year}:`, 
                      item.financials?.income_statement?.revenues);
                    return (
                      <td key={index} className="px-4 py-3 text-sm text-gray-600">
                        {formatLargeNumber(item.financials?.income_statement?.revenues)}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">
                    Cost of Revenue
                  </td>
                  {financials.map((item, index) => (
                    <td key={index} className="px-4 py-3 text-sm text-gray-600">
                      {formatLargeNumber(item.financials?.income_statement?.cost_of_revenue)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">
                    Gross Profit
                  </td>
                  {financials.map((item, index) => (
                    <td key={index} className="px-4 py-3 text-sm text-gray-600">
                      {formatLargeNumber(item.financials?.income_statement?.gross_profit)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">
                    Operating Income
                  </td>
                  {financials.map((item, index) => (
                    <td key={index} className="px-4 py-3 text-sm text-gray-600">
                      {formatLargeNumber(item.financials?.income_statement?.operating_income_loss)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">
                    Net Income
                  </td>
                  {financials.map((item, index) => (
                    <td key={index} className="px-4 py-3 text-sm text-gray-600">
                      {formatLargeNumber(item.financials?.income_statement?.net_income_loss)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-0 pb-2 text-xs italic font-normal text-gray-500 pl-8">
                    Net Profit Margin
                  </td>
                  {financials.map((item, index) => {
                    const revenue = item.financials?.income_statement?.revenues;
                    const netIncome = item.financials?.income_statement?.net_income_loss;
                    let netMargin = 'N/A';
                    
                    if (revenue && netIncome) {
                      // Extract values if they're objects with a value property
                      const revenueValue = typeof revenue === 'object' && revenue !== null && 'value' in revenue
                        ? (revenue as any).value : revenue;
                      const netIncomeValue = typeof netIncome === 'object' && netIncome !== null && 'value' in netIncome
                        ? (netIncome as any).value : netIncome;
                      
                      if (revenueValue && revenueValue !== 0) {
                        const marginValue = (netIncomeValue / revenueValue) * 100;
                        netMargin = `${marginValue.toFixed(2)}%`;
                      }
                    }
                    
                    return (
                      <td key={index} className="px-4 py-0 pb-2 text-xs text-gray-500">
                        {netMargin}
                      </td>
                    );
                  })}
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">
                    EPS (Basic)
                  </td>
                  {financials.map((item, index) => {
                    const epsValue = item.financials?.income_statement?.basic_earnings_per_share;
                    let displayValue = 'N/A';
                    
                    if (epsValue !== undefined) {
                      // Extract the value if it's an object with a value property
                      const value = typeof epsValue === 'object' && epsValue !== null && 'value' in epsValue
                        ? (epsValue as any).value
                        : epsValue;
                      
                      if (value !== undefined && value !== null) {
                        displayValue = Number(value).toFixed(2);
                      }
                    }
                    
                    return (
                      <td key={index} className="px-4 py-3 text-sm text-gray-600">
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">
                    EPS (Diluted)
                  </td>
                  {financials.map((item, index) => {
                    const epsValue = item.financials?.income_statement?.diluted_earnings_per_share;
                    let displayValue = 'N/A';
                    
                    if (epsValue !== undefined) {
                      // Extract the value if it's an object with a value property
                      const value = typeof epsValue === 'object' && epsValue !== null && 'value' in epsValue
                        ? (epsValue as any).value
                        : epsValue;
                      
                      if (value !== undefined && value !== null) {
                        displayValue = Number(value).toFixed(2);
                      }
                    }
                    
                    return (
                      <td key={index} className="px-4 py-3 text-sm text-gray-600">
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              </>
            )}
            
            {activeTab === 'balance' && (
              <>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">
                    Total Assets
                  </td>
                  {financials.map((item, index) => (
                    <td key={index} className="px-4 py-3 text-sm text-gray-600">
                      {formatLargeNumber(item.financials?.balance_sheet?.assets)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">
                    Total Liabilities
                  </td>
                  {financials.map((item, index) => (
                    <td key={index} className="px-4 py-3 text-sm text-gray-600">
                      {formatLargeNumber(item.financials?.balance_sheet?.liabilities)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">
                    Total Equity
                  </td>
                  {financials.map((item, index) => (
                    <td key={index} className="px-4 py-3 text-sm text-gray-600">
                      {formatLargeNumber(item.financials?.balance_sheet?.equity)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">
                    Current Assets
                  </td>
                  {financials.map((item, index) => (
                    <td key={index} className="px-4 py-3 text-sm text-gray-600">
                      {formatLargeNumber(item.financials?.balance_sheet?.current_assets)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">
                    Current Liabilities
                  </td>
                  {financials.map((item, index) => (
                    <td key={index} className="px-4 py-3 text-sm text-gray-600">
                      {formatLargeNumber(item.financials?.balance_sheet?.current_liabilities)}
                    </td>
                  ))}
                </tr>
              </>
            )}
            
            {activeTab === 'cash' && (
              <>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">
                    Operating Cash Flow
                  </td>
                  {financials.map((item, index) => (
                    <td key={index} className="px-4 py-3 text-sm text-gray-600">
                      {formatLargeNumber(item.financials?.cash_flow_statement?.net_cash_flow_from_operating_activities)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">
                    Investing Cash Flow
                  </td>
                  {financials.map((item, index) => (
                    <td key={index} className="px-4 py-3 text-sm text-gray-600">
                      {formatLargeNumber(item.financials?.cash_flow_statement?.net_cash_flow_from_investing_activities)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">
                    Financing Cash Flow
                  </td>
                  {financials.map((item, index) => (
                    <td key={index} className="px-4 py-3 text-sm text-gray-600">
                      {formatLargeNumber(item.financials?.cash_flow_statement?.net_cash_flow_from_financing_activities)}
                    </td>
                  ))}
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        Source: Polygon.io | Last {financials.length} quarters
      </div>
    </div>
  );
};

export default FinancialDataComponent; 