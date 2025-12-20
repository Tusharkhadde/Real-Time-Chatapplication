import React from 'react';
import { Link } from 'react-router-dom';
import { Home, MessageCircle, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative inline-block">
            <span className="text-9xl font-bold text-gray-200 dark:text-gray-700">
              404
            </span>
            <MessageCircle 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                         w-16 h-16 text-primary-500 animate-bounce" 
            />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Page Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 
                       bg-primary-500 hover:bg-primary-600 text-white font-medium 
                       rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
          
          <Link
            to="/chat"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 
                       bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 
                       dark:hover:bg-gray-600 text-gray-900 dark:text-white 
                       font-medium rounded-lg transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            Go to Chat
          </Link>
        </div>

        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="mt-6 inline-flex items-center gap-2 text-gray-500 
                     dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 
                     transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back to previous page
        </button>
      </div>
    </div>
  );
};

export default NotFound;