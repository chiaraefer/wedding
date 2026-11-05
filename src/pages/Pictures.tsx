import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Home, X, ChevronLeft, ChevronRight, Play, Film, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import LanguageSelector from '@/components/LanguageSelector';

// REPLACE THESE WITH YOUR ACTUAL CLOUDINARY URLS
const GALLERY_IMAGES = [
  { id: 1, src: 'https://i.imgur.com/HUJXAFf.jpeg', alt: 'Wedding moment 1' },
  { id: 2, src: 'https://i.imgur.com/JdtoZzb.jpeg', alt: 'Wedding moment 2' },
  { id: 3, src: 'https://i.imgur.com/LdNKreo.jpeg', alt: 'Wedding moment 3' },
  { id: 4, src: 'https://i.imgur.com/lmB8K4X.jpeg', alt: 'Wedding moment 4' },
  { id: 5, src: 'https://i.imgur.com/j7X6MMG.jpeg', alt: 'Wedding moment 5' },
  { id: 6, src: 'https://i.imgur.com/AQGaHOV.jpeg', alt: 'Wedding moment 6' },
  { id: 7, src: 'https://i.imgur.com/XpAcVLw.jpeg', alt: 'Wedding moment 7' },
  { id: 8, src: 'https://i.imgur.com/aBSbUod.jpeg', alt: 'Wedding moment 8' },
  { id: 9, src: 'https://i.imgur.com/jpXdRy7.jpeg', alt: 'Wedding moment 9' },
  { id: 10, src: 'https://i.imgur.com/KUecNJH.jpeg', alt: 'Wedding moment 10' },
];

const VIDEO_URL = 'https://pub-e9a9c73a3a684a2b88b5685f667cb0e0.r2.dev/TRAILER.mp4';

const Pictures = () => {
  const { language } = useLanguage();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const titles: Record<string, string> = {
    es: 'Nuestros Recuerdos',
    it: 'I Nostri Ricordi',
    scn: 'Li Nostri Ricordi',
    en: 'Our Memories',
  };

  const descriptions: Record<string, string> = {
    es: 'Revive el tráiler de nuestro gran día y explora los momentos más especiales.',
    it: 'Rivivi il trailer del nostro grande giorno ed esplora i momenti più speciali.',
    scn: 'Rivivi lu trailer dû nostru granni jornu e talia li mumenti cchiù beddi.',
    en: 'Relive the trailer of our special day and explore our favorite moments.',
  };

  const videoBadge: Record<string, string> = {
    es: 'Tráiler Oficial',
    it: 'Trailer Ufficiale',
    scn: 'Trailer Ufficiali',
    en: 'Official Trailer',
  };

  const photoSectionTitle: Record<string, string> = {
    es: 'Galería de Fotos',
    it: 'Galleria Fotografica',
    scn: 'Gallarìa Fotugràfica',
    en: 'Photo Highlights',
  };

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedImageIndex(null);
    document.body.style.overflow = 'auto';
  };

  const showNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex + 1) % GALLERY_IMAGES.length);
    }
  };

  const showPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-romantic py-16 md:py-24 flex flex-col relative">
      {/* Navigation Buttons */}
      <div className="fixed top-4 left-4 z-40">
        <Link to="/">
          <Button variant="outline" size="sm" className="bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background">
            <Home className="w-4 h-4 mr-2" />
            {language === 'es' ? 'Inicio' :
              language === 'it' ? 'Home' :
                language === 'scn' ? 'Casa' :
                  'Home'}
          </Button>
        </Link>
      </div>

      <div className="fixed top-4 right-4 z-40">
        <LanguageSelector />
      </div>

      <div className="container mx-auto px-4 flex-1 flex flex-col z-10 max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wider uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Wedding Film & Photos</span>
          </div>
          <h1 className="font-script text-5xl md:text-7xl lg:text-8xl text-primary mb-4 drop-shadow-sm">
            {titles[language] || titles.en}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            {descriptions[language] || descriptions.en}
          </p>
        </div>

        {/* Hero Video Section */}
        <div className="mb-16 md:mb-20">
          <div className="relative group rounded-3xl overflow-hidden shadow-2xl border border-white/40 bg-black/90 aspect-video md:aspect-[21/9] max-h-[600px] w-full">
            <video
              className="w-full h-full object-cover"
              src={VIDEO_URL}
              autoPlay
              muted
              loop
              playsInline
              controls
            />
            {/* Top video label */}
            <div className="absolute top-4 left-4 pointer-events-none flex items-center gap-2 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-white text-xs font-medium tracking-wide">
              <Film className="w-3.5 h-3.5 text-primary" />
              <span>{videoBadge[language] || videoBadge.en}</span>
            </div>
          </div>
        </div>

        {/* Photos Header & External Link */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-4 border-b border-foreground/10">
          <div>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground">
              {photoSectionTitle[language] || photoSectionTitle.en}
            </h2>
            <p className="text-sm text-muted-foreground">
              {GALLERY_IMAGES.length} {language === 'es' ? 'fotos destacadas' : language === 'it' ? 'foto in evidenza' : 'featured photos'}
            </p>
          </div>

          {/* Google Photos Album Link (Dots App removed) */}
          <a
            href="https://photos.app.goo.gl/KbzzFF91UNkQKc9F9"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white/90 backdrop-blur-md border border-white/60 shadow-sm hover:shadow-md rounded-2xl px-4 py-2.5 hover:scale-[1.02] transition-all duration-200 w-full sm:w-auto"
          >
            <img
              src="https://logos-world.net/wp-content/uploads/2022/05/Google-Photos-Logo.png"
              alt="Google Photos"
              className="h-6 w-auto object-contain flex-shrink-0"
            />
            <div className="text-left pr-1">
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide leading-tight">
                {language === 'es' ? 'Álbum completo en' : language === 'it' ? 'Album completo su' : language === 'scn' ? 'Àlbum cumpletu nta' : 'Full album on'}
              </p>
              <p className="text-xs md:text-sm font-bold text-foreground leading-tight">Google Photos →</p>
            </div>
          </a>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
          {GALLERY_IMAGES.map((img, index) => (
            <div
              key={img.id}
              className={`relative overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group bg-muted ${
                index % 5 === 0 ? 'sm:col-span-2 sm:row-span-2 aspect-[4/3] sm:aspect-square' : 'aspect-square'
              }`}
              onClick={() => openLightbox(index)}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                <span className="text-white text-xs md:text-sm font-medium tracking-wide bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
                  {img.alt}
                </span>
                <span className="text-white text-xs bg-black/40 px-2.5 py-1 rounded-full">
                  #{index + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox / Slideshow */}
      {selectedImageIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 md:top-6 md:right-6 text-white/70 hover:text-white p-2.5 rounded-full hover:bg-white/10 transition-colors z-50"
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            <X className="w-7 h-7" />
          </button>

          {/* Previous Button */}
          <button
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors z-50"
            onClick={showPrev}
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
          </button>

          {/* Main Image */}
          <div className="w-full h-full p-4 md:p-12 flex items-center justify-center">
            <img
              src={GALLERY_IMAGES[selectedImageIndex].src}
              alt={GALLERY_IMAGES[selectedImageIndex].alt}
              className="max-w-full max-h-full object-contain rounded-lg drop-shadow-2xl select-none"
              onClick={(e) => e.stopPropagation()} // Prevent clicking image from closing lightbox
            />
          </div>

          {/* Next Button */}
          <button
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors z-50"
            onClick={showNext}
            aria-label="Next photo"
          >
            <ChevronRight className="w-8 h-8 md:w-10 md:h-10" />
          </button>

          {/* Image Counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 font-medium tracking-widest text-xs md:text-sm bg-black/40 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10">
            {selectedImageIndex + 1} / {GALLERY_IMAGES.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default Pictures;
