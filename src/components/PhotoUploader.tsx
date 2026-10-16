import React, { useRef, useState } from 'react';
import { UploadCloud, X, RefreshCw, AlertCircle, CheckCircle2, Image as ImageIcon } from 'lucide-react';

interface PhotoUploaderProps {
  selectedFile: File | null;
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;
}

const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  selectedFile,
  previewUrl,
  onFileSelect,
  onClear,
  errorMessage,
  setErrorMessage,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSelectFile = (file: File) => {
    setErrorMessage(null);
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

    const isTypeValid = SUPPORTED_MIME_TYPES.includes(file.type) || SUPPORTED_EXTENSIONS.includes(fileExt);

    if (!isTypeValid) {
      setErrorMessage(
        `Unsupported file type "${fileExt || file.type}". Please upload a JPG or PNG image.`
      );
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('File size exceeds 15MB limit. Please upload a smaller image.');
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (e.dataTransfer.files.length > 1) {
        setErrorMessage('Please upload one photo at a time.');
      }
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const triggerBrowse = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="glass-panel card-left-purple rounded-2xl p-5 sm:p-6 shadow-glow-purple backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-purple-500/15">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <ImageIcon className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <label className="block text-xs font-bold font-display uppercase tracking-wider text-slate-100">
              Upload Photo
            </label>
            <p className="text-[11px] text-slate-400">
              Upload a clear photo of the issue
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase bg-purple-950/80 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full shadow-xs">
          JPG, PNG up to 15MB
        </span>
      </div>

      {previewUrl ? (
        <div className="relative rounded-2xl border border-purple-500/30 bg-[#090b17] overflow-hidden p-2.5 shadow-inner">
          <div className="relative max-h-72 rounded-xl overflow-hidden bg-black/80 flex items-center justify-center border border-purple-500/10">
            <img
              src={previewUrl}
              alt="Selected civic issue observation"
              className="max-h-72 w-auto object-contain mx-auto"
            />
          </div>

          <div className="mt-3 flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2 text-xs text-slate-300 truncate mr-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-mono text-purple-200 truncate">{selectedFile?.name || 'Photo.jpg'}</span>
              {selectedFile && (
                <span className="text-slate-500 text-[11px] font-mono shrink-0">
                  ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={triggerBrowse}
                className="btn-fade inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-[#161a33] border border-purple-500/30 rounded-lg hover:bg-[#1d2347] transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                <span>Replace</span>
              </button>
              <button
                type="button"
                onClick={onClear}
                className="btn-fade inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-lg hover:bg-rose-900/40 transition-all"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerBrowse}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-purple-400 bg-purple-950/40 scale-[1.008] shadow-[0_0_25px_rgba(168,85,247,0.3)]'
              : 'border-purple-500/25 bg-[#0b0d1e]/80 hover:border-purple-400/50 hover:bg-[#11142a]'
          }`}
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-purple-900/50 to-blue-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-glow-purple">
            <UploadCloud className="w-6 h-6 text-purple-300" />
          </div>
          <p className="text-sm font-semibold font-display text-white">
            Drag & drop your photo here, or click to browse
          </p>
          <p className="text-xs text-slate-400 mt-1">
            JPG, JPEG, or PNG (single photo)
          </p>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center justify-center gap-2">
            <span>Potholes</span>
            <span>•</span>
            <span>Garbage accumulation</span>
            <span>•</span>
            <span>Broken streetlights</span>
          </p>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {errorMessage && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Upload Error</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};
