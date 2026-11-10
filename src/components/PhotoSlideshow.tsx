import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize,
  Minimize,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';

/**
 * Cloudflare R2 Public URL configuration
 * Modify this base URL if your bucket or domain changes.
 */
export const PHOTO_BASE_URL = 'https://pub-53e20bc651c2446297f2234b29bea899.r2.dev';

export interface PhotoManifestItem {
  src: string;
  width?: number;
  height?: number;
  bytes?: number;
}

export interface PhotoSlideshowProps {
  /** Optional custom manifest URL. Defaults to `${import.meta.env.BASE_URL}photos.json` */
  manifestUrl?: string;
  /** Optional custom base URL for photos. Defaults to PHOTO_BASE_URL */
  baseUrl?: string;
  /** Slideshow interval in milliseconds. Defaults to 15000 (15s) */
  intervalMs?: number;
  /** Optional callback when user clicks close or presses Escape outside fullscreen */
  onClose?: () => void;
  /** Optional initial slide index (0-based) */
  initialIndex?: number;
  /**
   * If true, renders embedded inside a container (e.g. rounded player) rather than fixed full-viewport.
   * Fullscreen button will still expand this container to true full-screen.
   */
  embedded?: boolean;
}

/**
 * Builds the full URL for an image based on the base URL and filename.
 * In Cloudflare R2, the public domain maps directly to the bucket root,
 * so files like 'photo_00001.webp' map to `${baseUrl}/photo_00001.webp`.
 */
const buildImageUrl = (baseUrl: string, filename: string): string => {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanFile = filename.replace(/^\/+/, '');
  return `${cleanBase}/${cleanFile}`;
};

export const PhotoSlideshow: React.FC<PhotoSlideshowProps> = ({
  manifestUrl,
  baseUrl = PHOTO_BASE_URL,
  intervalMs = 15000,
  onClose,
  initialIndex = 0,
  embedded = false,
}) => {
  const [photos, setPhotos] = useState<PhotoManifestItem[]>([]);
  const [manifestLoading, setManifestLoading] = useState(true);
  const [manifestError, setManifestError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [areControlsVisible, setAreControlsVisible] = useState(true);

  // Per-photo display states:
  // We keep track of the currently rendered photo URL and an active transition
  const [displayedUrl, setDisplayedUrl] = useState<string | null>(null);
  const [isPhotoLoading, setIsPhotoLoading] = useState(true);
  const [photoError, setPhotoError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cache for preloaded Image objects to keep them in memory
  const preloadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // --------------------------------------------------------------------------
  // 1. Fetch Manifest
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isCancelled = false;
    const resolvedManifestUrl =
      manifestUrl || `${import.meta.env.BASE_URL.replace(/\/+$/, '')}/photos.json`;

    setManifestLoading(true);
    setManifestError(null);

    fetch(resolvedManifestUrl)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load manifest (${res.status} ${res.statusText}) from ${resolvedManifestUrl}`);
        }
        const contentType = res.headers.get('content-type') || '';
        const text = await res.text();

        // Check if the server returned HTML (common SPA 404 fallback or error page)
        if (text.trim().startsWith('<') || (contentType && !contentType.includes('json') && contentType.includes('html'))) {
          throw new Error(
            `Expected JSON but received HTML from "${resolvedManifestUrl}". Please ensure "photos.json" is placed in the "public/" folder.`
          );
        }

        try {
          return JSON.parse(text);
        } catch {
          throw new Error(
            `Invalid JSON received from "${resolvedManifestUrl}". Response: ${text.slice(0, 100)}...`
          );
        }
      })
      .then((data: PhotoManifestItem[]) => {
        if (isCancelled) return;
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Manifest is empty or invalid format.');
        }
        setPhotos(data);
        const safeInitial = Math.min(Math.max(0, initialIndex), data.length - 1);
        setCurrentIndex(safeInitial);
        setManifestLoading(false);
      })
      .catch((err: unknown) => {
        if (isCancelled) return;
        setManifestError(err instanceof Error ? err.message : 'Could not load photos.');
        setManifestLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [manifestUrl, initialIndex]);

  // --------------------------------------------------------------------------
  // 2. Intelligent Preloading & Current Photo Loading
  // --------------------------------------------------------------------------
  const preloadPhoto = useCallback(
    (src: string) => {
      if (!src) return;
      const fullUrl = buildImageUrl(baseUrl, src);
      if (preloadedImagesRef.current.has(fullUrl)) {
        return;
      }
      const img = new Image();
      img.src = fullUrl;
      preloadedImagesRef.current.set(fullUrl, img);
      // Keep cache size bounded to last 50 images to save memory
      if (preloadedImagesRef.current.size > 50) {
        const firstKey = preloadedImagesRef.current.keys().next().value;
        if (firstKey) {
          preloadedImagesRef.current.delete(firstKey);
        }
      }
    },
    [baseUrl]
  );

  useEffect(() => {
    if (photos.length === 0) return;

    const currentPhoto = photos[currentIndex];
    if (!currentPhoto) return;

    const fullUrl = buildImageUrl(baseUrl, currentPhoto.src);
    setPhotoError(false);

    // If already loaded / preloaded and complete:
    const cached = preloadedImagesRef.current.get(fullUrl);
    if (cached && cached.complete && cached.naturalWidth > 0) {
      setDisplayedUrl(fullUrl);
      setIsPhotoLoading(false);
    } else {
      setIsPhotoLoading(true);
      const img = new Image();
      img.src = fullUrl;
      img.onload = () => {
        preloadedImagesRef.current.set(fullUrl, img);
        setDisplayedUrl(fullUrl);
        setIsPhotoLoading(false);
      };
      img.onerror = () => {
        setPhotoError(true);
        setIsPhotoLoading(false);
      };
    }

    // Preload next image
    const nextIndex = (currentIndex + 1) % photos.length;
    if (photos[nextIndex]) {
      preloadPhoto(photos[nextIndex].src);
    }

    // Preload previous image
    const prevIndex = (currentIndex - 1 + photos.length) % photos.length;
    if (photos[prevIndex]) {
      preloadPhoto(photos[prevIndex].src);
    }
  }, [currentIndex, photos, baseUrl, preloadPhoto]);

  // --------------------------------------------------------------------------
  // 3. Navigation Handlers (resets timer)
  // --------------------------------------------------------------------------
  const goToNext = useCallback(() => {
    if (photos.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const goToPrev = useCallback(() => {
    if (photos.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // --------------------------------------------------------------------------
  // 4. Autoplay Timer (15s, single timer, resets on manual navigation)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (slideTimerRef.current) {
      clearTimeout(slideTimerRef.current);
      slideTimerRef.current = null;
    }

    if (isPlaying && !manifestLoading && photos.length > 1) {
      slideTimerRef.current = setTimeout(() => {
        goToNext();
      }, intervalMs);
    }

    return () => {
      if (slideTimerRef.current) {
        clearTimeout(slideTimerRef.current);
        slideTimerRef.current = null;
      }
    };
  }, [isPlaying, currentIndex, photos.length, manifestLoading, intervalMs, goToNext]);

  // --------------------------------------------------------------------------
  // 5. Fullscreen Toggle (using Fullscreen API on containerRef)
  // --------------------------------------------------------------------------
  const toggleFullscreen = useCallback(async () => {
    const elem = containerRef.current;
    if (!elem) return;

    try {
      if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if ((elem as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
          await (elem as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as unknown as { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen) {
          await (document as unknown as { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen();
        }
      }
    } catch {
      // Ignore fullscreen rejection (e.g. user denied or unsupported)
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // --------------------------------------------------------------------------
  // 6. Discreet Controls Inactivity Fade Out
  // --------------------------------------------------------------------------
  const resetControlsTimeout = useCallback(() => {
    setAreControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setAreControlsVisible(false);
    }, 3500);
  }, []);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  // --------------------------------------------------------------------------
  // 7. Keyboard Navigation
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not capture keys if typing inside input / textarea
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      resetControlsTimeout();

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPrev();
          break;
        case ' ': // Spacebar
          e.preventDefault();
          togglePlayPause();
          break;
        case 'Escape':
          if (document.fullscreenElement) {
            // Browser handles exiting fullscreen on Escape
          } else if (onClose) {
            onClose();
          }
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToNext, goToPrev, togglePlayPause, toggleFullscreen, onClose, resetControlsTimeout]);

  // --------------------------------------------------------------------------
  // 8. Download Deterrents (context menu + drag)
  // --------------------------------------------------------------------------
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // --------------------------------------------------------------------------
  // 9. Render Loading & Error States
  // --------------------------------------------------------------------------
  const containerClasses = embedded && !isFullscreen
    ? "relative w-full h-full min-h-[420px] md:min-h-[550px] bg-black overflow-hidden select-none flex items-center justify-center cursor-default rounded-3xl border border-white/20 shadow-2xl"
    : "fixed inset-0 z-50 bg-black overflow-hidden select-none flex items-center justify-center cursor-default";

  if (manifestLoading) {
    return (
      <div
        ref={containerRef}
        className={`${containerClasses} flex-col text-white`}
        onContextMenu={handleContextMenu}
      >
        <Loader2 className="w-10 h-10 animate-spin text-white/70 mb-4" />
        <p className="text-sm tracking-widest uppercase text-white/60 font-light">
          Loading photographs...
        </p>
      </div>
    );
  }

  if (manifestError || photos.length === 0) {
    return (
      <div
        ref={containerRef}
        className={`${containerClasses} flex-col text-white px-6 text-center`}
        onContextMenu={handleContextMenu}
      >
        <AlertCircle className="w-12 h-12 text-rose-400 mb-4 opacity-80" />
        <h2 className="text-xl font-light tracking-wide mb-2">Photographs Unavailable</h2>
        <p className="text-sm text-white/50 max-w-md mb-6">
          {manifestError || 'No photographs found in the manifest.'}
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full border border-white/20 text-white/80 hover:text-white hover:border-white/50 text-xs uppercase tracking-widest transition-colors"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 10. Main Slideshow View
  // --------------------------------------------------------------------------
  const currentPhoto = photos[currentIndex];

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
      onClick={resetControlsTimeout}
      onContextMenu={handleContextMenu}
    >
      {/* Background ambient subtle glow (optional vignette effect) */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none" />

      {/* Main Image Display with smooth fade transition */}
      <div className="relative w-full h-full flex items-center justify-center p-0 md:p-2 lg:p-4">
        {displayedUrl && (
          <img
            key={displayedUrl}
            src={displayedUrl}
            alt=""
            draggable={false}
            onDragStart={handleDragStart}
            onContextMenu={handleContextMenu}
            className={`max-w-full max-h-full w-auto h-auto object-contain transition-opacity duration-700 ease-in-out select-none ${
              isPhotoLoading ? 'opacity-40 scale-[0.99]' : 'opacity-100 scale-100'
            }`}
            style={{
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
            }}
          />
        )}

        {/* Loading Spinner overlay during individual image transition */}
        {isPhotoLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Loader2 className="w-8 h-8 animate-spin text-white/40 drop-shadow-md" />
          </div>
        )}

        {/* Error Fallback for single image load failure */}
        {photoError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60 pointer-events-none">
            <AlertCircle className="w-10 h-10 mb-2 text-rose-400/80" />
            <p className="text-xs uppercase tracking-wider">Image could not be loaded</p>
          </div>
        )}
      </div>

      {/* Transparent Click Zones on Desktop for intuitive next/previous */}
      <div
        className="absolute top-0 left-0 w-1/4 h-full cursor-pointer z-10 hidden md:block"
        onClick={(e) => {
          e.stopPropagation();
          goToPrev();
        }}
        title="Previous photo"
      />
      <div
        className="absolute top-0 right-0 w-1/4 h-full cursor-pointer z-10 hidden md:block"
        onClick={(e) => {
          e.stopPropagation();
          goToNext();
        }}
        title="Next photo"
      />

      {/* -------------------------------------------------------------------- */}
      {/* Subtle, Auto-hiding Controls Overlay                                  */}
      {/* -------------------------------------------------------------------- */}
      <div
        className={`pointer-events-none transition-opacity duration-500 ease-in-out ${
          areControlsVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top Header: Counter & Action Buttons */}
        <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex items-center justify-between z-20 pointer-events-auto bg-gradient-to-b from-black/70 via-black/30 to-transparent">
          {/* Photo Counter */}
          <div className="flex items-center gap-2">
            <span className="text-white/80 text-xs md:text-sm font-mono tracking-widest bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-sm">
              <span className="text-white font-medium">{currentIndex + 1}</span>
              <span className="text-white/40 mx-1.5">/</span>
              <span className="text-white/60">{photos.length}</span>
            </span>

            {/* Subtle Playing status pill */}
            <span
              className={`text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full border transition-colors ${
                isPlaying
                  ? 'text-emerald-300/80 border-emerald-500/30 bg-emerald-950/30'
                  : 'text-amber-300/80 border-amber-500/30 bg-amber-950/30'
              }`}
            >
              {isPlaying ? 'Auto 15s' : 'Paused'}
            </span>
          </div>

          {/* Top Right Controls: Play/Pause, Fullscreen, Optional Close */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlayPause}
              aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              className="p-2.5 rounded-full text-white/80 hover:text-white bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/10 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
              className="p-2.5 rounded-full text-white/80 hover:text-white bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/10 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                aria-label="Close slideshow"
                title="Close (Esc)"
                className="p-2.5 rounded-full text-white/80 hover:text-white bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/10 transition-all duration-200 hover:scale-105 active:scale-95 ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Previous Button (Left) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPrev();
          }}
          aria-label="Previous photograph"
          title="Previous (Left Arrow)"
          className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 pointer-events-auto p-3 md:p-3.5 rounded-full text-white/70 hover:text-white bg-black/40 hover:bg-black/80 backdrop-blur-md border border-white/10 shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        {/* Next Button (Right) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          aria-label="Next photograph"
          title="Next (Right Arrow)"
          className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 pointer-events-auto p-3 md:p-3.5 rounded-full text-white/70 hover:text-white bg-black/40 hover:bg-black/80 backdrop-blur-md border border-white/10 shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        {/* Bottom subtle progress line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 z-20">
          <div
            className="h-full bg-white/40 transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / photos.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PhotoSlideshow;

