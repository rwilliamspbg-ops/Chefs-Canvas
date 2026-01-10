import React, { useState } from 'react';
import { Recipe, GenerationStatus } from './types';
import { parseRecipe } from './services/geminiService';
import { ApiKeySelector } from './components/ApiKeySelector';
import { RecipeInput } from './components/RecipeInput';
import { RecipeDisplay } from './components/RecipeDisplay';

const App: React.FC = () => {
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async (text: string, image: string | undefined, mimeType: string) => {
    setStatus(GenerationStatus.LOADING);
    setError(null);
    try {
      const parsedRecipe = await parseRecipe(text, image, mimeType);
      setRecipe(parsedRecipe);
      setStatus(GenerationStatus.SUCCESS);
    } catch (e: any) {
      console.error(e);
      setError("We couldn't read that recipe. Please try again with a clearer image or text. (" + e.message + ")");
      setStatus(GenerationStatus.ERROR);
    }
  };

  return (
    <div className="min-h-screen font-sans pb-20">
      <ApiKeySelector onReady={() => setApiKeyReady(true)} />

      {/* Navigation / Header */}
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-sm print-hide">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-sm flex items-center justify-center text-white font-serif font-bold text-lg">C</div>
            <span className="font-serif font-bold text-xl text-stone-800 tracking-tight">Chef's Canvas</span>
          </div>
          <div className="text-xs text-stone-400 font-mono hidden sm:block">POWERED BY GEMINI 2.5 </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {!apiKeyReady ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-stone-400">
             <p>Waiting for API Key selection...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8 items-start print:block">
            
            {/* Sidebar / Input Area */}
            <div className="lg:sticky lg:top-24 space-y-6 print:hidden">
              <RecipeInput onParse={handleParse} status={status} />
              
              {/* Instructions / Help */}
              <div className="bg-stone-200/50 p-6 rounded-xl text-sm text-stone-600 print-hide">
                <h3 className="font-bold text-stone-800 mb-2">How it works</h3>
                <ol className="list-decimal list-inside space-y-2 marker:text-accent">
                  <li>Upload a screenshot of a recipe (PDF/Web) or paste the text.</li>
                  <li>Gemini extracts the details into a structured format.</li>
                  <li>Click <strong>Generate Photo</strong> to create a professional dish image.</li>
                </ol>
              </div>
            </div>

            {/* Results Area */}
            <div className="min-h-[600px]">
              {status === GenerationStatus.LOADING && !recipe && (
                <div className="flex flex-col items-center justify-center h-full text-stone-400 animate-pulse">
                   <div className="w-16 h-16 border-4 border-stone-200 border-t-accent rounded-full animate-spin mb-4"></div>
                   <p className="font-serif text-lg">Reading your recipe...</p>
                </div>
              )}

              {status === GenerationStatus.ERROR && error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-xl flex items-start gap-4">
                  <svg className="w-6 h-6 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <div>
                    <h3 className="font-bold">Error</h3>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              {recipe && (
                 <RecipeDisplay recipe={recipe} />
              )}
              
              {!recipe && status !== GenerationStatus.LOADING && status !== GenerationStatus.ERROR && (
                <div className="flex flex-col items-center justify-center h-full text-stone-400 border-2 border-dashed border-stone-200 rounded-2xl p-12 bg-stone-50/50">
                  <svg className="w-16 h-16 mb-4 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  <p className="font-serif text-xl mb-2">Your canvas is empty</p>
                  <p className="text-sm">Upload a recipe to begin the transformation.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
