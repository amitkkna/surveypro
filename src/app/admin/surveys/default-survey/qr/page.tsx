'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { defaultSurvey } from '@/data/defaultSurvey';

export default function DefaultSurveyQRCode() {
  const router = useRouter();
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    // Set the base URL based on the current window location
    setBaseUrl(window.location.origin);
  }, []);

  const surveyUrl = `${baseUrl}/surveys/default-survey`;

  const downloadQRCode = () => {
    const svg = document.getElementById('survey-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      // Download the PNG file
      const downloadLink = document.createElement('a');
      downloadLink.download = `survey-qr-default.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">QR Code for {defaultSurvey.title}</h3>
        <div className="mt-5">
          <div className="flex flex-col items-center">
            <div className="border border-gray-300 p-4 rounded-md bg-white">
              <QRCodeSVG
                id="survey-qr-code"
                value={surveyUrl}
                size={250}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Scan this QR code to access the survey or share the link:
            </p>
            <div className="mt-2 flex w-full max-w-md">
              <input
                type="text"
                readOnly
                value={surveyUrl}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(surveyUrl)}
                className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Copy
              </button>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={downloadQRCode}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Download QR Code
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6">
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
  );
}
