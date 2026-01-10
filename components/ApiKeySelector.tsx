import React, { useState } from 'react';

interface ApiKeySelectorProps {
  onReady: () => void;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onReady }) => {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleSubmit = () => {
    if (!apiKey || apiKey.trim().length < 30) {
      setError('Please enter a valid API key');
      return;
    }
    
    // Store API key in window object for PERPLEXITYService to use
    (window as any).PERPLEXITY_API_KEY = apiKey.trim();
    setIsModalOpen(false);
    onReady();
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <h2 className="text-2xl font-serif font-bold text-stone-800 mb-3">Unlock Chef's Canvas</h2>
        <p className="text-stone-600 mb-6 text-sm">
          To parse recipes from images and PDFs with GEMINI,
          please enter your Gemini API key.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              GEMINI API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError(null);
              }}
              placeholder="AIza..."
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            {error && (
              <p className="text-red-600 text-sm mt-2">{error}</p>
            )}
          </div>
          
          <button
            onClick={handleSubmit}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
          >
            Continue
          </button>
          
          <a
            href="https://www.perplexity.ai/settings/api/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-sm text-stone-500 hover:text-stone-700 underline"
          >
            Get your API key from Perplexity Settings
          </a>
        </div>
      </div>
    </div>
  );
};
