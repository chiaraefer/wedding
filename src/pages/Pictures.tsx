import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Home, Film, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import LanguageSelector from '@/components/LanguageSelector';
import { PhotoSlideshow } from '@/components/PhotoSlideshow';

const VIDEO_URL = 'https://pub-e9a9c73a3a684a2b88b5685f667cb0e0.r2.dev/TRAILER.mp4';
const PHOTO_BASE_URL = 'https://pub-53e20bc651c2446297f2234b29bea899.r2.dev';

const isAllowedPhoto = (photo: { src: string }) => {
  const match = photo.src.match(/photo_0*(\d+)\.webp/);
  if (!match) return true;
  const num = parseInt(match[1], 10);
  // Exclude range 800 -> 900
  return num < 800 || num > 900;
};

const Pictures = () => {
  const { language } = useLanguage();

  const titles: Record<string, string> = {
    es: 'Nuestros Recuerdos',
    it: 'I Nostri Ricordi',
    scn: 'Li Nostri Ricordi',
    en: 'Our Memories',
  };

  const descriptions: Record<string, string> = {
    es: 'Revive el tráiler de nuestro gran día y disfruta del pase fotográfico oficial.',
    it: 'Rivivi il trailer del nostro grande giorno e goditi la proiezione fotografica ufficiale.',
    scn: 'Rivivi lu trailer dû nostru granni jornu e talia la pruiezzioni fotugràfica ufficiali.',
    en: 'Relive the trailer of our special day and enjoy our official photographic slideshow.',
  };

  const videoBadge: Record<string, string> = {
    es: 'Tráiler Oficial',
    it: 'Trailer Ufficiale',
    scn: 'Trailer Ufficiali',
    en: 'Official Trailer',
  };

  const photoSectionTitle: Record<string, string> = {
    es: 'Pase de Fotografías',
    it: 'Proiezione Fotografica',
    scn: 'Pruiezzioni Fotugràfica',
    en: 'Photo Slideshow',
  };

  const photoSectionSubtitle: Record<string, string> = {
    es: 'Pase cinematográfico a pantalla completa de todos los momentos de la boda',
    it: 'Proiezione cinematografica a schermo intero di tutti i momenti del matrimonio',
    scn: 'Pruiezzioni cinematugràfica a schermu interu di tutti li mumenti dû matrimoniu',
    en: 'Cinematic full-screen presentation of our wedding photographs',
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
            <span>Wedding Film & Photographs</span>
          </div>
          <h1 className="font-script text-5xl md:text-7xl lg:text-8xl text-primary mb-4 drop-shadow-sm">
            {titles[language] || titles.en}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            {descriptions[language] || descriptions.en}
          </p>
        </div>

        {/* Hero Video Section */}
        <div className="mb-14 md:mb-16">
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-foreground/10">
          <div>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground">
              {photoSectionTitle[language] || photoSectionTitle.en}
            </h2>
            <p className="text-sm text-muted-foreground">
              {photoSectionSubtitle[language] || photoSectionSubtitle.en}
            </p>
          </div>

          {/* Google Photos Album Link */}
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

        {/* Slideshow Component (replaces the old pictures grid) */}
        <div className="w-full aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/9] max-h-[780px] mb-12">
          <PhotoSlideshow
            embedded={true}
            baseUrl={PHOTO_BASE_URL}
            initialIndex={240}
            filterPhoto={isAllowedPhoto}
          />
        </div>
      </div>
    </div>
  );
};

export default Pictures;
