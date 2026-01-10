import React, { useState, useRef, useEffect } from 'react';
import { GenerationStatus } from '../types';

interface RecipeInputProps {
  onParse: (text: string, image: string | undefined, mimeType: string) => void;
  status: GenerationStatus;
}

export const RecipeInput: React.FC<RecipeInputProps> = ({ onParse, status }) => {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

    // Cleanup preview URL when component unmounts or when preview changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text && !selectedFile) return;

    let base64Image: string | undefined = undefined;
    let mimeType = 'image/png';

    if (selectedFile) {
      mimeType = selectedFile.type;
      base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
    }

    onParse(text, base64Image, mimeType);
  };

  const isLoading = status === GenerationStatus.LOADING;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 mb-8 print-hide">
      <h2 className="text-xl font-serif font-bold text-stone-800 mb-4 flex items-center gap-2">
        <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        New Recipe
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">Upload Image / Screenshot</label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md text-sm font-medium transition-colors border border-stone-300"
            >
              Choose File
            </button>
            <span className="text-sm text-stone-500 italic truncate">
              {selectedFile ? selectedFile.name : 'No file chosen (optional)'}
            </span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          {previewUrl && (
            <div className="mt-3 relative w-32 h-32 rounded-lg overflow-hidden border border-stone-200">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <button
                 type="button"
                 onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                 className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">Recipe Text / Notes</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste recipe text here or describe the dish..."
            className="w-full p-3 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent focus:border-accent min-h-[100px] bg-stone-50"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || (!text && !selectedFile)}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white shadow-md transition-all
            ${isLoading 
              ? 'bg-stone-400 cursor-not-allowed' 
              : 'bg-stone-900 hover:bg-stone-800 active:scale-[0.99]'}`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Parsing Recipe...
            </span>
          ) : (
            'Create Cookbook Page'
          )}
        </button>
      </form>
    </div>
  );
};
