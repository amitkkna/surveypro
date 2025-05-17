'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function InitializeDatabase() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const createTables = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      setMessage('Initializing database with SQL...');
      await initializeWithSQL();
      setMessage('Database initialized successfully!');
    } catch (error: any) {
      console.error('Error initializing database:', error);
      setError(error.message || 'Failed to initialize database');
    } finally {
      setLoading(false);
    }
  };

  const initializeWithSQL = async () => {
    try {
      // Check if surveys table exists
      setMessage('Checking if tables exist...');
      const { error: checkError } = await supabase
        .from('surveys')
        .select('id')
        .limit(1);

      if (checkError && checkError.code === '42P01') { // Table doesn't exist
        setMessage('Tables do not exist. Please run the SQL script in Supabase SQL Editor.');
        setError(`
          Please run the following SQL in your Supabase SQL Editor:

          CREATE TABLE IF NOT EXISTS surveys (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by TEXT NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            expiry_date TIMESTAMP WITH TIME ZONE
          );

          CREATE TABLE IF NOT EXISTS questions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
            text TEXT NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('checkbox', 'text', 'radio')),
            section TEXT NOT NULL,
            "order" INTEGER NOT NULL,
            is_required BOOLEAN DEFAULT FALSE
          );

          CREATE TABLE IF NOT EXISTS options (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
            text TEXT NOT NULL,
            "order" INTEGER NOT NULL
          );

          CREATE TABLE IF NOT EXISTS respondents (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS responses (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
            question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
            option_id UUID REFERENCES options(id) ON DELETE CASCADE,
            text_response TEXT,
            respondent_id UUID REFERENCES respondents(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `);
        return;
      }

      // If we get here, the tables exist
      setMessage('Tables already exist in the database.');
    } catch (error) {
      console.error('Error checking tables:', error);
      throw error;
    }
  };

  return (
    <ProtectedRoute>
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Initialize Database</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              This will create all necessary tables in your Supabase database. Only run this once when setting up the application.
            </p>
          </div>

          {message && (
            <div className="mt-4 p-4 bg-green-50 rounded-md">
              <p className="text-green-700">{message}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="mt-5 flex space-x-3">
            <button
              type="button"
              onClick={createTables}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Initializing...' : 'Initialize Database'}
            </button>

            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
