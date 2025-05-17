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
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Your Surveys</h3>
        <Link
          href="/admin/surveys/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
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
            <li key={survey.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-indigo-600 truncate">{survey.title}</p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      survey.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {survey.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      {survey.description}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>
                      Created on{' '}
                      {new Date(survey.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex space-x-2">
                  {survey.id === 'default-survey' ? (
                    <Link
                      href={`/survey/default-survey`}
                      className="text-sm text-indigo-600 hover:text-indigo-900"
                      target="_blank"
                    >
                      View Survey
                    </Link>
                  ) : (
                    <Link
                      href={`/admin/surveys/${survey.id}`}
                      className="text-sm text-indigo-600 hover:text-indigo-900"
                    >
                      View Details
                    </Link>
                  )}
                  {survey.id !== 'default-survey' && (
                    <Link
                      href={`/admin/surveys/${survey.id}/edit`}
                      className="text-sm text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </Link>
                  )}
                  <Link
                    href={survey.id === 'default-survey' ? `/survey/default-survey` : `/admin/surveys/${survey.id}/responses`}
                    className="text-sm text-indigo-600 hover:text-indigo-900"
                    target={survey.id === 'default-survey' ? "_blank" : ""}
                  >
                    {survey.id === 'default-survey' ? 'Take Survey' : 'View Responses'}
                  </Link>
                  <Link
                    href={survey.id === 'default-survey' ? `/admin/surveys/default-survey/qr-code` : `/admin/surveys/${survey.id}/qr-code`}
                    className="text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    Generate QR Code
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
