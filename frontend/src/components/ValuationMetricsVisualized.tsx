'use client';

import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ArcElement,
  Plugin,
  TooltipItem,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { getFinancialData, FinancialData } from '@/lib/stockApi';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ValuationMetricsVisualizedProps {
  ticker: string;
}

// Define a more specific interface for financial metrics
interface FinancialMetrics {
  // Income Statement
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  operatingExpenses: number;
  netIncome: number;
  
  // Balance Sheet
  assets: number;
  currentAssets: number;
  nonCurrentAssets: number;
  liabilities: number;
  currentLiabilities: number;
  nonCurrentLiabilities: number;
  equity: number;
  
  // Cash Flow
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  freeCashFlow: number;
  
  isRealData: boolean; // Flag to indicate if this is real data or sample data
}

type TabType = 'income' | 'balance' | 'cashflow';

const ValuationMetricsVisualized: React.FC<ValuationMetricsVisualizedProps> = ({ ticker }) => {
  const [activeTab, setActiveTab] = useState<TabType>('income');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [showIncomeExplanation, setShowIncomeExplanation] = useState<boolean>(false);
  const [showBalanceExplanation, setShowBalanceExplanation] = useState<boolean>(false);
  const [showCashFlowExplanation, setShowCashFlowExplanation] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    // Income Statement
    revenue: 0,
    costOfRevenue: 0,
    grossProfit: 0,
    operatingExpenses: 0,
    netIncome: 0,
    
    // Balance Sheet
    assets: 0,
    currentAssets: 0,
    nonCurrentAssets: 0,
    liabilities: 0,
    currentLiabilities: 0,
    nonCurrentLiabilities: 0,
    equity: 0,
    
    // Cash Flow
    operatingCashFlow: 0,
    investingCashFlow: 0,
    financingCashFlow: 0,
    netCashFlow: 0,
    freeCashFlow: 0,
    
    isRealData: false
  });
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getFinancialData(ticker);
        
        console.log('Financial data for', ticker, ':', data);
        
        if (data.length === 0) {
          setDebugInfo('No financial data returned from API');
          setMetrics(getSampleData());
        } else {
          // Process the financial data
          const extractedMetrics = extractFinancialMetrics(data);
          setMetrics(extractedMetrics);
          
          // Set debug info
          setDebugInfo(`
            Data source: ${extractedMetrics.isRealData ? 'API' : 'Sample'}, 
            Revenue: ${extractedMetrics.revenue.toLocaleString()}, 
            Assets: ${extractedMetrics.assets.toLocaleString()}
          `);
        }
        
        setFinancialData(data);
      } catch (err) {
        console.error('Error fetching financial data:', err);
        setError('Failed to load financial data');
        setDebugInfo(`Error: ${err instanceof Error ? err.message : String(err)}`);
        setMetrics(getSampleData());
      } finally {
        setLoading(false);
      }
    };

    if (ticker) {
      fetchFinancialData();
    }
  }, [ticker]);

  // Get sample data for when API data is not available
  const getSampleData = (): FinancialMetrics => {
    console.log('Using sample financial data');
    return {
      // Income Statement
      revenue: 1000000,
      costOfRevenue: 600000,
      grossProfit: 400000,
      operatingExpenses: 300000,
      netIncome: 100000,
      
      // Balance Sheet
      assets: 2000000,
      currentAssets: 800000,
      nonCurrentAssets: 1200000,
      liabilities: 1200000,
      currentLiabilities: 500000,
      nonCurrentLiabilities: 700000,
      equity: 800000,
      
      // Cash Flow
      operatingCashFlow: 150000,
      investingCashFlow: -80000,
      financingCashFlow: -40000,
      netCashFlow: 30000,
      freeCashFlow: 70000,
      
      isRealData: false
    };
  };

  // Extract financial metrics from API data
  const extractFinancialMetrics = (data: FinancialData[]): FinancialMetrics => {
    if (data.length === 0 || !data[0]?.financials) {
      console.log('No valid financial data found, using sample data');
      return getSampleData();
    }
    
    const incomeStatement = data[0].financials.income_statement || {};
    const balanceSheet = data[0].financials.balance_sheet || {};
    const cashFlow = data[0].financials.cash_flow_statement || {};
    
    console.log('Income statement:', incomeStatement);
    console.log('Balance sheet:', balanceSheet);
    console.log('Cash flow statement:', cashFlow);
    
    // In Polygon.io API, financial metrics are objects with a 'value' property
    // Extract the value safely from the nested structure
    const extractValue = (obj: any, key: string): number => {
      if (!obj || !obj[key] || typeof obj[key].value !== 'number') {
        return 0;
      }
      return obj[key].value;
    };
    
    // Extract income statement values
    const revenue = extractValue(incomeStatement, 'revenues');
    const costOfRevenue = extractValue(incomeStatement, 'cost_of_revenue');
    const grossProfit = extractValue(incomeStatement, 'gross_profit');
    const operatingExpenses = extractValue(incomeStatement, 'operating_expenses');
    const netIncome = extractValue(incomeStatement, 'net_income_loss');
    
    // Extract balance sheet values
    const assets = extractValue(balanceSheet, 'assets');
    const currentAssets = extractValue(balanceSheet, 'current_assets');
    const nonCurrentAssets = extractValue(balanceSheet, 'noncurrent_assets');
    const liabilities = extractValue(balanceSheet, 'liabilities');
    const currentLiabilities = extractValue(balanceSheet, 'current_liabilities');
    const nonCurrentLiabilities = extractValue(balanceSheet, 'noncurrent_liabilities');
    const equity = extractValue(balanceSheet, 'equity');
    
    // Extract cash flow values
    const operatingCashFlow = extractValue(cashFlow, 'net_cash_flow_from_operating_activities');
    const investingCashFlow = extractValue(cashFlow, 'net_cash_flow_from_investing_activities');
    const financingCashFlow = extractValue(cashFlow, 'net_cash_flow_from_financing_activities');
    const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;
    const freeCashFlow = operatingCashFlow - extractValue(cashFlow, 'payments_for_property_plant_equipment');
    
    // Log the extracted values
    console.log('Extracted financial metrics:', {
      revenue, costOfRevenue, grossProfit, operatingExpenses, netIncome,
      assets, currentAssets, nonCurrentAssets, liabilities, currentLiabilities, nonCurrentLiabilities, equity,
      operatingCashFlow, investingCashFlow, financingCashFlow, netCashFlow, freeCashFlow
    });
    
    // Check if we have valid data
    const hasValidData = revenue > 0 || assets > 0 || operatingCashFlow !== 0;
    
    if (!hasValidData) {
      console.log('No valid financial data found, using sample data');
      return getSampleData();
    }
    
    return {
      revenue, costOfRevenue, grossProfit, operatingExpenses, netIncome,
      assets, currentAssets, nonCurrentAssets, liabilities, currentLiabilities, nonCurrentLiabilities, equity,
      operatingCashFlow, investingCashFlow, financingCashFlow, netCashFlow, freeCashFlow,
      isRealData: true
    };
  };

  // Format large numbers with abbreviations (K, M, B, T)
  const formatLargeNumber = (value: number | undefined | null) => {
    if (value === undefined || value === null) return 'N/A';
    
    // Ensure value is a number
    const numValue = Number(value);
    if (isNaN(numValue)) return 'N/A';
    
    // Handle negative values by formatting the absolute value and adding the minus sign
    const isNegative = numValue < 0;
    const absValue = Math.abs(numValue);
    
    let formattedValue: string;
    if (absValue >= 1e12) formattedValue = (absValue / 1e12).toFixed(2) + 'T';
    else if (absValue >= 1e9) formattedValue = (absValue / 1e9).toFixed(2) + 'B';
    else if (absValue >= 1e6) formattedValue = (absValue / 1e6).toFixed(2) + 'M';
    else if (absValue >= 1e3) formattedValue = (absValue / 1e3).toFixed(2) + 'K';
    else formattedValue = absValue.toFixed(2);
    
    return isNegative ? '-' + formattedValue : formattedValue;
  };

  // Create a waterfall chart for income statement
  const prepareIncomeStatementChartData = () => {
    // Define our key values
    const revenue = metrics.revenue;
    const costOfRevenue = metrics.costOfRevenue;
    const grossProfit = metrics.grossProfit;
    const operatingExpenses = metrics.operatingExpenses;
    const netIncome = metrics.netIncome;
    
    // Calculate running totals for the waterfall chart
    let runningTotal = 0;
    
    // For Revenue, start at 0 and end at revenue value
    const revenueBar = [0, revenue];
    runningTotal = revenue;
    
    // For Cost of Revenue, start at running total and end at running total - cost
    const costOfRevenueBar = [runningTotal, runningTotal - costOfRevenue];
    runningTotal -= costOfRevenue;
    
    // For Gross Profit, this is just a marker at the current running total
    const grossProfitBar = runningTotal;
    
    // For Operating Expenses, start at running total and end at running total - expenses
    const operatingExpensesBar = [runningTotal, runningTotal - operatingExpenses];
    runningTotal -= operatingExpenses;
    
    // For Net Income, this is just a marker at the current running total
    const netIncomeBar = runningTotal;
    
    // Define colors for positive and negative values
    const positiveColor = '#10B981'; // Green
    const negativeColor = '#EF4444'; // Red
    const neutralColor = '#6B7280'; // Gray for markers
    const blueColor = '#3B82F6'; // Blue for Revenue
    
    return {
      labels: ['Revenue', 'Cost of Revenue', 'Gross Profit', 'Operating Expenses', 'Net Income'],
      datasets: [
        {
          label: 'Income Statement',
          data: [
            revenueBar,
            costOfRevenueBar,
            grossProfitBar,
            operatingExpensesBar,
            netIncomeBar
          ],
          backgroundColor: [
            blueColor, // Revenue - Blue
            negativeColor, // Cost of Revenue - Red
            positiveColor, // Gross Profit - Green
            negativeColor, // Operating Expenses - Red
            netIncome >= 0 ? positiveColor : negativeColor, // Net Income - Green if positive, Red if negative
          ],
          borderColor: [
            '#2563EB', // Revenue - Blue border
            '#DC2626', // Cost of Revenue - Red border
            '#059669', // Gross Profit - Green border
            '#DC2626', // Operating Expenses - Red border
            netIncome >= 0 ? '#059669' : '#DC2626', // Net Income - Green border if positive, Red border if negative
          ],
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false, // Ensure all sides have border radius applied
        }
      ]
    };
  };

  // Create data for balance sheet visualization
  const prepareBalanceSheetChartData = () => {
    return {
      // Assets and Liabilities + Equity should be equal
      labels: ['Current Assets', 'Non-Current Assets', 'Current Liabilities', 'Non-Current Liabilities', 'Equity'],
      datasets: [
        {
          label: 'Amount',
          data: [
            metrics.currentAssets,
            metrics.nonCurrentAssets,
            metrics.currentLiabilities,
            metrics.nonCurrentLiabilities,
            metrics.equity
          ],
          backgroundColor: [
            '#60A5FA', // Current Assets - Light Blue
            '#3B82F6', // Non-Current Assets - Blue
            '#F87171', // Current Liabilities - Red
            '#EF4444', // Non-Current Liabilities - Darker Red
            '#10B981', // Equity - Green
          ],
          borderColor: [
            '#2563EB',
            '#1D4ED8',
            '#DC2626',
            '#B91C1C',
            '#059669',
          ],
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    };
  };

  // Create data for assets vs liabilities doughnut chart
  const prepareAssetsLiabilitiesChartData = () => {
    return {
      labels: ['Assets', 'Liabilities', 'Equity'],
      datasets: [
        {
          data: [metrics.assets, metrics.liabilities, metrics.equity],
          backgroundColor: [
            '#3B82F6', // Assets - Blue
            '#EF4444', // Liabilities - Red
            '#10B981', // Equity - Green
          ],
          borderColor: [
            '#2563EB',
            '#B91C1C',
            '#059669',
          ],
          borderWidth: 1,
          hoverOffset: 10,
          borderRadius: 4, // Add slight rounding to the segments
        },
      ],
    };
  };

  // Create data for cash flow visualization
  const prepareCashFlowChartData = () => {
    return {
      labels: ['Operating Cash Flow', 'Investing Cash Flow', 'Financing Cash Flow', 'Net Cash Flow', 'Free Cash Flow'],
      datasets: [
        {
          label: 'Amount',
          data: [
            metrics.operatingCashFlow,
            metrics.investingCashFlow,
            metrics.financingCashFlow,
            metrics.netCashFlow,
            metrics.freeCashFlow
          ],
          backgroundColor: [
            '#3B82F6', // Operating Cash Flow - Blue
            metrics.investingCashFlow < 0 ? '#EF4444' : '#3B82F6', // Investing Cash Flow - Red if negative, Blue if positive
            metrics.financingCashFlow < 0 ? '#EF4444' : '#3B82F6', // Financing Cash Flow - Red if negative, Blue if positive
            metrics.netCashFlow < 0 ? '#EF4444' : '#3B82F6', // Net Cash Flow - Red if negative, Blue if positive
            metrics.freeCashFlow < 0 ? '#EF4444' : '#3B82F6', // Free Cash Flow - Red if negative, Blue if positive
          ],
          borderColor: [
            '#2563EB',
            metrics.investingCashFlow < 0 ? '#DC2626' : '#2563EB',
            metrics.financingCashFlow < 0 ? '#DC2626' : '#2563EB',
            metrics.netCashFlow < 0 ? '#DC2626' : '#2563EB',
            metrics.freeCashFlow < 0 ? '#DC2626' : '#2563EB',
          ],
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    };
  };

  const incomeChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'x',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw as number | [number, number];
            const label = context.dataset.label || '';
            
            // For array values (floating bars), calculate the difference
            if (Array.isArray(value)) {
              const difference = value[1] - value[0];
              // For negative values, show as subtractions
              if (difference < 0) {
                return `${context.label}: -${formatLargeNumber(Math.abs(difference))}`;
              }
              return `${context.label}: ${formatLargeNumber(difference)}`;
            }
            
            // For single values (markers)
            return `${context.label}: ${formatLargeNumber(value)}`;
          },
          // Add a footer to explain the waterfall relationship
          footer: function(tooltipItems) {
            const index = tooltipItems[0].dataIndex;
            
            if (index === 2) { // Gross Profit
              return 'Revenue - Cost of Revenue';
            } else if (index === 4) { // Net Income
              return 'Gross Profit - Operating Expenses';
            }
            return '';
          }
        }
      },
      title: {
        display: true,
        text: 'Income Statement',
        font: {
          size: 16,
        }
      },
    },
    scales: {
      y: {
        grace: '5%',
        ticks: {
          callback: function(value) {
            return formatLargeNumber(value as number);
          }
        },
        title: {
          display: true,
          text: 'Amount ($)'
        },
        grid: {
          display: false // Remove grid lines on y-axis
        }
      },
      x: {
        grid: {
          display: false // Remove grid lines on x-axis
        }
      }
    },
    animation: {
      duration: 1000
    },
    backgroundColor: 'white'
  };

  const balanceSheetChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw as number;
            return `${context.label}: ${formatLargeNumber(Math.abs(value))}`;
          }
        }
      },
      title: {
        display: true,
        text: 'Balance Sheet Components',
        font: {
          size: 16,
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatLargeNumber(value as number);
          }
        },
        title: {
          display: true,
          text: 'Amount ($)'
        },
        grid: {
          display: false // Remove grid lines on y-axis
        }
      },
      x: {
        grid: {
          display: false // Remove grid lines on x-axis
        }
      }
    },
    animation: {
      duration: 1000
    },
    backgroundColor: 'white'
  };

  const doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw as number;
            const total = context.dataset.data.reduce((a: any, b: any) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${context.label}: ${formatLargeNumber(value)} (${percentage}%)`;
          }
        }
      },
      title: {
        display: true,
        text: 'Assets, Liabilities & Equity',
        font: {
          size: 16,
        }
      }
    },
    animation: {
      duration: 1000
    },
    cutout: '55%', // Reduce the cutout size back to show more of the chart
    backgroundColor: 'white'
  };

  const cashFlowChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw as number;
            return `${context.label}: ${formatLargeNumber(value)}`;
          }
        }
      },
      title: {
        display: true,
        text: 'Cash Flow Statement',
        font: {
          size: 16,
        }
      },
    },
    scales: {
      y: {
        beginAtZero: false, // Allow negative values
        ticks: {
          callback: function(value) {
            return formatLargeNumber(value as number);
          }
        },
        title: {
          display: true,
          text: 'Amount ($)'
        },
        grid: {
          display: false // Remove grid lines on y-axis
        }
      },
      x: {
        grid: {
          display: false // Remove grid lines on x-axis
        }
      }
    },
    animation: {
      duration: 1000
    },
    backgroundColor: 'white'
  };

  // Create a simple table to display the income statement metrics
  const renderIncomeStatementTable = () => {
    return (
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 text-left rounded-tl-lg">Metric</th>
              <th className="py-2 px-4 text-right rounded-tr-lg"></th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-blue-50">
              <td className="py-2 px-4 border-t font-medium">Revenue</td>
              <td className="py-2 px-4 border-t text-right font-medium text-blue-700">${formatLargeNumber(metrics.revenue)}</td>
            </tr>
            <tr className="bg-red-50">
              <td className="py-2 px-4 border-t">Cost of Revenue</td>
              <td className="py-2 px-4 border-t text-right text-red-600">-${formatLargeNumber(metrics.costOfRevenue)}</td>
            </tr>
            <tr className="bg-green-50">
              <td className="py-2 px-4 border-t font-medium">Gross Profit</td>
              <td className="py-2 px-4 border-t text-right font-medium text-green-700">${formatLargeNumber(metrics.grossProfit)}</td>
            </tr>
            <tr className="bg-red-50">
              <td className="py-2 px-4 border-t">Operating Expenses</td>
              <td className="py-2 px-4 border-t text-right text-red-600">-${formatLargeNumber(metrics.operatingExpenses)}</td>
            </tr>
            <tr className={`${metrics.netIncome >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <td className="py-2 px-4 border-t font-medium rounded-bl-lg">Net Income</td>
              <td className={`py-2 px-4 border-t text-right font-medium rounded-br-lg ${metrics.netIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {metrics.netIncome >= 0 ? '$' : '-$'}{formatLargeNumber(Math.abs(metrics.netIncome))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Create a table to display the balance sheet metrics
  const renderBalanceSheetTable = () => {
    return (
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 text-left rounded-tl-lg">Metric</th>
              <th className="py-2 px-4 text-right rounded-tr-lg"></th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-blue-50">
              <td className="py-2 px-4 border-t font-medium">Total Assets</td>
              <td className="py-2 px-4 border-t text-right font-medium text-blue-700">${formatLargeNumber(metrics.assets)}</td>
            </tr>
            <tr>
              <td className="py-2 px-4 border-t pl-8">Current Assets</td>
              <td className="py-2 px-4 border-t text-right text-blue-600">${formatLargeNumber(metrics.currentAssets)}</td>
            </tr>
            <tr>
              <td className="py-2 px-4 border-t pl-8">Non-Current Assets</td>
              <td className="py-2 px-4 border-t text-right text-blue-600">${formatLargeNumber(metrics.nonCurrentAssets)}</td>
            </tr>
            <tr className="bg-red-50">
              <td className="py-2 px-4 border-t font-medium">Total Liabilities</td>
              <td className="py-2 px-4 border-t text-right font-medium text-red-700">${formatLargeNumber(metrics.liabilities)}</td>
            </tr>
            <tr>
              <td className="py-2 px-4 border-t pl-8">Current Liabilities</td>
              <td className="py-2 px-4 border-t text-right text-red-600">${formatLargeNumber(metrics.currentLiabilities)}</td>
            </tr>
            <tr>
              <td className="py-2 px-4 border-t pl-8">Non-Current Liabilities</td>
              <td className="py-2 px-4 border-t text-right text-red-600">${formatLargeNumber(metrics.nonCurrentLiabilities)}</td>
            </tr>
            <tr className="bg-green-50">
              <td className="py-2 px-4 border-t font-medium rounded-bl-lg">Shareholders' Equity</td>
              <td className="py-2 px-4 border-t text-right font-medium text-green-700 rounded-br-lg">${formatLargeNumber(metrics.equity)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Create a table to display the cash flow metrics
  const renderCashFlowTable = () => {
    return (
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 text-left rounded-tl-lg">Metric</th>
              <th className="py-2 px-4 text-right rounded-tr-lg"></th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-green-50">
              <td className="py-2 px-4 border-t font-medium">Operating Cash Flow</td>
              <td className="py-2 px-4 border-t text-right font-medium text-green-700">${formatLargeNumber(metrics.operatingCashFlow)}</td>
            </tr>
            <tr>
              <td className="py-2 px-4 border-t">Investing Cash Flow</td>
              <td className={`py-2 px-4 border-t text-right ${metrics.investingCashFlow < 0 ? 'text-red-500' : 'text-green-600'}`}>
                {metrics.investingCashFlow < 0 ? '-$' : '$'}{formatLargeNumber(Math.abs(metrics.investingCashFlow))}
              </td>
            </tr>
            <tr>
              <td className="py-2 px-4 border-t">Financing Cash Flow</td>
              <td className={`py-2 px-4 border-t text-right ${metrics.financingCashFlow < 0 ? 'text-red-500' : 'text-green-600'}`}>
                {metrics.financingCashFlow < 0 ? '-$' : '$'}{formatLargeNumber(Math.abs(metrics.financingCashFlow))}
              </td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-2 px-4 border-t font-medium">Net Cash Flow</td>
              <td className={`py-2 px-4 border-t text-right font-medium ${metrics.netCashFlow < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {metrics.netCashFlow < 0 ? '-$' : '$'}{formatLargeNumber(Math.abs(metrics.netCashFlow))}
              </td>
            </tr>
            <tr className="bg-blue-50">
              <td className="py-2 px-4 border-t font-medium rounded-bl-lg">Free Cash Flow</td>
              <td className={`py-2 px-4 border-t text-right font-medium rounded-br-lg ${metrics.freeCashFlow < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                {metrics.freeCashFlow < 0 ? '-$' : '$'}{formatLargeNumber(Math.abs(metrics.freeCashFlow))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return <div className="p-4 bg-white rounded-lg shadow-md">Loading financial metrics...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="text-red-500 mb-2">{error}</div>
        <div className="text-sm text-gray-500">{debugInfo}</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Valuation Metrics Visualized</h2>
      
      {!metrics.isRealData && (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
          Note: Showing sample data because actual financial data is not available for this stock.
        </div>
      )}
      
      {/* Tab navigation */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveTab('income')}
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'income'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Income Statement
          </button>
          <button
            onClick={() => setActiveTab('balance')}
            className={`ml-8 py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'balance'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Balance Sheet
          </button>
          <button
            onClick={() => setActiveTab('cashflow')}
            className={`ml-8 py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'cashflow'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Cash Flow
          </button>
        </nav>
      </div>
      
      {/* Income Statement Tab */}
      {activeTab === 'income' && (
        <div>
          <div className="h-80 mb-6 bg-white rounded-md shadow-md p-4">
            <Bar data={prepareIncomeStatementChartData()} options={incomeChartOptions} />
          </div>
          
          {renderIncomeStatementTable()}
          
          <div className="mt-4">
            <button 
              onClick={() => setShowIncomeExplanation(!showIncomeExplanation)}
              className="text-sm text-blue-500 hover:text-blue-700 focus:outline-none flex items-center"
            >
              {showIncomeExplanation ? 'Hide details' : 'See more'}
              <svg 
                className={`ml-1 h-4 w-4 transform ${showIncomeExplanation ? 'rotate-180' : ''} transition-transform duration-200`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showIncomeExplanation && (
              <div className="mt-2 text-sm text-gray-500">
                <p>This visualization shows the key financial metrics from the income statement:</p>
                <p>• Revenue: Total sales generated by the company</p>
                <p>• Cost of Revenue: Direct costs associated with producing goods/services</p>
                <p>• Gross Profit: Revenue minus Cost of Revenue</p>
                <p>• Operating Expenses: Costs of running the business (excluding COGS)</p>
                <p>• Net Income: Final profit after all expenses</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Balance Sheet Tab */}
      {activeTab === 'balance' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="h-80 bg-white rounded-md shadow-md p-4">
              <Bar data={prepareBalanceSheetChartData()} options={balanceSheetChartOptions} />
            </div>
            <div className="h-80 bg-white rounded-md shadow-md p-4">
              <Doughnut data={prepareAssetsLiabilitiesChartData()} options={doughnutChartOptions} />
            </div>
          </div>
          
          {renderBalanceSheetTable()}
          
          <div className="mt-4">
            <button 
              onClick={() => setShowBalanceExplanation(!showBalanceExplanation)}
              className="text-sm text-blue-500 hover:text-blue-700 focus:outline-none flex items-center"
            >
              {showBalanceExplanation ? 'Hide details' : 'See more'}
              <svg 
                className={`ml-1 h-4 w-4 transform ${showBalanceExplanation ? 'rotate-180' : ''} transition-transform duration-200`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showBalanceExplanation && (
              <div className="mt-2 text-sm text-gray-500">
                <p>This visualization shows the key components of the balance sheet:</p>
                <p>• Assets: Resources owned by the company (current and non-current)</p>
                <p>• Liabilities: Obligations owed by the company (current and non-current)</p>
                <p>• Equity: Shareholders' stake in the company (Assets - Liabilities)</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Cash Flow Tab */}
      {activeTab === 'cashflow' && (
        <div>
          <div className="h-80 mb-6 bg-white rounded-md shadow-md p-4">
            <Bar data={prepareCashFlowChartData()} options={cashFlowChartOptions} />
          </div>
          
          {renderCashFlowTable()}
          
          <div className="mt-4">
            <button 
              onClick={() => setShowCashFlowExplanation(!showCashFlowExplanation)}
              className="text-sm text-blue-500 hover:text-blue-700 focus:outline-none flex items-center"
            >
              {showCashFlowExplanation ? 'Hide details' : 'See more'}
              <svg 
                className={`ml-1 h-4 w-4 transform ${showCashFlowExplanation ? 'rotate-180' : ''} transition-transform duration-200`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showCashFlowExplanation && (
              <div className="mt-2 text-sm text-gray-500">
                <p>This visualization shows the key components of the cash flow statement:</p>
                <p>• Operating Cash Flow: Cash generated from day-to-day business operations</p>
                <p>• Investing Cash Flow: Cash used for investing in assets and securities (negative values indicate investments made)</p>
                <p>• Financing Cash Flow: Cash from debt and equity financing (negative values indicate repayments or dividends)</p>
                <p>• Net Cash Flow: The overall change in cash position during the period</p>
                <p>• Free Cash Flow: Operating cash flow minus capital expenditures, representing cash available for distribution</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {debugInfo && (
        <div className="mt-2 text-xs text-gray-400 border-t pt-2">
          Debug info: {debugInfo}
        </div>
      )}
    </div>
  );
};

export default ValuationMetricsVisualized; 