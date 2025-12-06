import React, { useEffect, useState } from 'react';

interface ApiKeySelectorProps {
  onReady: () => void;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onReady }) => {
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkKey = async () => {
    try {
      const aistudio = (window as any).aistudio;
      if (aistudio && await aistudio.hasSelectedApiKey()) {
        setHasKey(true);
        onReady();
      } else {
        setHasKey(false);
      }
    } catch (e) {
      console.error("Error checking API key:", e);
      setHasKey(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkKey();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      try {
        await aistudio.openSelectKey();
        // Assume success after dialog interaction per instructions.
        setHasKey(true);
        onReady();
      } catch (error) {
        console.error("Key selection failed", error);
        setHasKey(false);
      }
    }
  };

  if (loading) return <div className="p-4 text-center">Checking permissions...</div>;
  if (hasKey) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full text-center border border-stone-200">
        <h2 className="text-2xl font-serif font-bold text-stone-800 mb-4">Unlock Chef's Canvas</h2>
        <p className="text-stone-600 mb-6 leading-relaxed">
          To generate professional food photography and cinematic videos with Gemini Veo, 
          please select a paid API key from a valid Google Cloud Project.
        </p>
        <button
          onClick={handleSelectKey}
          className="w-full py-3 px-6 bg-accent hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"
        >
          <span>Select API Key</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
        </button>
        <div className="mt-4 text-xs text-stone-400">
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-600">
            View Billing Documentation
          </a>
        </div>
      </div>
    </div>
  );
};