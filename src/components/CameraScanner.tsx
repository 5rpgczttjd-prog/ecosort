import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, SwitchCamera, Upload, Sparkles, AlertCircle, RefreshCw, Zap, ZapOff, Check, Image as ImageIcon } from 'lucide-react';
import { SAMPLE_PRESET_ITEMS, SampleItem } from '../data/municipalities';
import { MunicipalityPreset } from '../types';

interface CameraScannerProps {
  onCapture: (base64Image: string, mimeType: string, userNotes?: string) => void;
  isAnalyzing: boolean;
  municipality: MunicipalityPreset;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onCapture,
  isAnalyzing,
  municipality,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [hasFlash, setHasFlash] = useState<boolean>(false);
  const [isFlashOn, setIsFlashOn] = useState<boolean>(false);

  // Captured preview state
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewMimeType, setPreviewMimeType] = useState<string>('image/jpeg');
  const [userNote, setUserNote] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
    setIsFlashOn(false);
  }, [stream]);

  // Start camera stream
  const startCamera = useCallback(async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Check for torch/flash capability
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities ? (videoTrack.getCapabilities() as any) : {};
        setHasFlash(!!capabilities.torch);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      let message = 'Unable to access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission was denied. Please enable camera permissions in your browser or upload a photo.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No camera device found on this system. You can upload a photo or pick a sample item below.';
      }
      setCameraError(message);
      setIsCameraActive(false);
    }
  }, [cameraFacing, stream]);

  // Toggle flash torch if supported
  const toggleFlash = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextState = !isFlashOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setIsFlashOn(nextState);
    } catch (e) {
      console.warn('Torch not supported on this track', e);
    }
  };

  // Flip facing mode
  const flipCamera = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  // Take photo from video stream
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, flip horizontally for mirror preview
    if (cameraFacing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    setPreviewImage(dataUrl);
    setPreviewMimeType('image/jpeg');
    stopCamera();
  };

  // Process uploaded or dropped image file
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, WebP, etc.).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setPreviewImage(result);
        setPreviewMimeType(file.type || 'image/jpeg');
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  // Process sample item selection
  const handleSelectSample = async (sample: SampleItem) => {
    try {
      // Fetch sample image and convert to base64
      const response = await fetch(sample.sampleImageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setPreviewImage(base64data);
        setPreviewMimeType(blob.type || 'image/jpeg');
        setUserNote(`Sample Item: ${sample.name}`);
        stopCamera();
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error('Error loading sample image:', e);
    }
  };

  // Submit captured or selected image to parent analysis
  const handleConfirmAnalysis = () => {
    if (!previewImage) return;
    onCapture(previewImage, previewMimeType, userNote.trim() || undefined);
  };

  // Retake photo
  const handleRetake = () => {
    setPreviewImage(null);
    setUserNote('');
    startCamera(cameraFacing);
  };

  // Start camera on mount if not already in preview
  useEffect(() => {
    if (!previewImage) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Hidden canvas for drawing frame */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Viewport Container */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl aspect-4/3 sm:aspect-16/10 flex flex-col items-center justify-center">
        {/* PREVIEW MODE: User captured a photo or selected an image */}
        {previewImage ? (
          <div className="relative w-full h-full flex flex-col bg-slate-900">
            <img
              src={previewImage}
              alt="Item to analyze"
              className="w-full h-full object-contain bg-black"
            />
            {/* Overlay tag */}
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-slate-100 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border border-slate-700">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Photo Ready for Sorting
            </div>

            <button
              onClick={handleRetake}
              disabled={isAnalyzing}
              className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retake
            </button>
          </div>
        ) : isCameraActive ? (
          /* ACTIVE LIVE CAMERA MODE */
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Target Reticle / Scanner Overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 border border-white/40 rounded-2xl flex items-center justify-center">
                {/* Corner markers */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />

                <span className="text-[11px] font-semibold text-white/80 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-xs">
                  Center object in frame
                </span>
              </div>
            </div>

            {/* In-view camera controls */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              {hasFlash && (
                <button
                  type="button"
                  onClick={toggleFlash}
                  className={`p-2 rounded-full backdrop-blur-sm transition-colors cursor-pointer ${
                    isFlashOn
                      ? 'bg-amber-400 text-slate-900'
                      : 'bg-black/50 text-white hover:bg-black/70'
                  }`}
                  title={isFlashOn ? 'Turn Flash Off' : 'Turn Flash On'}
                >
                  {isFlashOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
                </button>
              )}

              <button
                type="button"
                onClick={flipCamera}
                className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-colors cursor-pointer"
                title="Flip Camera"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom shutter button bar */}
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-6">
              {/* File upload shortcut */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/60 backdrop-blur-sm transition-all active:scale-95 cursor-pointer"
                title="Upload from Photo Library"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              {/* Shutter Button */}
              <button
                id="btn-take-photo"
                type="button"
                onClick={capturePhoto}
                className="w-18 h-18 rounded-full border-4 border-white bg-emerald-500 hover:bg-emerald-400 active:scale-90 transition-all flex items-center justify-center shadow-lg shadow-black/50 cursor-pointer group"
                title="Take Photo"
              >
                <div className="w-12 h-12 rounded-full bg-white group-hover:scale-95 transition-transform" />
              </button>

              {/* Empty placeholder for symmetrical balance */}
              <div className="w-11 h-11" />
            </div>
          </div>
        ) : (
          /* CAMERA INACTIVE / ERROR / FALLBACK */
          <div
            className={`w-full h-full flex flex-col items-center justify-center p-6 text-center transition-colors ${
              isDragging ? 'bg-emerald-950/40 border-2 border-dashed border-emerald-400' : 'bg-slate-900'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.[0]) {
                handleFile(e.dataTransfer.files[0]);
              }
            }}
          >
            {cameraError ? (
              <div className="max-w-sm space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <p className="text-sm text-slate-300">{cameraError}</p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => startCamera()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload File
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-sm space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 text-emerald-400 mx-auto flex items-center justify-center border border-slate-700">
                  <Camera className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Scan Recyclable Item</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Take a photo with your camera or drag and drop an image of any bottle, container, box, or packaging.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => startCamera()}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" /> Start Camera
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" /> Upload Image
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden File Input (supports mobile camera take photo or gallery) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {/* ACTION BAR: If user has a photo preview ready, prompt to analyze */}
      {previewImage && (
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Ready to Sort for {municipality.name}
              </div>
              <p className="text-xs text-slate-500">
                Gemini AI will identify materials and apply {municipality.name} municipal regulations.
              </p>
            </div>
            <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
              {municipality.streamType}
            </span>
          </div>

          {/* Optional notes input (e.g. "greasy", "has foil seal") */}
          <div className="relative">
            <input
              type="text"
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              placeholder="Optional: add detail (e.g. 'greasy inside', 'rigid plastic #5')"
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              id="btn-analyze-item"
              onClick={handleConfirmAnalysis}
              disabled={isAnalyzing}
              className="flex-1 py-3 px-4 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing with Gemini AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  Scan & Get Sorting Instructions
                </>
              )}
            </button>
            <button
              onClick={handleRetake}
              disabled={isAnalyzing}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* SAMPLE ITEMS PRESET DRAWER (Great for instant testing or when user wants to see common tricky items) */}
      <div className="bg-slate-100/80 rounded-xl p-3 border border-slate-200">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Quick Test with Common Tricky Items:
          </span>
          <span className="text-[11px] text-slate-500">Tap to load photo</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SAMPLE_PRESET_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectSample(item)}
              disabled={isAnalyzing}
              className="flex items-center gap-2 p-2 bg-white hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 rounded-lg text-left transition-all group cursor-pointer disabled:opacity-50"
            >
              <span className="text-lg shrink-0">{item.emoji}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-emerald-800">
                  {item.name}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{item.category}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
