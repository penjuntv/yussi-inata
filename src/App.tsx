import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, Save, Share2, Heart, Bookmark, Loader2, Download, 
  RefreshCw, Palette, Type, Droplet, AlertCircle, User, ArrowRight, 
  Link as LinkIcon, FileText, LayoutTemplate, Upload, Edit3,
  ListOrdered, Columns, MessageSquareQuote, Camera, AlignLeft, 
  Shapes, Hash, PenTool, CheckSquare, ChevronDown, X, Leaf
} from 'lucide-react';
import { motion } from 'motion/react';
import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

type LayoutType = 'cover-arch' | 'cover-image-full' | 'cover-split' | 'cover-minimal' | 'cover-polaroid' | 'step-list' | 'image-split' | 'quote-tip' | 'cta-minimal' | 'polaroid-focus' | 'editorial-text' | 'photo-overlay' | 'abstract-shapes' | 'bold-number' | 'continuous-line';
type InputSourceType = 'text' | 'url' | 'manual';

interface Slide {
  id: number;
  layout: LayoutType;
  stepNumber?: number;
  title?: string;
  subtitle?: string;
  content?: string | string[];
  imagePlaceholder?: string;
  customImage?: string; // For user uploaded images
  fontColor?: string;
  bgColor?: string;
}

const LAYOUTS = [
  { id: 'cover-arch', name: 'Cover (Arch)', desc: 'Elegant arch frame for covers', icon: LayoutTemplate },
  { id: 'cover-image-full', name: 'Cover (Full Image)', desc: 'Cinematic full background', icon: ImageIcon },
  { id: 'cover-split', name: 'Cover (Split)', desc: 'Modern half-and-half design', icon: Columns },
  { id: 'cover-minimal', name: 'Cover (Minimal)', desc: 'Clean typography focus', icon: Type },
  { id: 'cover-polaroid', name: 'Cover (Polaroid)', desc: 'Playful tilted photo', icon: Camera },
  { id: 'step-list', name: 'Step (List)', desc: 'Numbered steps with circle image', icon: ListOrdered },
  { id: 'image-split', name: 'Image Split', desc: 'Half image, half text', icon: Columns },
  { id: 'quote-tip', name: 'Quote / Tip', desc: 'Large text focus for quotes', icon: MessageSquareQuote },
  { id: 'polaroid-focus', name: 'Polaroid Focus', desc: 'Tilted photo frame style', icon: Camera },
  { id: 'editorial-text', name: 'Editorial Text', desc: 'Magazine style drop-cap', icon: AlignLeft },
  { id: 'photo-overlay', name: 'Photo Overlay', desc: 'Full background with glass text', icon: ImageIcon },
  { id: 'abstract-shapes', name: 'Abstract Shapes', desc: 'Overlapping color circles', icon: Shapes },
  { id: 'bold-number', name: 'Bold Number', desc: 'Giant number infographic', icon: Hash },
  { id: 'continuous-line', name: 'Continuous Line', desc: 'Elegant line art background', icon: PenTool },
  { id: 'cta-minimal', name: 'CTA (Minimal)', desc: 'Clean call-to-action ending', icon: CheckSquare },
];

const dummySlides: Slide[] = [
  { 
    id: 1, 
    layout: 'cover-arch', 
    subtitle: 'IMMIGRATION & EDUCATION',
    title: 'Starting School\nin New Zealand', 
    imagePlaceholder: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1080&auto=format&fit=crop',
    bgColor: 'var(--color-card-bg)'
  },
  { 
    id: 2, 
    layout: 'quote-tip', 
    title: 'A New Chapter in Aotearoa', 
    content: 'Navigating the NZ school system as an immigrant parent can feel overwhelming. Here is what I learned settling our three girls in Mairangi Bay.',
    bgColor: 'var(--color-card-bg-alt)'
  },
  { 
    id: 3, 
    layout: 'step-list', 
    stepNumber: 1,
    title: 'Check Your School Zone', 
    content: 'In NZ, where you live determines where your kids go to school. Always check the "in-zone" boundaries before signing a lease.', 
    imagePlaceholder: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1080&auto=format&fit=crop',
    bgColor: 'var(--color-card-bg)'
  },
  { 
    id: 4, 
    layout: 'abstract-shapes', 
    title: 'Gather Your Documents', 
    content: 'You will need passports, visas, proof of address (like a utility bill), and immunization records translated into English.', 
    imagePlaceholder: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=1080&auto=format&fit=crop',
    bgColor: 'var(--color-card-bg-alt)'
  },
  { 
    id: 5, 
    layout: 'polaroid-focus', 
    title: 'The School Visit', 
    content: 'Book a tour! It is the best way to feel the school\'s vibe. Ask about ESOL support if English is your child\'s second language.', 
    imagePlaceholder: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1080&auto=format&fit=crop',
    bgColor: 'var(--color-card-bg)'
  },
  { 
    id: 6, 
    layout: 'image-split', 
    stepNumber: 4,
    title: 'Stationery & Uniforms', 
    content: 'Most schools use specific stationery lists (often bought online via OfficeMax). Uniforms can be bought new or second-hand at the school shop.', 
    imagePlaceholder: 'https://images.unsplash.com/photo-1469522859120-e514681ea78f?q=80&w=1080&auto=format&fit=crop',
    bgColor: 'var(--color-card-bg-alt)'
  },
  { 
    id: 7, 
    layout: 'bold-number', 
    stepNumber: 5,
    title: 'Morning Tea & Lunch', 
    content: 'NZ schools usually have two breaks. Pack a "morning tea" (snack) and a lunch. Remember, many schools are "wrapper-free" to protect the environment!', 
    bgColor: 'var(--color-bold-green)'
  },
  { 
    id: 8, 
    layout: 'photo-overlay', 
    stepNumber: 6,
    title: 'Yussi\'s Tip', 
    content: 'Don\'t stress if they don\'t speak perfect English on day one. Kids adapt incredibly fast. Just give them plenty of hugs and listen to their stories after school.',
    imagePlaceholder: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1080&auto=format&fit=crop',
    bgColor: 'var(--color-card-bg-alt)'
  },
  { 
    id: 9, 
    layout: 'continuous-line', 
    subtitle: 'COMMUNITY',
    title: 'Get Involved', 
    content: 'Join the PTA or volunteer for school trips. It is a fantastic way for immigrant parents to build a local community and make friends.', 
    imagePlaceholder: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1080&auto=format&fit=crop',
    bgColor: 'var(--color-card-bg)'
  },
  { 
    id: 10, 
    layout: 'cta-minimal', 
    title: 'Was this helpful?', 
    content: ['Save this guide for your move!', 'Share with other immigrant families', 'Subscribe to MHJ for more NZ life stories'],
    bgColor: 'var(--color-card-bg-alt)'
  },
];

// --- Decorative SVG Components ---
const Squiggle = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 10C12.5 10 12.5 2 25 2C37.5 2 37.5 18 50 18C62.5 18 62.5 2 75 2C87.5 2 87.5 10 100 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

export default function App() {
  const [inputType, setInputType] = useState<InputSourceType>('text');
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const slidesRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputType !== 'manual' && !input.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate API delay for parsing text into templates
    setTimeout(() => {
      setSlides(dummySlides);
      setIsGenerating(false);
    }, 1500);
  };

  const updateSlide = (id: number, updates: Partial<Slide>) => {
    if (!slides) return;
    setSlides(slides.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleExport = async () => {
    if (!slides || !slidesRef.current) return;
    setIsExporting(true);
    try {
      const zip = new JSZip();
      const slideElements = slidesRef.current.querySelectorAll('.slide-export-target');
      
      for (let i = 0; i < slideElements.length; i++) {
        const el = slideElements[i] as HTMLElement;
        const dataUrl = await htmlToImage.toPng(el, { quality: 1.0, pixelRatio: 2 });
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
        zip.file(`slide_${i + 1}.png`, base64Data, { base64: true });
      }
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "mhj_cardnews.zip");
    } catch (error) {
      console.error("Export failed", error);
      alert("Failed to export slides. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-beige text-brand-dark font-sans selection:bg-brand-green selection:text-white pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-brand-dark/10 px-6 py-5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-baseline gap-4">
            <h1 className="text-2xl font-display font-bold text-brand-dark tracking-tight">MHJ.NZ</h1>
            <p className="text-sm font-medium text-brand-green hidden sm:block">Card News Design Engine</p>
          </div>
          {slides && !isGenerating && (
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 bg-brand-dark text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-dark/90 transition-colors disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isExporting ? 'Exporting...' : 'Download All (ZIP)'}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-10">
        {/* Input Section */}
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-brand-dark/5">
            <h2 className="text-xl font-display font-bold mb-6 text-brand-dark">Content Source</h2>
            
            {/* Source Tabs */}
            <div className="flex p-1 bg-brand-beige/50 rounded-lg mb-6">
              <button 
                onClick={() => setInputType('text')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-md transition-all ${inputType === 'text' ? 'bg-white shadow-sm text-brand-dark' : 'text-brand-dark/50 hover:text-brand-dark'}`}
              >
                <FileText className="w-4 h-4" /> Text
              </button>
              <button 
                onClick={() => setInputType('url')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-md transition-all ${inputType === 'url' ? 'bg-white shadow-sm text-brand-dark' : 'text-brand-dark/50 hover:text-brand-dark'}`}
              >
                <LinkIcon className="w-4 h-4" /> URL
              </button>
              <button 
                onClick={() => setInputType('manual')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-md transition-all ${inputType === 'manual' ? 'bg-white shadow-sm text-brand-dark' : 'text-brand-dark/50 hover:text-brand-dark'}`}
              >
                <LayoutTemplate className="w-4 h-4" /> Manual
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-5">
              {inputType === 'text' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <label className="block text-sm font-semibold text-brand-dark/80 mb-2">Paste Blog Text or Topic</label>
                  <textarea
                    rows={6}
                    className="w-full rounded-xl border border-brand-dark/20 bg-brand-beige/30 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all resize-none"
                    placeholder="e.g., 5 tips for starting school in New Zealand..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                  <p className="text-xs text-brand-dark/50 mt-2">AI will automatically parse this into 10 slides.</p>
                </motion.div>
              )}

              {inputType === 'url' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <label className="block text-sm font-semibold text-brand-dark/80 mb-2">Paste Article URL</label>
                  <input
                    type="url"
                    className="w-full rounded-xl border border-brand-dark/20 bg-brand-beige/30 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all"
                    placeholder="https://mhj.nz/blog/..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                  <p className="text-xs text-brand-dark/50 mt-2">AI will extract text and images from the link.</p>
                </motion.div>
              )}

              {inputType === 'manual' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6 border-2 border-dashed border-brand-dark/20 rounded-xl bg-brand-beige/20">
                  <LayoutTemplate className="w-8 h-8 mx-auto text-brand-dark/40 mb-2" />
                  <p className="text-sm font-medium text-brand-dark/70">Start with empty templates</p>
                  <p className="text-xs text-brand-dark/50 mt-1">Upload your own photos and type text manually.</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isGenerating || (inputType !== 'manual' && !input.trim())}
                className="w-full bg-brand-green text-white py-3 px-4 rounded-xl font-semibold hover:bg-brand-green/90 focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 focus:ring-offset-brand-beige disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Designing Templates...
                  </>
                ) : 'Generate Card News'}
              </button>
            </form>
          </div>
        </div>

        {/* Preview Section */}
        <div className="w-full lg:w-2/3">
          <div className="bg-white/50 backdrop-blur-sm p-8 rounded-3xl border border-brand-dark/5 min-h-[600px]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-display font-bold text-brand-dark">Preview & Edit</h2>
              {slides && <span className="text-sm font-semibold bg-brand-green/10 text-brand-green px-3 py-1 rounded-full">10 Slides Generated</span>}
            </div>
            
            {!slides && !isGenerating && (
              <div className="h-[400px] flex flex-col items-center justify-center text-brand-dark/40 bg-white/50 rounded-2xl border border-dashed border-brand-dark/20">
                <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                <p className="font-medium">Select a source and generate to see the template designs.</p>
              </div>
            )}

            {isGenerating && (
              <div className="h-[400px] flex flex-col items-center justify-center text-brand-green bg-white/50 rounded-2xl border border-brand-green/20">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <p className="font-medium animate-pulse">Applying Design Bible...</p>
              </div>
            )}

            {slides && !isGenerating && (
              <div ref={slidesRef} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {slides.map((slide, index) => (
                  <SlidePreview 
                    key={slide.id} 
                    slide={slide} 
                    index={index} 
                    onUpdate={(updates) => updateSlide(slide.id, updates)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function SlidePreview({ slide, index, onUpdate }: { slide: Slide; index: number; onUpdate: (u: Partial<Slide>) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdate({ customImage: url });
    }
  };

  const displayImage = slide.customImage || slide.imagePlaceholder;
  
  const renderLayout = () => {
    switch (slide.layout) {
      case 'cover-arch':
        return (
          <div className="flex flex-col h-full items-center justify-center text-center p-8 relative">
            {slide.subtitle && (
              <span className="font-sans text-[9px] tracking-[0.3em] font-semibold uppercase mb-6 text-[var(--color-card-dark)] opacity-60 shrink-0">
                {slide.subtitle}
              </span>
            )}
            <div className="w-56 h-72 rounded-t-full overflow-hidden border-[6px] border-[var(--color-card-bg)] shadow-2xl mb-8 relative z-10 bg-black/5 shrink-0">
              {displayImage && <img src={displayImage} alt="Cover" className="w-full h-full object-cover" />}
            </div>
            <h2 className="font-serif text-4xl leading-[1.1] tracking-tight text-[var(--color-card-dark)] whitespace-pre-line relative z-10 shrink-0">
              {slide.title}
            </h2>
            <Squiggle className="absolute bottom-6 left-1/2 -translate-x-1/2 w-12 text-[var(--color-card-accent)] opacity-60" />
          </div>
        );

      case 'cover-image-full':
        return (
          <div className="flex flex-col h-full relative p-10 justify-end">
            <div className="absolute inset-0">
              {displayImage && <img src={displayImage} alt="Cover" className="w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            </div>
            <div className="relative z-10 shrink-0">
              <span className="font-sans text-[10px] font-bold tracking-[0.3em] uppercase text-[var(--color-card-accent)] mb-4 block">
                {slide.subtitle || 'NEW GUIDE'}
              </span>
              <h2 className="font-serif text-4xl text-white mb-2 leading-[1.1] tracking-tight">
                {slide.title}
              </h2>
            </div>
          </div>
        );

      case 'cover-split':
        return (
          <div className="flex flex-col h-full bg-[var(--color-card-dark)]">
            <div className="h-[55%] w-full relative shrink-0">
              {displayImage && <img src={displayImage} alt="Cover" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 p-8 flex flex-col justify-center">
              <span className="font-sans text-[10px] font-bold tracking-[0.3em] uppercase text-[var(--color-card-accent)] mb-3 block shrink-0">
                {slide.subtitle || 'NEW GUIDE'}
              </span>
              <h2 className="font-serif text-4xl text-white leading-[1.1] tracking-tight shrink-0">
                {slide.title}
              </h2>
            </div>
          </div>
        );

      case 'cover-minimal':
        return (
          <div className="flex flex-col h-full p-10 justify-center relative overflow-hidden bg-[var(--color-card-bg)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-card-accent)] opacity-10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--color-shape-sage)] opacity-10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
            <span className="font-sans text-[11px] font-bold tracking-[0.4em] uppercase text-[var(--color-card-accent)] mb-6 block shrink-0 relative z-10">
              {slide.subtitle || 'NEW GUIDE'}
            </span>
            <h2 className="font-serif text-5xl text-[var(--color-card-dark)] leading-[1.1] tracking-tighter shrink-0 relative z-10">
              {slide.title}
            </h2>
            <div className="w-12 h-1 bg-[var(--color-card-accent)] mt-8 shrink-0 relative z-10" />
          </div>
        );

      case 'cover-polaroid':
        return (
          <div className="flex flex-col h-full p-10 items-center justify-center bg-[var(--color-card-bg-alt)] relative">
            <div className="w-56 h-64 bg-white p-3 shadow-xl transform -rotate-3 mb-10 z-10 shrink-0">
              <div className="w-full h-full bg-black/5">
                {displayImage && <img src={displayImage} alt="Cover" className="w-full h-full object-cover" />}
              </div>
            </div>
            <div className="text-center z-10 shrink-0 w-full">
              <span className="font-sans text-[10px] font-bold tracking-[0.3em] uppercase text-[var(--color-card-accent)] mb-3 block">
                {slide.subtitle || 'NEW GUIDE'}
              </span>
              <h2 className="font-serif text-4xl text-[var(--color-card-dark)] leading-[1.1] tracking-tight">
                {slide.title}
              </h2>
            </div>
          </div>
        );

      case 'step-list':
        return (
          <div className="flex flex-col h-full p-10 relative overflow-hidden">
            <div className="relative mb-8">
              <span className="absolute -top-6 -left-4 font-serif text-8xl text-[var(--color-card-accent)] opacity-20 leading-none select-none">
                {slide.stepNumber || index}
              </span>
              <h3 className="font-serif text-3xl text-[var(--color-card-dark)] mt-4 relative z-10 tracking-tight leading-snug">
                {slide.title}
              </h3>
            </div>
            <p className="font-sans text-[15px] leading-[1.8] text-[var(--color-card-dark)] opacity-85 mb-8 relative z-10">
              {slide.content}
            </p>
            {displayImage && (
              <div className="mt-auto self-end w-40 h-40 rounded-full overflow-hidden border-[6px] border-[var(--color-card-bg)] shadow-xl bg-black/5 relative z-10">
                <img src={displayImage} alt="Step" className="w-full h-full object-cover" />
              </div>
            )}
            <ArrowRight className="absolute bottom-12 left-10 w-6 h-6 text-[var(--color-card-dark)] opacity-40" />
          </div>
        );

      case 'image-split':
        return (
          <div className="flex flex-col h-full relative">
            <div className="h-[55%] w-full p-5 pb-0">
              <div className="w-full h-full rounded-t-[2.5rem] overflow-hidden shadow-inner bg-black/5">
                {displayImage && <img src={displayImage} alt="Split" className="w-full h-full object-cover" />}
              </div>
            </div>
            <div className="h-[45%] p-10 flex flex-col justify-center">
              {slide.stepNumber && (
                <span className="font-sans text-[10px] tracking-[0.2em] font-bold text-[var(--color-card-accent)] mb-3 uppercase">
                  Step 0{slide.stepNumber}
                </span>
              )}
              <h3 className="font-serif text-3xl text-[var(--color-card-dark)] mb-4 tracking-tight leading-tight">
                {slide.title}
              </h3>
              <p className="font-sans text-[14px] leading-[1.7] text-[var(--color-card-dark)] opacity-80">
                {slide.content}
              </p>
            </div>
          </div>
        );

      case 'quote-tip':
        return (
          <div className="flex flex-col h-full items-center justify-center text-center p-12 relative">
            <span className="font-serif text-[120px] text-[var(--color-card-accent)] opacity-15 absolute top-4 left-6 leading-none select-none">
              “
            </span>
            <h3 className="font-sans text-[10px] font-bold tracking-[0.25em] uppercase text-[var(--color-card-accent)] mb-8 relative z-10">
              {slide.title}
            </h3>
            <p className="font-serif text-[26px] leading-[1.5] text-[var(--color-card-dark)] relative z-10 italic">
              {slide.content}
            </p>
            <span className="font-serif text-[120px] text-[var(--color-card-accent)] opacity-15 absolute bottom-[-40px] right-6 leading-none select-none rotate-180">
              “
            </span>
          </div>
        );

      case 'cta-minimal':
        return (
          <div className="flex flex-col h-full items-center justify-center text-center p-10">
            <h3 className="font-serif text-4xl text-[var(--color-card-dark)] mb-8 tracking-tight leading-tight">
              {slide.title}
            </h3>
            {Array.isArray(slide.content) && (
              <div className="space-y-4 mb-10 w-full max-w-[85%]">
                {slide.content.map((item, i) => (
                  <div key={i} className="font-sans text-[15px] font-medium text-[var(--color-card-dark)] opacity-85 border-b border-[var(--color-card-dark)]/10 pb-3">
                    {item}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2 flex flex-col items-center gap-3 text-[var(--color-card-dark)] opacity-70">
              <Bookmark className="w-8 h-8" strokeWidth={1.5} />
              <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em]">Save for later</span>
            </div>
          </div>
        );

      case 'polaroid-focus':
        return (
          <div className="flex flex-col h-full items-center justify-center p-10 relative">
            <div className="w-full aspect-square bg-white p-4 pb-12 shadow-2xl mb-8 transform -rotate-2 border border-black/5 relative z-10 transition-transform hover:rotate-0 duration-500">
              <div className="w-full h-full bg-black/5 overflow-hidden">
                {displayImage && <img src={displayImage} alt="Focus" className="w-full h-full object-cover" />}
              </div>
            </div>
            <h3 className="font-serif text-3xl text-[var(--color-card-dark)] text-center mb-4 px-4 tracking-tight leading-tight">
              {slide.title}
            </h3>
            <p className="font-sans text-[14px] leading-[1.7] text-[var(--color-card-dark)] opacity-80 text-center px-4">
              {slide.content}
            </p>
            <Leaf className="absolute top-10 right-10 w-12 h-12 text-[var(--color-card-accent)] opacity-20 transform rotate-45" />
          </div>
        );

      case 'editorial-text':
        return (
          <div className="flex flex-col h-full p-12 relative justify-center">
            <Leaf className="absolute top-12 right-10 w-32 h-32 text-[var(--color-card-accent)] opacity-[0.07] transform -rotate-12" />
            <h3 className="font-serif text-[2.25rem] text-[var(--color-card-dark)] mb-10 border-b border-[var(--color-card-dark)]/15 pb-8 leading-[1.15] tracking-tight">
              {slide.title}
            </h3>
            <div className="font-sans text-[15px] leading-[2.1] text-[var(--color-card-dark)] opacity-90 relative">
              <span className="float-left text-[5.5rem] font-serif text-[var(--color-card-accent)] leading-[0.7] pr-5 pt-3 select-none">
                {typeof slide.content === 'string' ? slide.content.charAt(0) : ''}
              </span>
              {typeof slide.content === 'string' ? slide.content.substring(1) : slide.content}
            </div>
          </div>
        );

      case 'photo-overlay':
        return (
          <div className="flex flex-col h-full relative">
            <div className="absolute inset-0 bg-black/10">
              {displayImage && <img src={displayImage} alt="Background" className="w-full h-full object-cover" />}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
            <div className="relative z-10 mt-auto p-8 w-full">
              <div className="bg-[var(--color-card-bg)]/95 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-white/40">
                {slide.stepNumber && (
                  <span className="inline-block font-sans text-[10px] font-bold tracking-[0.2em] uppercase text-white bg-[var(--color-card-accent)] px-3 py-1.5 rounded-full mb-4 shadow-sm">
                    Tip 0{slide.stepNumber}
                  </span>
                )}
                <h3 className="font-serif text-3xl text-[var(--color-card-dark)] mb-4 leading-tight tracking-tight">
                  {slide.title}
                </h3>
                <p className="font-sans text-[14.5px] leading-[1.7] text-[var(--color-card-dark)] opacity-85">
                  {slide.content}
                </p>
              </div>
            </div>
          </div>
        );

      case 'abstract-shapes':
        return (
          <div className="flex flex-col h-full p-8 relative overflow-hidden justify-center items-center">
            {/* Abstract Shapes */}
            <div className="absolute top-1/4 -left-4 w-40 h-40 rounded-full bg-[var(--color-shape-peach)] opacity-90 mix-blend-multiply"></div>
            <div className="absolute bottom-1/3 right-4 w-32 h-32 rounded-full bg-[var(--color-shape-sage)] opacity-90 mix-blend-multiply"></div>
            <div className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full bg-[var(--color-shape-blue)] opacity-50 mix-blend-multiply -translate-x-1/2 -translate-y-1/2"></div>
            
            <h3 className="font-serif text-3xl text-[var(--color-card-dark)] z-10 text-center mb-6 tracking-tight leading-[1.15] shrink-0">
              {slide.title}
            </h3>
            
            <div className="w-48 h-56 z-10 shadow-2xl bg-white p-2 transform rotate-2 transition-transform hover:rotate-0 shrink-0">
              <div className="w-full h-full bg-black/5 overflow-hidden">
                {displayImage && <img src={displayImage} alt="Abstract" className="w-full h-full object-cover" />}
              </div>
            </div>
            
            <p className="font-sans text-[13px] leading-[1.6] text-[var(--color-card-dark)] opacity-90 z-10 text-center mt-6 max-w-[90%] italic shrink-0">
              {slide.content}
            </p>
          </div>
        );

      case 'bold-number':
        return (
          <div className="flex flex-col h-full p-10 relative overflow-hidden" style={{ backgroundColor: slide.bgColor === 'var(--color-card-bg)' ? 'var(--color-bold-green)' : slide.bgColor }}>
            <div className="flex-1 relative z-10">
              <span className="block font-sans font-bold text-[8rem] leading-none text-[var(--color-bold-yellow)] mb-2 tracking-tighter">
                {slide.stepNumber || index}
              </span>
              <h3 className="font-sans font-bold text-4xl text-white mb-6 leading-[1.1] tracking-tight">
                {slide.title}
              </h3>
              <p className="font-sans text-[16px] font-medium leading-relaxed text-white/90">
                {slide.content}
              </p>
            </div>
            {/* Geometric Accent */}
            <svg className="absolute bottom-[-20px] right-[-20px] w-56 h-56 text-black/10" viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="12" />
              <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="12" />
            </svg>
          </div>
        );

      case 'continuous-line':
        return (
          <div className="flex flex-col h-full items-center justify-center p-8 relative overflow-hidden">
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 400 500" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M-50 250 C 100 100, 300 400, 450 200" stroke="var(--color-card-accent)" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
              <path d="M-50 400 C 150 450, 250 50, 450 150" stroke="var(--color-card-accent)" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
            </svg>
            
            <h3 className="font-sans text-[10px] tracking-[0.3em] font-bold uppercase text-[var(--color-card-dark)] opacity-60 mb-8 relative z-10">
              {slide.subtitle || 'New Collection'}
            </h3>
            
            <div className="w-64 h-64 rounded-full overflow-hidden border-[2px] border-[var(--color-card-accent)] p-2 relative z-10 mb-8">
              <div className="w-full h-full rounded-full overflow-hidden bg-black/5">
                {displayImage && <img src={displayImage} alt="Line Art" className="w-full h-full object-cover" />}
              </div>
            </div>
            
            <h2 className="font-serif text-3xl text-[var(--color-card-dark)] text-center relative z-10 tracking-tight">
              {slide.title}
            </h2>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-2 group">
      {/* Editor Controls */}
      <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-brand-dark/10 text-xs shadow-sm">
        <div className="flex items-center gap-2">
          {/* Layout Switcher Button */}
          <button 
            onClick={() => setIsLayoutModalOpen(true)}
            className="flex items-center gap-2 bg-brand-beige/50 hover:bg-brand-beige border border-brand-dark/10 rounded px-3 py-1.5 text-brand-dark font-medium transition-colors"
          >
            <LayoutTemplate className="w-4 h-4" />
            {LAYOUTS.find(l => l.id === slide.layout)?.name || 'Select Layout'}
            <ChevronDown className="w-3 h-3 opacity-50" />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Image Upload Button (only show if layout supports image) */}
          {slide.layout !== 'quote-tip' && slide.layout !== 'cta-minimal' && slide.layout !== 'editorial-text' && slide.layout !== 'bold-number' && (
            <>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 text-brand-dark/70 hover:text-brand-dark transition-colors"
                title="Upload Custom Image"
              >
                <Upload className="w-3 h-3" /> Photo
              </button>
            </>
          )}

          {/* Edit Text Button */}
          <button 
            onClick={() => setIsEditingText(!isEditingText)}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${isEditingText ? 'bg-brand-green text-white' : 'hover:bg-gray-100 text-brand-dark/70 hover:text-brand-dark'}`}
            title="Edit Text"
          >
            <Edit3 className="w-3 h-3" /> Text
          </button>

          {/* Background Color Toggle */}
          <div className="flex items-center gap-1 px-1" title="Background Color">
            <Palette className="w-3 h-3 text-brand-dark/50" />
            <input 
              type="color" 
              value={slide.bgColor === 'var(--color-card-bg)' ? '#F5EFE6' : (slide.bgColor || '#E8DCCB')} 
              onChange={(e) => onUpdate({ bgColor: e.target.value })}
              className="w-5 h-5 rounded cursor-pointer border-0 p-0"
            />
          </div>
        </div>
      </div>

      {/* Slide Container */}
      <div className="slide-export-target relative w-full aspect-[4/5] overflow-hidden shadow-md border border-brand-dark/10 transition-colors duration-300"
           style={{ backgroundColor: slide.bgColor }}>
        
        {/* Slide Number Badge (visible in editor, hidden on export via CSS if needed) */}
        <div className="absolute top-4 right-4 text-[var(--color-card-dark)] text-[10px] font-sans font-bold px-2 py-1 z-20 tracking-widest opacity-30">
          {index + 1} / 10
        </div>

        {/* Layout Library Modal */}
        {isLayoutModalOpen && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-[60] p-6 flex flex-col overflow-hidden border-4 border-brand-green/20">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-brand-dark/10 shrink-0">
              <h4 className="font-bold text-lg text-brand-dark flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5" /> Template Library
              </h4>
              <button 
                onClick={() => setIsLayoutModalOpen(false)} 
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-brand-dark" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-2 -mr-2">
              <div className="grid grid-cols-2 gap-3">
                {LAYOUTS.map(layout => {
                  const Icon = layout.icon;
                  const isActive = slide.layout === layout.id;
                  return (
                    <button
                      key={layout.id}
                      onClick={() => {
                        onUpdate({ layout: layout.id as LayoutType });
                        setIsLayoutModalOpen(false);
                      }}
                      className={`flex flex-col text-left p-3 rounded-xl border-2 transition-all ${isActive ? 'border-brand-green bg-brand-green/5' : 'border-brand-dark/10 hover:border-brand-green/50 hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`p-1.5 rounded-md ${isActive ? 'bg-brand-green text-white' : 'bg-brand-dark/5 text-brand-dark'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm text-brand-dark">{layout.name}</span>
                      </div>
                      <span className="text-[10px] text-brand-dark/60 leading-tight">{layout.desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Text Editing Overlay */}
        {isEditingText && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 p-6 flex flex-col gap-4 overflow-y-auto border-4 border-brand-green/20">
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-brand-dark/10">
              <h4 className="font-bold text-sm text-brand-dark flex items-center gap-2">
                <Edit3 className="w-4 h-4" /> Edit Slide Content
              </h4>
              <button 
                onClick={() => setIsEditingText(false)} 
                className="bg-brand-green text-white px-3 py-1 rounded text-xs font-bold hover:bg-brand-green/90"
              >
                Done
              </button>
            </div>
            
            <div className="space-y-4">
              {slide.layout === 'step-list' || slide.layout === 'image-split' || slide.layout === 'photo-overlay' || slide.layout === 'bold-number' ? (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-1">Step Number</label>
                  <input 
                    type="number" 
                    value={slide.stepNumber || ''} 
                    onChange={e => onUpdate({ stepNumber: parseInt(e.target.value) || undefined })} 
                    className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none" 
                    placeholder="e.g. 1" 
                  />
                </div>
              ) : null}

              {slide.layout.startsWith('cover-') || slide.layout === 'continuous-line' ? (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-1">Subtitle / Category</label>
                  <input 
                    type="text" 
                    value={slide.subtitle || ''} 
                    onChange={e => onUpdate({ subtitle: e.target.value })} 
                    className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none" 
                    placeholder="e.g. TRAVEL GUIDE" 
                  />
                </div>
              ) : null}

              <div>
                <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-1">Main Title</label>
                <textarea 
                  value={slide.title || ''} 
                  onChange={e => onUpdate({ title: e.target.value })} 
                  className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none resize-none" 
                  placeholder="Enter title..." 
                  rows={2}
                />
              </div>

              {slide.layout !== 'cover-arch' && slide.layout !== 'continuous-line' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-1">Body Content</label>
                  <textarea 
                    value={typeof slide.content === 'string' ? slide.content : (Array.isArray(slide.content) ? slide.content.join('\n') : '')} 
                    onChange={e => {
                      const val = e.target.value;
                      onUpdate({ content: slide.layout === 'cta-minimal' ? val.split('\n') : val });
                    }} 
                    className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none resize-none" 
                    placeholder={slide.layout === 'cta-minimal' ? "Enter items (one per line)" : "Enter body text..."} 
                    rows={5}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Render the specific layout */}
        {renderLayout()}
      </div>
    </div>
  );
}

