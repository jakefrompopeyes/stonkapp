// Updated for Vercel deployment - forcing a new commit
'use client'

import { useState, useEffect } from 'react'
import { getServerStatus } from '@/lib/api'
import StatusCard from '@/components/StatusCard'
import StockSearch from '@/components/StockSearch'

export default function Home() {
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const data = await getServerStatus()
        setMessage(data)
      } catch (error) {
        console.error('Error fetching data:', error)
        setMessage('Error connecting to server')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
          Welcome to StonkApp
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Search for public stocks to view detailed information, historical prices, and more.
        </p>
        
        <div className="mb-8">
          <StockSearch />
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Try searching for popular stocks like AAPL (Apple), MSFT (Microsoft), or TSLA (Tesla)
        </div>
      </div>
      
      <StatusCard 
        title="Server Status" 
        status={message} 
        loading={loading} 
      />
    </div>
  )
} 