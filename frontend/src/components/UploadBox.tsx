/**
 * NYASA Upload Box
 * Drag-and-drop media upload + claim text input.
 * The unified verification interface.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

interface UploadBoxProps {
  onSubmit: (claim: string, image: File | null) => void;
  isLoading: boolean;
}

export default function UploadBox({ onSubmit, isLoading }: UploadBoxProps) {
  const [claim, setClaim] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [invalidFile, setInvalidFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke object URL on cleanup to prevent memory leaks
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleFile = useCallback((file: File) => {
    setInvalidFile(false);
    const type = file.type.split('/')[0];
    if (type !== 'image' && type !== 'video' && type !== 'audio') {
      setInvalidFile(true);
      alert('Please upload a supported media file (Image, Video, or Audio)');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      alert('File too large. Maximum size: 25 MB');
      return;
    }
    
    setImage(file);
    setMediaType(type as 'image' | 'video' | 'audio');
    
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
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

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setImage(null);
    setMediaType(null);
    setPreview(null);
    setInvalidFile(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Media Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed p-8
          transition-all duration-300 mb-5 text-left
          ${isDragging
            ? 'border-nyasa-primary bg-nyasa-primary/5 scale-[1.02]'
            : invalidFile
              ? 'border-nyasa-contradicted bg-nyasa-contradicted/5'
              : preview
                ? 'border-nyasa-border-light bg-nyasa-card'
                : 'border-nyasa-border hover:border-nyasa-primary/50 bg-nyasa-surface/50 hover:bg-nyasa-card/50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {preview && mediaType ? (
          <div className="flex flex-col items-center gap-4 w-full">
            {mediaType === 'image' && (
              <img
                src={preview}
                alt="Uploaded preview"
                className="max-h-48 rounded-xl object-contain shadow-lg"
              />
            )}
            
            {mediaType === 'video' && (
              <video
                src={preview}
                controls
                className="max-h-48 w-full max-w-md rounded-xl object-contain shadow-lg bg-black"
                onClick={(e) => e.stopPropagation()}
              />
            )}

            {mediaType === 'audio' && (
              <div 
                className="w-full max-w-md p-4 rounded-xl border border-nyasa-border bg-slate-50/50 flex flex-col items-center gap-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-lg bg-nyasa-primary/10 flex items-center justify-center text-nyasa-primary text-lg">
                    🎵
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-nyasa-text truncate">{image?.name}</p>
                    <p className="text-[10px] text-nyasa-text-dim">{(image!.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <audio src={preview} controls className="w-full" />
              </div>
            )}

            <div className="flex items-center gap-3">
              <span className="text-xs text-nyasa-text-muted max-w-[200px] truncate">{image?.name}</span>
              <button
                onClick={handleRemove}
                className="text-xs px-3 py-1 rounded-full bg-nyasa-contradicted/10 text-nyasa-contradicted
                           hover:bg-nyasa-contradicted/20 transition-colors cursor-pointer"
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
              <p className="text-nyasa-text font-medium">Drop media here or click to upload</p>
              <p className="text-sm text-nyasa-text-dim mt-1">Images, Videos, or Audio — up to 25 MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Claim Input */}
      <div className="mb-5 text-left">
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
          w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 cursor-pointer
          ${claim.trim() && !isLoading
            ? 'bg-gradient-to-r from-nyasa-primary to-nyasa-primary-glow text-white shadow-lg shadow-nyasa-primary/25 hover:shadow-nyasa-primary/40 hover:scale-[1.01] active:scale-[0.99]'
            : 'bg-nyasa-card text-nyasa-text-dim cursor-not-allowed border border-nyasa-border'
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
