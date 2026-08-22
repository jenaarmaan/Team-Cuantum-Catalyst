/**
 * NYASA Upload Box
 * Drag-and-drop image upload + claim text input.
 * The unified verification interface.
 */

import { useState, useRef, useCallback } from 'react';

interface UploadBoxProps {
  onSubmit: (claim: string, image: File | null) => void;
  isLoading: boolean;
}

export default function UploadBox({ onSubmit, isLoading }: UploadBoxProps) {
  const [claim, setClaim] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPEG, PNG, WebP)');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      alert('Image too large. Maximum size: 15 MB');
      return;
    }
    setImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleSubmit = () => {
    if (!claim.trim()) return;
    onSubmit(claim.trim(), image);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Image Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed p-8
          transition-all duration-300 mb-5
          ${isDragging
            ? 'border-nyasa-primary bg-nyasa-primary/5 scale-[1.02]'
            : preview
              ? 'border-nyasa-border-light bg-nyasa-card'
              : 'border-nyasa-border hover:border-nyasa-primary/50 bg-nyasa-surface/50 hover:bg-nyasa-card/50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {preview ? (
          <div className="flex flex-col items-center gap-4">
            <img
              src={preview}
              alt="Uploaded preview"
              className="max-h-48 rounded-xl object-contain shadow-lg"
            />
            <div className="flex items-center gap-3">
              <span className="text-sm text-nyasa-text-muted">{image?.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImage(null);
                  setPreview(null);
                }}
                className="text-xs px-3 py-1 rounded-full bg-nyasa-contradicted/10 text-nyasa-contradicted
                           hover:bg-nyasa-contradicted/20 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-nyasa-primary/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-nyasa-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-nyasa-text font-medium">Drop an image here or click to upload</p>
              <p className="text-sm text-nyasa-text-dim mt-1">JPEG, PNG, WebP — up to 15 MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Claim Input */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-nyasa-text-muted mb-2">
          What is being claimed about this content?
        </label>
        <textarea
          value={claim}
          onChange={(e) => setClaim(e.target.value)}
          placeholder='e.g., "This image shows flooding in Mysuru today"'
          rows={3}
          maxLength={10000}
          className="w-full px-4 py-3 rounded-xl bg-nyasa-surface border border-nyasa-border
                     text-nyasa-text placeholder:text-nyasa-text-dim
                     focus:outline-none focus:border-nyasa-primary focus:ring-1 focus:ring-nyasa-primary/30
                     transition-all duration-200 resize-none"
        />
        <p className="text-xs text-nyasa-text-dim mt-1 text-right">
          {claim.length}/10,000
        </p>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!claim.trim() || isLoading}
        className={`
          w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300
          ${claim.trim() && !isLoading
            ? 'bg-gradient-to-r from-nyasa-primary to-nyasa-primary-glow text-white shadow-lg shadow-nyasa-primary/25 hover:shadow-nyasa-primary/40 hover:scale-[1.01] active:scale-[0.99]'
            : 'bg-nyasa-card text-nyasa-text-dim cursor-not-allowed'
          }
        `}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Analyzing...
          </span>
        ) : (
          'Analyze with NYASA'
        )}
      </button>
    </div>
  );
}
