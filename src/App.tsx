import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, Save, Share2, Heart, Bookmark, Loader2, Download, 
  RefreshCw, Palette, Type, Droplet, AlertCircle, User, ArrowRight, 
  Link as LinkIcon, FileText, LayoutTemplate, Upload, Edit3,
  ListOrdered, Columns, MessageSquareQuote, Camera, AlignLeft, 
  Shapes, Hash, PenTool, CheckSquare, ChevronDown, X, Leaf,
  PieChart, BarChart3, LayoutGrid, Library, MessageCircle, Send, ArrowDown, Undo2, Redo2
} from 'lucide-react';
import { motion } from 'motion/react';
import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { GoogleGenAI } from "@google/genai";
import { Koru, SilverFern, Kiwi, Mountain, Squiggle, NZMap, SouthernCross, BookOpen, SunRays, OrganicBlob } from './components/NZIcons';

type LayoutType = 'cover-arch' | 'cover-image-full' | 'cover-split' | 'cover-minimal' | 'cover-polaroid' | 'step-list' | 'image-split' | 'quote-tip' | 'cta-minimal' | 'polaroid-focus' | 'editorial-text' | 'photo-overlay' | 'abstract-shapes' | 'bold-number' | 'continuous-line' | 'info-stat-grid' | 'info-bar-chart' | 'info-donut-chart' | 'magazine-cover' | 'neo-brutalism' | 'social-quote';
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
  imageFilter?: string; // CSS filter for the image
  textOutline?: 'none' | 'light' | 'dark'; // Text outline effect
  textBackground?: 'none' | 'glass-light' | 'glass-dark' | 'solid-light' | 'solid-dark'; // Text background box
  fontTheme?: 'modern' | 'editorial' | 'tech'; // Font pairing theme
  globalTexture?: 'none' | 'noise' | 'paper'; // Global texture overlay
  fontColor?: string;
  bgColor?: string;
  accentIcon?: 'squiggle' | 'leaf' | 'koru' | 'fern' | 'kiwi' | 'mountain' | 'nzmap' | 'southerncross' | 'book' | 'sun' | 'blob';
}

const IMAGE_FILTERS = [
  { id: 'none', name: 'Normal', style: 'none' },
  { id: 'grayscale', name: 'Grayscale', style: 'grayscale(100%)' },
  { id: 'sepia', name: 'Sepia', style: 'sepia(100%)' },
  { id: 'blur', name: 'Blur', style: 'blur(4px)' },
  { id: 'darken', name: 'Darken', style: 'brightness(70%)' },
  { id: 'lighten', name: 'Lighten', style: 'brightness(130%)' },
  { id: 'vibrant', name: 'Vibrant', style: 'saturate(200%)' },
  { id: 'contrast', name: 'High Contrast', style: 'contrast(150%)' },
];

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
  { id: 'info-stat-grid', name: 'Stats Grid', desc: 'Key numbers in a grid', icon: LayoutGrid },
  { id: 'info-bar-chart', name: 'Bar Chart', desc: 'Minimalist horizontal bars', icon: BarChart3 },
  { id: 'info-donut-chart', name: 'Donut Chart', desc: 'Large circular metric', icon: PieChart },
  { id: 'magazine-cover', name: 'Magazine Cover', desc: 'High-end editorial look', icon: LayoutTemplate },
  { id: 'neo-brutalism', name: 'Neo-Brutalism', desc: 'Bold borders and shadows', icon: Shapes },
  { id: 'social-quote', name: 'Social Quote', desc: 'Twitter/Threads style post', icon: MessageCircle },
  { id: 'cta-minimal', name: 'CTA (Minimal)', desc: 'Clean call-to-action ending', icon: CheckSquare },
];

const dummySlides: Slide[] = [
  { 
    id: 1, 
    layout: 'cover-arch', 
    subtitle: 'IMMIGRATION & EDUCATION',
    title: 'Starting School\nin New Zealand', 
    imagePlaceholder: 'https://picsum.photos/seed/school/1080/1080',
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
    imagePlaceholder: 'https://picsum.photos/seed/schoolzone/1080/1080',
    bgColor: 'var(--color-card-bg)'
  },
  { 
    id: 4, 
    layout: 'abstract-shapes', 
    title: 'Gather Your Documents', 
    content: 'You will need passports, visas, proof of address (like a utility bill), and immunization records translated into English.', 
    imagePlaceholder: 'https://picsum.photos/seed/kids/1080/1080',
    bgColor: 'var(--color-card-bg-alt)'
  },
  { 
    id: 5, 
    layout: 'polaroid-focus', 
    title: 'The School Visit', 
    content: 'Book a tour! It is the best way to feel the school\'s vibe. Ask about ESOL support if English is your child\'s second language.', 
    imagePlaceholder: 'https://picsum.photos/seed/tour/1080/1080',
    bgColor: 'var(--color-card-bg)'
  },
  { 
    id: 6, 
    layout: 'image-split', 
    stepNumber: 4,
    title: 'Stationery & Uniforms', 
    content: 'Most schools use specific stationery lists (often bought online via OfficeMax). Uniforms can be bought new or second-hand at the school shop.', 
    imagePlaceholder: 'https://picsum.photos/seed/uniforms/1080/1080',
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
    imagePlaceholder: 'https://picsum.photos/seed/family/1080/1080',
    bgColor: 'var(--color-card-bg-alt)'
  },
  { 
    id: 9, 
    layout: 'continuous-line', 
    subtitle: 'COMMUNITY',
    title: 'Get Involved', 
    content: 'Join the PTA or volunteer for school trips. It is a fantastic way for immigrant parents to build a local community and make friends.', 
    imagePlaceholder: 'https://picsum.photos/seed/volunteer/1080/1080',
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

const NZ_IMAGES = [
  // Nature & Landmarks
  'https://picsum.photos/seed/milford/1080/1080', // Milford Sound
  'https://picsum.photos/seed/mountcook/1080/1080', // Mount Cook
  'https://picsum.photos/seed/rotorua/1080/1080', // Rotorua
  'https://picsum.photos/seed/queenstown/1080/1080', // Queenstown
  'https://picsum.photos/seed/ferns/1080/1080', // Ferns
  'https://picsum.photos/seed/sheep/1080/1080', // Sheep/Farm
  'https://picsum.photos/seed/campervan/1080/1080', // Campervan/Roadtrip
  
  // Education & Kids
  'https://picsum.photos/seed/kidslearning/1080/1080', // Kids learning
  'https://picsum.photos/seed/childoutdoors/1080/1080', // Child outdoors
  'https://picsum.photos/seed/childreading/1080/1080', // Child reading
  'https://picsum.photos/seed/classroom/1080/1080', // School/Classroom
  
  // City & Lifestyle
  'https://picsum.photos/seed/auckland/1080/1080', // Auckland City
  'https://picsum.photos/seed/wellington/1080/1080', // Wellington
  'https://picsum.photos/seed/cafe/1080/1080', // Cafe/Lifestyle
  'https://picsum.photos/seed/family/1080/1080', // Family walking
  'https://picsum.photos/seed/maori/1080/1080', // Maori carving
];

const NZ_ACCENTS = [
  { id: 'squiggle', name: 'Squiggle', component: Squiggle },
  { id: 'leaf', name: 'Leaf', component: Leaf },
  { id: 'koru', name: 'Koru', component: Koru },
  { id: 'fern', name: 'Silver Fern', component: SilverFern },
  { id: 'kiwi', name: 'Kiwi Bird', component: Kiwi },
  { id: 'mountain', name: 'Mountains', component: Mountain },
  { id: 'nzmap', name: 'NZ Map', component: NZMap },
  { id: 'southerncross', name: 'Southern Cross', component: SouthernCross },
  { id: 'book', name: 'Education', component: BookOpen },
  { id: 'sun', name: 'Sun Rays', component: SunRays },
  { id: 'blob', name: 'Organic Blob', component: OrganicBlob },
];

export default function App() {
  const [inputType, setInputType] = useState<InputSourceType>('text');
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [past, setPast] = useState<Slide[][]>([]);
  const [future, setFuture] = useState<Slide[][]>([]);
  const slidesRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputType !== 'manual' && !input.trim()) return;
    
    setIsGenerating(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `
You are an expert presentation and social media card designer.
Create a sequence of slides based on the following input.
The input might be a text description or a URL. If it's a URL, extract the main points from it.

Input:
${input}

Generate a JSON array of slide objects. Each object must conform to this interface:
interface Slide {
  id: number; // sequential number starting from 1
  layout: 'cover-arch' | 'cover-image-full' | 'cover-split' | 'cover-minimal' | 'cover-polaroid' | 'step-list' | 'image-split' | 'quote-tip' | 'magazine-cover' | 'neo-brutalism' | 'social-quote' | 'cta-minimal' | 'polaroid-focus' | 'editorial-text' | 'photo-overlay' | 'abstract-shapes' | 'bold-number' | 'continuous-line' | 'info-stat-grid' | 'info-bar-chart' | 'info-donut-chart';
  stepNumber?: number;
  title?: string;
  subtitle?: string;
  content?: string | string[]; // For info-stat-grid and info-bar-chart, provide an array of strings like ["Value1", "Label1", "Value2", "Label2"].
  imagePlaceholder?: string; // MUST be a valid URL like "https://picsum.photos/seed/{keyword}/1080/1080" where {keyword} is a relevant single word.
  fontTheme?: 'modern' | 'editorial' | 'tech';
  textBackground?: 'none' | 'glass-light' | 'glass-dark' | 'solid-light' | 'solid-dark';
  globalTexture?: 'none' | 'noise' | 'paper';
  bgColor?: string; // optional hex color
}

Rules:
- Generate 4 to 8 slides.
- The first slide should usually be a cover layout.
- The last slide should usually be a CTA or summary.
- Choose layouts that best fit the content.
- Provide concise, impactful text for titles and content.
- Return ONLY the raw JSON array. Do not include markdown formatting like \`\`\`json.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      let text = response.text || "[]";
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const generatedSlides = JSON.parse(text);
      
      const slidesWithIds = generatedSlides.map((slide: any, index: number) => ({
        ...slide,
        id: Date.now() + index
      }));

      setSlides(slidesWithIds);
      setPast([]);
      setFuture([]);
    } catch (error) {
      console.error("Error generating slides:", error);
      alert("Failed to generate slides. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateSlide = (id: number, updates: Partial<Slide>) => {
    if (!slides) return;
    setPast(prev => [...prev, slides]);
    setFuture([]);
    setSlides(slides.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const undo = () => {
    if (past.length === 0 || !slides) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    setPast(newPast);
    setFuture([slides, ...future]);
    setSlides(previous);
  };

  const redo = () => {
    if (future.length === 0 || !slides) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setPast([...past, slides]);
    setFuture(newFuture);
    setSlides(next);
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
              <div className="flex items-center gap-4">
                {slides && (
                  <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-brand-dark/10">
                    <button onClick={undo} disabled={past.length === 0} className="p-1.5 text-brand-dark/60 hover:text-brand-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-md hover:bg-brand-beige/50" title="Undo">
                      <Undo2 className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-brand-dark/10"></div>
                    <button onClick={redo} disabled={future.length === 0} className="p-1.5 text-brand-dark/60 hover:text-brand-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-md hover:bg-brand-beige/50" title="Redo">
                      <Redo2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {slides && <span className="text-sm font-semibold bg-brand-green/10 text-brand-green px-3 py-1 rounded-full">10 Slides Generated</span>}
              </div>
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

function SlidePreview({ slide, index, onUpdate }: { slide: Slide; index: number; onUpdate: (u: Partial<Slide>) => void; key?: React.Key }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [activeAssetTab, setActiveAssetTab] = useState<'images' | 'accents'>('images');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdate({ customImage: url });
    }
  };

  const displayImage = slide.customImage || slide.imagePlaceholder;
  const filterStyle = slide.imageFilter && slide.imageFilter !== 'none' ? IMAGE_FILTERS.find(f => f.id === slide.imageFilter)?.style : undefined;
  
  const getOutlineStyle = () => {
    if (slide.textOutline === 'light') return '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 2px 4px rgba(255,255,255,0.5)';
    if (slide.textOutline === 'dark') return '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 4px rgba(0,0,0,0.5)';
    return undefined;
  };

  const getTextBgClass = () => {
    switch (slide.textBackground) {
      case 'glass-light': return 'bg-white/60 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/40';
      case 'glass-dark': return 'bg-black/50 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/10 text-white';
      case 'solid-light': return 'bg-white p-6 rounded-2xl shadow-md';
      case 'solid-dark': return 'bg-brand-dark p-6 rounded-2xl shadow-md text-white';
      default: return '';
    }
  };

  const getFontThemeClass = (type: 'title' | 'body') => {
    const theme = slide.fontTheme || 'modern';
    if (type === 'title') {
      if (theme === 'editorial') return 'font-serif tracking-normal';
      if (theme === 'tech') return 'font-mono tracking-tight uppercase';
      return 'font-display tracking-tight'; // modern
    } else {
      if (theme === 'editorial') return 'font-sans font-light leading-relaxed';
      if (theme === 'tech') return 'font-mono text-sm leading-relaxed';
      return 'font-sans leading-relaxed'; // modern
    }
  };

  const renderAccent = (className: string) => {
    const accentId = slide.accentIcon || 'squiggle';
    const AccentComponent = NZ_ACCENTS.find(a => a.id === accentId)?.component || Squiggle;
    return <AccentComponent className={className} />;
  };
  
  const renderLayout = () => {
    switch (slide.layout) {
      case 'cover-arch':
        return (
          <div className="flex flex-col h-full items-center justify-between text-center pt-12 pb-16 px-8 relative">
            {slide.subtitle && (
              <span className="font-sans text-[9px] tracking-[0.3em] font-semibold uppercase text-[var(--color-card-dark)] opacity-60 shrink-0">
                {slide.subtitle}
              </span>
            )}
            <div className="w-56 h-64 rounded-t-full overflow-hidden border-[6px] border-[var(--color-card-bg)] shadow-2xl relative z-10 bg-black/5 shrink-0 my-auto">
              {displayImage && <img src={displayImage} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />}
            </div>
            <div className={`shrink-0 ${getTextBgClass()}`}>
              <h2 className={`${getFontThemeClass('title')} text-4xl leading-[1.1] text-[var(--color-card-dark)] whitespace-pre-line relative z-10 text-balance`}>
                {slide.title}
              </h2>
            </div>
            {renderAccent("absolute bottom-6 left-1/2 -translate-x-1/2 w-12 text-[var(--color-card-accent)] opacity-60")}
          </div>
        );

      case 'cover-image-full':
        return (
          <div className="flex flex-col h-full relative p-8 justify-end">
            <div className="absolute inset-0">
              {displayImage && <img src={displayImage} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />}
            </div>
            <div className={`relative z-10 shrink-0 ${slide.textBackground && slide.textBackground !== 'none' ? getTextBgClass() : 'bg-black/40 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]'}`}>
              <span className="font-sans text-[10px] font-bold tracking-[0.3em] uppercase text-[var(--color-card-accent)] mb-4 block">
                {slide.subtitle || 'NEW GUIDE'}
              </span>
              <h2 className={`${getFontThemeClass('title')} text-4xl text-white mb-2 leading-[1.1] text-balance`}>
                {slide.title}
              </h2>
            </div>
          </div>
        );

      case 'cover-split':
        return (
          <div className="flex flex-col h-full bg-[var(--color-card-dark)]">
            <div className="h-[55%] w-full relative shrink-0">
              {displayImage && <img src={displayImage} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />}
            </div>
            <div className="flex-1 p-8 flex flex-col justify-center">
              <span className="font-sans text-[10px] font-bold tracking-[0.3em] uppercase text-[var(--color-card-accent)] mb-3 block shrink-0">
                {slide.subtitle || 'NEW GUIDE'}
              </span>
              <h2 className="font-serif text-4xl text-white leading-[1.1] tracking-tight shrink-0 text-balance">
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
            <h2 className="font-serif text-5xl text-[var(--color-card-dark)] leading-[1.1] tracking-tighter shrink-0 relative z-10 text-balance">
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
                {displayImage && <img src={displayImage} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />}
              </div>
            </div>
            <div className="text-center z-10 shrink-0 w-full">
              <span className="font-sans text-[10px] font-bold tracking-[0.3em] uppercase text-[var(--color-card-accent)] mb-3 block">
                {slide.subtitle || 'NEW GUIDE'}
              </span>
              <h2 className="font-serif text-4xl text-[var(--color-card-dark)] leading-[1.1] tracking-tight text-balance">
                {slide.title}
              </h2>
            </div>
          </div>
        );

      case 'step-list':
        return (
          <div className="flex flex-col h-full p-10 relative overflow-hidden">
            <div className="relative mb-8 shrink-0">
              <span className="absolute -top-6 -left-4 font-serif text-8xl text-[var(--color-card-accent)] opacity-40 leading-none select-none">
                {slide.stepNumber !== undefined ? slide.stepNumber : index}
              </span>
              <h3 className={`${getFontThemeClass('title')} text-4xl text-[var(--color-card-dark)] mt-4 relative z-10 tracking-tight leading-snug`}>
                {slide.title}
              </h3>
            </div>
            <p className={`${getFontThemeClass('body')} text-sm leading-[1.8] text-[var(--color-card-dark)] opacity-85 mb-8 relative z-10`}>
              {slide.content}
            </p>
            {displayImage && (
              <div className="mt-auto self-end w-40 h-40 shrink-0 rounded-full overflow-hidden border-[6px] border-[var(--color-card-bg)] shadow-xl bg-black/5 relative z-10">
                <img src={displayImage} alt="Step" className="w-full h-full object-cover" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />
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
                {displayImage && <img src={displayImage} alt="Split" className="w-full h-full object-cover" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />}
              </div>
            </div>
            <div className="h-[45%] p-10 flex flex-col justify-center">
              {slide.stepNumber !== undefined && (
                <span className="font-sans text-[10px] tracking-[0.2em] font-bold text-[var(--color-card-accent)] mb-3 uppercase">
                  Step {slide.stepNumber < 10 ? `0${slide.stepNumber}` : slide.stepNumber}
                </span>
              )}
              <h3 className="font-serif text-3xl text-[var(--color-card-dark)] mb-4 tracking-tight leading-tight text-balance">
                {slide.title}
              </h3>
              <p className="font-sans text-[14px] leading-[1.7] text-[var(--color-card-dark)] opacity-80 text-balance">
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
            <p className="font-serif text-[26px] leading-[1.5] text-[var(--color-card-dark)] relative z-10 italic text-balance">
              {slide.content}
            </p>
            <span className="font-serif text-[120px] text-[var(--color-card-accent)] opacity-15 absolute bottom-[-40px] right-6 leading-none select-none rotate-180">
              “
            </span>
          </div>
        );

      case 'magazine-cover':
        return (
          <div className="flex flex-col h-full relative p-8">
            <div className="absolute inset-0 bg-[var(--color-card-bg)]" />
            <div className="absolute inset-4 border border-[var(--color-card-dark)]/20 z-10 pointer-events-none" />
            <div className="relative z-20 flex flex-col h-full">
              <div className="flex justify-between items-start mb-auto">
                <span className="font-sans text-[8px] tracking-[0.4em] uppercase text-[var(--color-card-dark)]">
                  {slide.subtitle || 'ISSUE 01'}
                </span>
                <span className="font-sans text-[8px] tracking-[0.4em] uppercase text-[var(--color-card-dark)]">
                  VOL. {slide.stepNumber || 1}
                </span>
              </div>
              <div className="relative w-full h-[60%] my-6">
                {displayImage && <img src={displayImage} alt="Cover" className="w-full h-full object-cover grayscale contrast-125" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />}
                <h2 className={`${getFontThemeClass('title')} text-7xl text-[var(--color-card-dark)] leading-[0.85] tracking-tighter absolute -bottom-8 -left-4 mix-blend-multiply text-balance`}>
                  {slide.title}
                </h2>
              </div>
              <div className="mt-auto flex justify-end">
                <p className={`${getFontThemeClass('body')} text-xs text-[var(--color-card-dark)]/80 max-w-[60%] text-right leading-relaxed`}>
                  {slide.content}
                </p>
              </div>
            </div>
          </div>
        );

      case 'neo-brutalism':
        return (
          <div className="flex flex-col h-full p-8 bg-[#FFE55C] relative border-8 border-black">
            <div className="absolute top-4 right-4 bg-black text-white font-mono text-xs px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
              {slide.subtitle || 'TRENDING'}
            </div>
            <div className="flex-1 flex flex-col justify-center relative z-10 mt-8">
              <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 transform -rotate-2">
                <h2 className="font-mono text-4xl font-black text-black leading-tight uppercase text-balance">
                  {slide.title}
                </h2>
              </div>
              {displayImage && (
                <div className="w-full h-48 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-white shrink-0">
                  <img src={displayImage} alt="Brutalism" className="w-full h-full object-cover" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />
                </div>
              )}
              {slide.content && (
                <div className="mt-8 bg-[#FF90E8] border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <p className="font-sans font-bold text-black text-sm text-balance">
                    {slide.content}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 'social-quote':
        return (
          <div className="flex flex-col h-full items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-200">
            <div className="bg-white w-full rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0">
                  {displayImage ? (
                    <img src={displayImage} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />
                  ) : (
                    <User className="w-6 h-6 m-2 text-gray-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-sans font-bold text-sm text-gray-900 leading-none mb-1">{slide.subtitle || 'Creator Name'}</h4>
                  <p className="font-sans text-xs text-gray-500 leading-none">@creator_handle</p>
                </div>
                <div className="ml-auto text-blue-500">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"></path></svg>
                </div>
              </div>
              <h3 className={`${getFontThemeClass('body')} text-lg text-gray-900 mb-4 whitespace-pre-line text-balance`}>
                {slide.title}
              </h3>
              {slide.content && (
                <p className="font-sans text-sm text-blue-500 text-balance">
                  {slide.content}
                </p>
              )}
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-6 text-gray-400">
                <Heart className="w-4 h-4" />
                <MessageCircle className="w-4 h-4" />
                <Share2 className="w-4 h-4" />
              </div>
            </div>
          </div>
        );

      case 'cta-minimal':
        return (
          <div className="flex flex-col h-full items-center justify-between text-center p-10 bg-[var(--color-card-bg)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-card-accent)] opacity-5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
            
            <div className={`flex-1 flex flex-col justify-center w-full relative z-10 mt-8 ${getTextBgClass()}`}>
              <h3 className={`${getFontThemeClass('title')} text-5xl text-[var(--color-card-dark)] mb-8 tracking-tight leading-tight text-balance`}>
                {slide.title}
              </h3>
              {Array.isArray(slide.content) && (
                <div className="space-y-4 mb-10 w-full max-w-[85%] mx-auto">
                  {slide.content.map((item, i) => (
                    <div key={i} className={`${getFontThemeClass('body')} text-sm font-medium text-[var(--color-card-dark)] opacity-85 border-b border-[var(--color-card-dark)]/10 pb-3`}>
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instagram Optimized Engagement Bar */}
            <div className="w-full pt-6 border-t border-[var(--color-card-dark)]/10 relative z-10">
              <p className="font-sans text-[11px] font-bold tracking-widest uppercase text-[var(--color-card-accent)] mb-5">
                도움이 되셨다면 저장하고 공유해주세요!
              </p>
              <div className="flex items-center justify-between px-2 text-[var(--color-card-dark)]">
                <div className="flex gap-5">
                  <Heart className="w-7 h-7" strokeWidth={1.5} />
                  <MessageCircle className="w-7 h-7" strokeWidth={1.5} />
                  <Send className="w-7 h-7" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col items-center relative">
                  <div className="absolute -top-8 right-1 text-[var(--color-card-accent)] animate-bounce">
                    <ArrowDown className="w-5 h-5" strokeWidth={3} />
                  </div>
                  <Bookmark className="w-8 h-8" strokeWidth={2} />
                </div>
              </div>
            </div>
          </div>
        );

      case 'polaroid-focus':
        return (
          <div className="flex flex-col h-full items-center justify-center p-10 relative">
            <div className="w-3/4 aspect-square bg-white p-4 pb-12 shadow-2xl mb-8 transform -rotate-2 border border-black/5 relative z-10 transition-transform hover:rotate-0 duration-500 shrink-0">
              <div className="w-full h-full bg-black/5 overflow-hidden">
                {displayImage && <img src={displayImage} alt="Focus" className="w-full h-full object-cover" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />}
              </div>
            </div>
            <div className={`w-full text-center ${getTextBgClass()}`}>
              <h3 className={`${getFontThemeClass('title')} text-3xl text-[var(--color-card-dark)] mb-4 px-4 tracking-tight leading-tight text-balance`}>
                {slide.title}
              </h3>
              <p className={`${getFontThemeClass('body')} text-sm leading-[1.7] text-[var(--color-card-dark)] opacity-80 px-4 text-balance`}>
                {slide.content}
              </p>
            </div>
            {renderAccent("absolute top-10 right-10 w-12 h-12 text-[var(--color-card-accent)] opacity-20 transform rotate-45")}
          </div>
        );

      case 'editorial-text':
        return (
          <div className="flex flex-col h-full p-12 relative justify-center">
            {renderAccent("absolute top-12 right-10 w-32 h-32 text-[var(--color-card-accent)] opacity-[0.07] transform -rotate-12")}
            <h3 className="font-serif text-[2.25rem] text-[var(--color-card-dark)] mb-10 border-b border-[var(--color-card-dark)]/15 pb-8 leading-[1.15] tracking-tight text-balance">
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
            <div className="absolute inset-0">
              {displayImage && <img src={displayImage} alt="Background" className="w-full h-full object-cover" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />}
            </div>
            <div className="relative z-10 mt-auto p-6 w-full">
              <div className="bg-white/60 backdrop-blur-2xl p-8 rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] border border-white/60">
                {slide.stepNumber !== undefined && (
                  <span className="inline-block font-sans text-[10px] font-bold tracking-[0.2em] uppercase text-white bg-[var(--color-card-accent)] px-3 py-1.5 rounded-full mb-4 shadow-sm">
                    Tip {slide.stepNumber < 10 ? `0${slide.stepNumber}` : slide.stepNumber}
                  </span>
                )}
                <h3 className="font-serif text-3xl text-[var(--color-card-dark)] mb-4 leading-tight tracking-tight text-balance">
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
            <div className="absolute top-1/4 -left-4 w-40 h-40 rounded-full bg-[var(--color-shape-peach)] opacity-90 mix-blend-multiply z-0"></div>
            <div className="absolute bottom-1/3 right-4 w-32 h-32 rounded-full bg-[var(--color-shape-sage)] opacity-90 mix-blend-multiply z-0"></div>
            <div className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full bg-[var(--color-shape-blue)] opacity-50 mix-blend-multiply -translate-x-1/2 -translate-y-1/2 z-0"></div>
            
            <div className={`relative z-10 w-full text-center shrink-0 mb-6 ${getTextBgClass()}`}>
              <h3 className={`${getFontThemeClass('title')} text-3xl text-[var(--color-card-dark)] tracking-tight leading-[1.15] text-balance`}>
                {slide.title}
              </h3>
            </div>
            
            <div className="w-48 h-56 z-10 shadow-2xl bg-white p-2 transform rotate-2 transition-transform hover:rotate-0 shrink-0">
              <div className="w-full h-full bg-black/5 overflow-hidden">
                {displayImage && <img src={displayImage} alt="Abstract" className="w-full h-full object-cover" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />}
              </div>
            </div>
            
            <div className={`relative z-10 w-full text-center shrink-0 mt-6 ${slide.textBackground && slide.textBackground !== 'none' ? getTextBgClass() : 'bg-white/40 backdrop-blur-md p-4 rounded-xl border border-white/50'}`}>
              <p className={`${getFontThemeClass('body')} text-[13px] leading-[1.6] text-[var(--color-card-dark)] italic text-balance`}>
                {slide.content}
              </p>
            </div>
          </div>
        );

      case 'bold-number':
        return (
          <div className="flex flex-col h-full p-10 relative overflow-hidden" style={{ backgroundColor: slide.bgColor === 'var(--color-card-bg)' ? 'var(--color-bold-green)' : slide.bgColor }}>
            <div className="flex-1 relative z-10">
              <span className="block font-sans font-bold text-[8rem] leading-none text-[var(--color-bold-yellow)] mb-2 tracking-tighter">
                {slide.stepNumber !== undefined ? slide.stepNumber : index}
              </span>
              <h3 className="font-sans font-bold text-4xl text-white mb-6 leading-[1.1] tracking-tight text-balance">
                {slide.title}
              </h3>
              <p className="font-sans text-[16px] font-medium leading-relaxed text-white/90 text-balance">
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
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 400 500" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M-50 250 C 100 100, 300 400, 450 200" stroke="var(--color-card-accent)" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
              <path d="M-50 400 C 150 450, 250 50, 450 150" stroke="var(--color-card-accent)" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
            </svg>
            
            <h3 className="font-sans text-[10px] tracking-[0.3em] font-bold uppercase text-[var(--color-card-dark)] opacity-60 mb-8 relative z-10 shrink-0">
              {slide.subtitle || 'New Collection'}
            </h3>
            
            <div className="w-64 h-64 rounded-full overflow-hidden border-[2px] border-[var(--color-card-accent)] p-2 relative z-10 mb-8 shrink-0 bg-[var(--color-card-bg)]">
              <div className="w-full h-full rounded-full overflow-hidden bg-black/5">
                {displayImage && <img src={displayImage} alt="Line Art" className="w-full h-full object-cover" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />}
              </div>
            </div>
            
            <div className={`relative z-10 shrink-0 w-full text-center ${getTextBgClass()}`}>
              <h2 className={`${getFontThemeClass('title')} text-3xl text-[var(--color-card-dark)] tracking-tight text-balance`}>
                {slide.title}
              </h2>
            </div>
          </div>
        );

      case 'info-stat-grid': {
        const items = Array.isArray(slide.content) ? slide.content : (typeof slide.content === 'string' ? slide.content : '').split('\n').filter(Boolean);
        const stats = [];
        for(let i=0; i<items.length; i+=2) {
           stats.push({ value: items[i], label: items[i+1] || '' });
        }
        return (
          <div className="flex flex-col h-full p-10 bg-[var(--color-card-bg)]">
            {slide.subtitle && (
              <span className="font-sans text-[10px] tracking-[0.3em] font-bold uppercase text-[var(--color-card-accent)] mb-6 shrink-0">
                {slide.subtitle}
              </span>
            )}
            <h3 className="font-serif text-3xl text-[var(--color-card-dark)] mb-10 leading-[1.15] tracking-tight shrink-0 text-balance">
              {slide.title}
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-8 flex-1 content-center">
              {stats.map((stat, i) => (
                <div key={i} className="flex flex-col border-t-2 border-[var(--color-card-dark)]/10 pt-4">
                  <span className="font-serif text-4xl text-[var(--color-card-accent)] mb-2 tracking-tight">{stat.value}</span>
                  <span className="font-sans text-[12px] font-medium text-[var(--color-card-dark)] opacity-80 leading-snug">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'info-bar-chart': {
        const items = Array.isArray(slide.content) ? slide.content : (typeof slide.content === 'string' ? slide.content : '').split('\n').filter(Boolean);
        const getWidth = (str: string) => {
          const match = str.match(/\d+/);
          return match ? Math.min(100, Math.max(5, parseInt(match[0]))) : 50;
        };
        const getLabel = (str: string) => str.replace(/\d+%?/, '').trim();
        const getValue = (str: string) => {
          const match = str.match(/\d+%?/);
          return match ? match[0] : '';
        };
        return (
          <div className="flex flex-col h-full p-10 bg-[var(--color-card-dark)] text-white">
            {slide.subtitle && (
              <span className="font-sans text-[10px] tracking-[0.3em] font-bold uppercase text-[var(--color-card-accent)] mb-6 shrink-0">
                {slide.subtitle}
              </span>
            )}
            <h3 className="font-serif text-3xl mb-10 leading-[1.15] tracking-tight shrink-0 text-balance">
              {slide.title}
            </h3>
            <div className="flex flex-col gap-6 flex-1 justify-center">
              {items.map((item, i) => {
                const width = getWidth(item);
                return (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="flex justify-between font-sans text-[13px] font-medium opacity-90">
                      <span>{getLabel(item)}</span>
                      <span className="text-[var(--color-card-accent)]">{getValue(item)}</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--color-card-accent)] rounded-full" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'info-donut-chart': {
        const percentage = slide.stepNumber !== undefined ? slide.stepNumber : 75;
        const deg = (percentage / 100) * 360;
        return (
          <div className="flex flex-col h-full p-10 items-center justify-center bg-[var(--color-card-bg)] relative">
            {slide.subtitle && (
              <span className="font-sans text-[10px] tracking-[0.3em] font-bold uppercase text-[var(--color-card-accent)] mb-6 shrink-0 w-full text-left">
                {slide.subtitle}
              </span>
            )}
            <h3 className="font-serif text-3xl text-[var(--color-card-dark)] mb-12 text-center leading-[1.15] tracking-tight shrink-0 w-full text-balance">
              {slide.title}
            </h3>
            
            <div className="relative w-48 h-48 rounded-full flex items-center justify-center shrink-0 mb-10 shadow-xl"
                 style={{ background: `conic-gradient(var(--color-card-accent) ${deg}deg, rgba(0,0,0,0.05) 0deg)` }}>
              <div className="absolute inset-3 bg-[var(--color-card-bg)] rounded-full flex items-center justify-center shadow-inner">
                <span className="font-serif text-5xl text-[var(--color-card-dark)] tracking-tighter">
                  {percentage}%
                </span>
              </div>
            </div>
            
            <p className="font-sans text-[14px] leading-[1.6] text-[var(--color-card-dark)] opacity-80 text-center max-w-[90%]">
              {slide.content}
            </p>
          </div>
        );
      }
    }
  };

  return (
    <div className="flex flex-col gap-2 group">
      {/* Editor Controls */}
      <div className="flex flex-wrap items-center justify-between bg-white p-2 rounded-lg border border-brand-dark/10 text-xs shadow-sm gap-y-2">
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
          {slide.layout !== 'quote-tip' && slide.layout !== 'cta-minimal' && slide.layout !== 'editorial-text' && slide.layout !== 'bold-number' && slide.layout !== 'info-stat-grid' && slide.layout !== 'info-bar-chart' && slide.layout !== 'info-donut-chart' && (
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
              <button 
                onClick={() => setIsAssetModalOpen(true)}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 text-brand-dark/70 hover:text-brand-dark transition-colors"
                title="NZ Asset Library"
              >
                <Library className="w-3 h-3" /> Assets
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
           style={{ backgroundColor: slide.bgColor, textShadow: getOutlineStyle() }}>
        
        {/* Global Texture Overlay */}
        {slide.globalTexture === 'noise' && (
          <div className="absolute inset-0 z-50 pointer-events-none opacity-[0.15] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        )}
        {slide.globalTexture === 'paper' && (
          <div className="absolute inset-0 z-50 pointer-events-none opacity-[0.4] mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paperFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5' result='noise'/%3E%3CfeDiffuseLighting in='noise' lighting-color='%23fff' surfaceScale='2'%3E%3CfeDistantLight azimuth='45' elevation='60'/%3E%3C/feDiffuseLighting%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paperFilter)'/%3E%3C/svg%3E")` }}></div>
        )}

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

        {/* Asset Library Modal */}
        {isAssetModalOpen && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-[60] p-6 flex flex-col overflow-hidden border-4 border-brand-green/20">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-brand-dark/10 shrink-0">
              <h4 className="font-bold text-lg text-brand-dark flex items-center gap-2">
                <Library className="w-5 h-5" /> NZ Asset Library
              </h4>
              <button 
                onClick={() => setIsAssetModalOpen(false)} 
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-brand-dark" />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-2 mb-4 shrink-0">
              <button 
                onClick={() => setActiveAssetTab('images')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${activeAssetTab === 'images' ? 'bg-brand-green text-white' : 'bg-brand-dark/5 text-brand-dark/70 hover:bg-brand-dark/10'}`}
              >
                Photos
              </button>
              <button 
                onClick={() => setActiveAssetTab('accents')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${activeAssetTab === 'accents' ? 'bg-brand-green text-white' : 'bg-brand-dark/5 text-brand-dark/70 hover:bg-brand-dark/10'}`}
              >
                Accents & Shapes
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-2 -mr-2">
              {activeAssetTab === 'images' ? (
                <div className="grid grid-cols-2 gap-3">
                  {NZ_IMAGES.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        onUpdate({ customImage: url });
                        setIsAssetModalOpen(false);
                      }}
                      className="relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-brand-green transition-all group"
                    >
                      <img src={url} alt={`NZ Asset ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="bg-white text-brand-dark text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Use Photo</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {NZ_ACCENTS.map(accent => {
                    const Icon = accent.component;
                    const isActive = slide.accentIcon === accent.id || (!slide.accentIcon && accent.id === 'squiggle');
                    return (
                      <button
                        key={accent.id}
                        onClick={() => {
                          onUpdate({ accentIcon: accent.id as any });
                          setIsAssetModalOpen(false);
                        }}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${isActive ? 'border-brand-green bg-brand-green/5' : 'border-brand-dark/10 hover:border-brand-green/50 hover:bg-gray-50'}`}
                      >
                        <Icon className="w-10 h-10 text-brand-dark mb-2" />
                        <span className="font-bold text-xs text-brand-dark">{accent.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}
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
              {slide.layout === 'step-list' || slide.layout === 'image-split' || slide.layout === 'photo-overlay' || slide.layout === 'bold-number' || slide.layout === 'info-donut-chart' ? (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-1">Step Number / Percentage</label>
                  <input 
                    type="number" 
                    value={slide.stepNumber !== undefined ? slide.stepNumber : ''} 
                    onChange={e => onUpdate({ stepNumber: e.target.value === '' ? undefined : parseInt(e.target.value) })} 
                    className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none" 
                    placeholder="e.g. 75" 
                  />
                </div>
              ) : null}

              {slide.layout.startsWith('cover-') || slide.layout === 'continuous-line' || slide.layout.startsWith('info-') ? (
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

              <div className="mt-8 pt-6 border-t border-brand-dark/10">
                <h5 className="text-[10px] font-bold uppercase text-brand-dark/40 mb-3 tracking-wider">Style & Effects</h5>
                <div className="grid grid-cols-2 gap-4">
                  {displayImage && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-1">Image Filter</label>
                      <select 
                        value={slide.imageFilter || 'none'} 
                        onChange={e => onUpdate({ imageFilter: e.target.value })} 
                        className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none bg-white"
                      >
                        {IMAGE_FILTERS.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-1">Font Theme</label>
                    <select 
                      value={slide.fontTheme || 'modern'} 
                      onChange={e => onUpdate({ fontTheme: e.target.value as any })} 
                      className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none bg-white"
                    >
                      <option value="modern">Modern (Default)</option>
                      <option value="editorial">Editorial (Serif)</option>
                      <option value="tech">Tech (Monospace)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-1">Text Background</label>
                    <select 
                      value={slide.textBackground || 'none'} 
                      onChange={e => onUpdate({ textBackground: e.target.value as any })} 
                      className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none bg-white"
                    >
                      <option value="none">None</option>
                      <option value="glass-light">Glass (Light)</option>
                      <option value="glass-dark">Glass (Dark)</option>
                      <option value="solid-light">Solid (Light)</option>
                      <option value="solid-dark">Solid (Dark)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-1">Text Outline</label>
                    <select 
                      value={slide.textOutline || 'none'} 
                      onChange={e => onUpdate({ textOutline: e.target.value as any })} 
                      className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none bg-white"
                    >
                      <option value="none">None</option>
                      <option value="light">Light Outline</option>
                      <option value="dark">Dark Outline</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-1">Global Texture</label>
                    <select 
                      value={slide.globalTexture || 'none'} 
                      onChange={e => onUpdate({ globalTexture: e.target.value as any })} 
                      className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none bg-white"
                    >
                      <option value="none">None</option>
                      <option value="noise">Film Noise</option>
                      <option value="paper">Paper Texture</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Render the specific layout */}
        {renderLayout()}
      </div>
    </div>
  );
}

