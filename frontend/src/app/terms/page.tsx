export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto my-8">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      
      <div className="prose prose-lg">
        <p className="mb-4">
          Last updated: {new Date().toLocaleDateString()}
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">1. Introduction</h2>
        <p className="mb-4">
          Welcome to StonkScan. These Terms of Service govern your use of our website and services.
          By accessing or using StonkScan, you agree to be bound by these Terms.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">2. Use of Services</h2>
        <p className="mb-4">
          StonkScan provides tools for tracking and analyzing stock market data. Our services are provided "as is" and "as available" without warranties of any kind.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">3. User Accounts</h2>
        <p className="mb-4">
          When you create an account with us, you must provide accurate and complete information. You are responsible for maintaining the security of your account.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">4. Subscription and Payments</h2>
        <p className="mb-4">
          Some features of StonkScan require a paid subscription. By subscribing, you agree to pay the fees as they become due. Subscriptions automatically renew unless canceled.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">5. Limitation of Liability</h2>
        <p className="mb-4">
          StonkScan shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">6. Changes to Terms</h2>
        <p className="mb-4">
          We reserve the right to modify these terms at any time. We will provide notice of significant changes by posting an update on our website.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">7. Contact Us</h2>
        <p className="mb-4">
          If you have any questions about these Terms, please contact us at support@stonkscan.com.
        </p>
      </div>
    </div>
  );
} 