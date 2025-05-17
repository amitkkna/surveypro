'use client';

import React from 'react';
import Link from 'next/link';

export default function SurveyIndex() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Survey Portal</h1>
          <p className="mb-6">This is the survey index page. Please select a survey to view.</p>
          
          <div className="mt-4">
            <Link
              href="/admin/surveys"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Go to Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
