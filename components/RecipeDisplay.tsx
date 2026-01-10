import React, { useState, useEffect, useRef } from 'react';
import { Recipe, GeneratedMedia } from '../types';
import { generateRecipeImage } from '../services/geminiService';

interface RecipeDisplayProps {
  recipe: Recipe;
}

export const RecipeDisplay: React.FC<RecipeDisplayProps> = ({ recipe }) => {
  const [localRecipe, setLocalRecipe] = useState<Recipe>(recipe);
  const [isEditing, setIsEditing] = useState(false);
  const [media, setMedia] = useState<GeneratedMedia>({});
  const [loadingImage, setLoadingImage] = useState(false);

  const [error, setError] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync local state when the prop recipe changes (e.g. new file uploaded)
  useEffect(() => {
    setLocalRecipe(recipe);
    setMedia({});
    setIsEditing(false);
  }, [recipe]);

  const handleGenerateImage = async () => {
    setLoadingImage(true);
    setError(null);
    try {
      const url = await generateRecipeImage(localRecipe);
      setMedia(prev => ({ ...prev, imageUrl: url }));
    } catch (e: any) {
      setError("Image generation failed: " + e.message);
    } finally {
      setLoadingImage(false);
    }
  };

 
  const handleSave = () => {
    setIsEditing(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHtml = () => {
    if (!containerRef.current) return;

    // Clone the node to manipulate it without affecting the UI
    const clone = containerRef.current.cloneNode(true) as HTMLElement;

    // Remove elements that shouldn't be in the export (buttons, etc)
    const elementsToRemove = clone.querySelectorAll('.print-hide');
    elementsToRemove.forEach(el => el.remove());

    // Get the HTML content
    const content = clone.innerHTML;

    // Construct full HTML document with styles
    const htmlString = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${localRecipe.title} - Chef's Canvas</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            fontFamily: {
              serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
              sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
            },
            colors: {
              paper: '#fdfbf7',
              ink: '#2d2d2d',
              accent: '#c25e00',
            }
          },
        },
      }
    </script>
    <style>
       body { background-color: #f5f5f4; color: #1c1917; padding: 40px; }
       .recipe-card { max-width: 900px; margin: 0 auto; background-color: #fdfbf7; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); position: relative; overflow: hidden; }
       @media print {
         body { padding: 0; background-color: white; }
         .recipe-card { box-shadow: none; max-width: none; }
       }
    </style>
</head>
<body>
    <div class="recipe-card">
        ${content}
    </div>
</body>
</html>`;

    // Create download link
    const blob = new Blob([htmlString], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${localRecipe.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={containerRef} className="relative mx-auto max-w-4xl bg-[#fdfbf7] shadow-2xl overflow-hidden print:shadow-none print:max-w-none group/paper">
      {/* Texture overlay effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>

      {/* Edit Controls */}
      <div className="absolute top-4 right-4 z-20 flex gap-2 print-hide opacity-0 group-hover/paper:opacity-100 transition-opacity focus-within:opacity-100">
        {!isEditing ? (
          <>
            <button
              onClick={handleDownloadHtml}
              className="p-2 bg-white/80 backdrop-blur text-stone-600 rounded-full hover:bg-white hover:text-accent shadow-sm border border-stone-200 transition-all"
              title="Save as HTML"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
            <button
              onClick={handlePrint}
              className="p-2 bg-white/80 backdrop-blur text-stone-600 rounded-full hover:bg-white hover:text-accent shadow-sm border border-stone-200 transition-all"
              title="Print / Save PDF"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2.5 0a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM9 21h6M9 17h6" /></svg>
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 bg-white/80 backdrop-blur text-stone-600 rounded-full hover:bg-white hover:text-accent shadow-sm border border-stone-200 transition-all"
              title="Edit Details"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
          </>
        ) : (
          <button
            onClick={handleSave}
            className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 shadow-sm border border-green-200 transition-all"
            title="Save Changes"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </button>
        )}
      </div>

      <div className="relative p-8 md:p-12 lg:p-16">
        {/* Header */}
        <header className="text-center mb-12 border-b-2 border-stone-900/10 pb-8">
          <div className="text-xs font-bold tracking-[0.2em] text-accent uppercase mb-3">Chef's Collection</div>
          
          {isEditing ? (
            <div className="space-y-4">
              <input
                type="text"
                value={localRecipe.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full text-4xl md:text-6xl font-serif font-bold text-stone-900 text-center bg-white/50 border-b-2 border-accent/30 focus:border-accent outline-none px-2 py-1 placeholder-stone-300"
                placeholder="Recipe Title"
              />
              <textarea
                value={localRecipe.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full text-lg md:text-xl text-stone-600 italic text-center bg-white/50 border border-stone-200 rounded-lg focus:border-accent outline-none p-3 resize-none placeholder-stone-300"
                placeholder="Brief description of the dish..."
              />
            </div>
          ) : (
            <>
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 mb-4">{localRecipe.title}</h1>
              <p className="text-lg md:text-xl text-stone-600 italic max-w-2xl mx-auto leading-relaxed">{localRecipe.description}</p>
            </>
          )}
          
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mt-6 text-sm font-sans text-stone-500 uppercase tracking-wider">
            {isEditing ? (
              <>
                 <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900">Prep</span>
                  <input 
                    value={localRecipe.prepTime || ''}
                    onChange={(e) => handleChange('prepTime', e.target.value)}
                    placeholder="15 mins"
                    className="w-24 border-b border-stone-300 bg-transparent focus:border-accent outline-none text-center"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900">Cook</span>
                  <input 
                    value={localRecipe.cookTime || ''}
                    onChange={(e) => handleChange('cookTime', e.target.value)}
                    placeholder="30 mins"
                    className="w-24 border-b border-stone-300 bg-transparent focus:border-accent outline-none text-center"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900">Serves</span>
                  <input 
                    value={localRecipe.servings || ''}
                    onChange={(e) => handleChange('servings', e.target.value)}
                    placeholder="4 people"
                    className="w-24 border-b border-stone-300 bg-transparent focus:border-accent outline-none text-center"
                  />
                </div>
              </>
            ) : (
              <>
                {localRecipe.prepTime && (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900">Prep</span> {localRecipe.prepTime}
                  </div>
                )}
                {localRecipe.cookTime && (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900">Cook</span> {localRecipe.cookTime}
                  </div>
                )}
                {localRecipe.servings && (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900">Serves</span> {localRecipe.servings}
                  </div>
                )}
              </>
            )}
          </div>
        </header>

        {/* Media Section */}
        <div className="mb-12 space-y-8">
          {/* Image Area */}
          <div className="relative bg-stone-200 min-h-[400px] rounded-sm overflow-hidden shadow-inner group">
             {media.imageUrl ? (
               <img src={media.imageUrl} alt={localRecipe.title} className="w-full h-full object-cover" />
             ) : (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-500">
                 <p className="mb-4 text-stone-400 font-serif text-lg italic">Photography not yet developed</p>
                 <button 
                  onClick={handleGenerateImage}
                  disabled={loadingImage}
                  className="px-6 py-2 bg-stone-800 text-white rounded-full hover:bg-stone-700 transition shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                  {loadingImage ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                      Developing Photo...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Generate Photo
                    </>
                  )}
                 </button>
               </div>
             )}
          </div>

         

        {/* Recipe Content - 2 Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          
          {/* Ingredients Column */}
      <div className="md:col-span-5 lg:col-span-4">            <h3 className="text-xl font-serif font-bold text-stone-900 border-b-2 border-accent inline-block mb-6 pb-1">Ingredients</h3>
            <ul className="space-y-3 font-sans text-sm md:text-base text-stone-700">
              {localRecipe.ingredients.map((ing, idx) => (
                <li key={idx} className="flex items-start gap-3 group">
                   <span className="w-1.5 h-1.5 mt-2 rounded-full bg-accent/40 group-hover:bg-accent transition-colors flex-shrink-0"></span>
                   <span className="leading-snug">{ing}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions Column */}
      <div className="md:col-span-7 lg:col-span-8">            <h3 className="text-xl font-serif font-bold text-stone-900 border-b-2 border-accent inline-block mb-6 pb-1">Preparation</h3>
            <div className="space-y-8">
              {localRecipe.instructions.map((step, idx) => (
                <div key={idx} className="relative pl-8">
                  <span className="absolute left-0 top-0 text-3xl font-serif font-bold text-stone-200 -translate-y-2 select-none">{idx + 1}</span>
                  <p className="text-stone-800 leading-relaxed relative z-10 text-lg font-serif">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-stone-200 text-center flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border border-stone-300 flex items-center justify-center mb-4">
             <span className="text-stone-400 text-xs">CC</span>
          </div>
          <p className="text-stone-400 text-xs uppercase tracking-widest">Chef's Canvas • AI Generated Cookbook</p>
        </footer>
      </div>
        </div>
  );
};
