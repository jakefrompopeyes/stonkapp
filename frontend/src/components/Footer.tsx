import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 text-white py-6 w-full">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-400">
              © {currentYear} StonkScan. All rights reserved.
            </p>
          </div>
          
          <div className="flex space-x-6">
            <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
} 