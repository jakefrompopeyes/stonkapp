'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'comment' | 'complaint'>('comment');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Insert feedback into the database
      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user?.id || null,
          email: user?.email || null,
          feedback_type: feedbackType,
          content: feedback,
        });
        
      if (error) throw error;
      
      // Show success message
      setIsSubmitted(true);
      setFeedback('');
      
      // Close the feedback form after 3 seconds
      setTimeout(() => {
        setIsOpen(false);
        setIsSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-80">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Send Feedback</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {isSubmitted ? (
            <div className="text-center py-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-lg font-medium">Thank you!</p>
              <p className="text-sm text-gray-500">Your feedback has been submitted.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <div className="flex space-x-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="feedbackType"
                      checked={feedbackType === 'comment'}
                      onChange={() => setFeedbackType('comment')}
                      className="mr-2"
                    />
                    Comment
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="feedbackType"
                      checked={feedbackType === 'complaint'}
                      onChange={() => setFeedbackType('complaint')}
                      className="mr-2"
                    />
                    Complaint
                  </label>
                </div>
                
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us what you think..."
                  className="w-full p-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                  rows={4}
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting || !feedback.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-colors"
          aria-label="Open feedback form"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        </button>
      )}
    </div>
  );
} 