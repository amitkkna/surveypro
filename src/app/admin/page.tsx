'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSurveys } from '@/utils/api';
import { Survey } from '@/types/database.types';
import { defaultSurvey } from '@/data/defaultSurvey';

export default function AdminDashboard() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const data = await getSurveys();

        // If no surveys exist, create a default one with the workplace survey
        if (data.length === 0) {
          // Create a mock survey with the default data
          const mockSurvey: Survey = {
            id: 'default-survey',
            title: defaultSurvey.title,
            description: defaultSurvey.description,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'admin',
            is_active: true,
          };

          setSurveys([mockSurvey]);
        } else {
          setSurveys(data);
        }
      } catch (error) {
        console.error('Error fetching surveys:', error);

        // If there's an error (like no Supabase connection), show the default survey
        const mockSurvey: Survey = {
          id: 'default-survey',
          title: defaultSurvey.title,
          description: defaultSurvey.description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'admin',
          is_active: true,
        };

        setSurveys([mockSurvey]);
      } finally {
        setLoading(false);
      }
    };

    fetchSurveys();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Survey Administration</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your surveys, view responses, and generate QR codes for distribution.
          </p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-gradient-to-r from-indigo-700 to-purple-700">
            <h3 className="text-lg leading-6 font-medium text-white">Your Surveys</h3>
            <Link
              href="/admin/surveys/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Survey
            </Link>
          </div>
      {loading ? (
        <div className="px-4 py-5 sm:p-6 text-center">
          <p>Loading surveys...</p>
        </div>
      ) : surveys.length === 0 ? (
        <div className="px-4 py-5 sm:p-6 text-center">
          <p className="text-gray-500">No surveys found. Create your first survey!</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {surveys.map((survey) => (
            <li key={survey.id} className="hover:bg-gray-50 transition duration-150">
              <div className="px-6 py-6 sm:px-8">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 truncate">{survey.title}</h4>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">{survey.description}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      survey.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {survey.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center text-sm text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Created on {new Date(survey.created_at).toLocaleDateString()}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {survey.id === 'default-survey' ? (
                    <Link
                      href={`/survey/default-survey`}
                      className="inline-flex items-center px-3 py-1.5 border border-indigo-600 text-xs font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      target="_blank"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Survey
                    </Link>
                  ) : (
                    <Link
                      href={`/admin/surveys/${survey.id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-indigo-600 text-xs font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      View Details
                    </Link>
                  )}

                  {survey.id !== 'default-survey' && (
                    <Link
                      href={`/admin/surveys/${survey.id}/edit`}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </Link>
                  )}

                  <Link
                    href={survey.id === 'default-survey' ? `/survey/default-survey` : `/admin/surveys/${survey.id}/responses`}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    target={survey.id === 'default-survey' ? "_blank" : ""}
                  >
                    {survey.id === 'default-survey' ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Take Survey
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        View Responses
                      </>
                    )}
                  </Link>

                  <Link
                    href={survey.id === 'default-survey' ? `/admin/surveys/default-survey/qr-code` : `/admin/surveys/${survey.id}/qr-code`}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    Generate QR Code
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
        </div>
      </div>
    </div>
  );
}
