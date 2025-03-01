'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useState } from 'react';

export default function Header() {
  const { user, signOut, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            StonkApp
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="hover:text-blue-300">
              Home
            </Link>
            <Link href="/stocks" className="hover:text-blue-300">
              Watchlist
            </Link>
            
            {/* Upgrade button - desktop */}
            <Link 
              href="/pricing" 
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-md font-medium hover:from-blue-600 hover:to-blue-800 transition-all"
            >
              Upgrade to Premium
            </Link>
            
            {isLoading ? (
              <div className="animate-pulse h-8 w-20 bg-gray-700 rounded"></div>
            ) : user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 hover:text-blue-300 focus:outline-none"
                >
                  <span>{user.email?.split('@')[0]}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <Link 
                      href="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        console.log('[HEADER] Profile link clicked');
                        setIsMenuOpen(false);
                      }}
                    >
                      Profile
                    </Link>
                    <Link 
                      href="/pricing" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Upgrade Plan
                    </Link>
                    <button 
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/auth/signin" 
                  className="px-4 py-2 rounded hover:bg-gray-700"
                >
                  Sign in
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              ></path>
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            <Link 
              href="/" 
              className="block py-2 hover:text-blue-300"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="/stocks" 
              className="block py-2 hover:text-blue-300"
              onClick={() => setIsMenuOpen(false)}
            >
              Watchlist
            </Link>
            
            {/* Upgrade button - mobile */}
            <Link 
              href="/pricing" 
              className="block py-2 mt-2 mb-2 text-center bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-md font-medium hover:from-blue-600 hover:to-blue-800 transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              Upgrade to Premium
            </Link>
            
            {user ? (
              <>
                <Link 
                  href="/profile" 
                  className="block py-2 hover:text-blue-300"
                  onClick={() => {
                    console.log('[HEADER] Mobile profile link clicked');
                    setIsMenuOpen(false);
                  }}
                >
                  Profile
                </Link>
                <button 
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 hover:text-blue-300"
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-2 mt-2">
                <Link 
                  href="/auth/signin" 
                  className="px-4 py-2 rounded hover:bg-gray-700 text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
} 