import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { 
  Image as ImageIcon, Save, Share2, Heart, Bookmark, Loader2, Download, Home, Search, Plus, Send, Sparkles, Sliders, 
  RefreshCw, Palette, Type, Droplet, AlertCircle, User, ArrowRight, Wand2,
  Link as LinkIcon, FileText, LayoutTemplate, Upload, Edit3, FileJson,
  ListOrdered, Columns, MessageSquareQuote, Camera, AlignLeft, 
  Quote, ChevronLeft, ChevronRight,
  Shapes, Hash, PenTool, CheckSquare, ChevronDown, X, Leaf, Trash2, Copy,
  PieChart, BarChart3, LayoutGrid, Library, MessageCircle, ArrowDown, Undo2, Redo2,
  Film, PlusSquare
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { GoogleGenAI } from "@google/genai";
import { Koru, SilverFern, Kiwi, Mountain, Squiggle, NZMap, SouthernCross, BookOpen, SunRays, OrganicBlob, Pohutukawa, Tui, Kauri } from './components/NZIcons';

type LayoutType = 'cover-arch' | 'cover-image-full' | 'cover-split' | 'cover-minimal' | 'cover-polaroid' | 'step-list' | 'image-split' | 'quote-tip' | 'cta-minimal' | 'polaroid-focus' | 'editorial-text' | 'photo-overlay' | 'abstract-shapes' | 'bold-number' | 'continuous-line' | 'info-stat-grid' | 'info-bar-chart' | 'info-donut-chart' | 'magazine-cover' | 'neo-brutalism' | 'social-quote';
type InputSourceType = 'text' | 'url' | 'json' | 'manual';

interface Slide {
  id: number;
  layout: LayoutType;
  stepNumber?: number | string;
  title?: string;
  subtitle?: string;
  content?: string | string[];
  imagePlaceholder?: string;
  customImage?: string; // For user uploaded images
  imageFilter?: string; // CSS filter for the image
  textOutline?: 'none' | 'light' | 'dark'; // Text outline effect
  textBackground?: 'none' | 'glass-light' | 'glass-dark' | 'solid-light' | 'solid-dark'; // Text background box
  fontTheme?: 'modern' | 'editorial' | 'tech'; // Font pairing theme
  titleFont?: 'inter' | 'outfit' | 'playfair' | 'roboto' | 'montserrat' | 'oswald' | 'lora' | 'lato' | 'bebas' | 'newsreader' | 'auto';
  bodyFont?: 'inter' | 'outfit' | 'playfair' | 'roboto' | 'montserrat' | 'oswald' | 'lora' | 'lato' | 'bebas' | 'newsreader' | 'auto';
  globalTexture?: 'none' | 'noise' | 'paper' | 'paper-vintage' | 'paper-crumpled' | 'canvas'; // Global texture overlay
  fontColor?: string;
  bgColor?: string;
  accentIcon?: 'none' | 'squiggle' | 'leaf' | 'koru' | 'fern' | 'kiwi' | 'mountain' | 'nzmap' | 'southerncross' | 'book' | 'sun' | 'blob' | 'pohutukawa' | 'tui' | 'kauri';
  accentColor?: string;
  accentSize?: number;
  accentOpacity?: number;
  accentX?: number;
  accentY?: number;
  accentRotation?: number;
  accentFlipX?: boolean;
  accentFlipY?: boolean;
  fontSizeScale?: number; // Scale factor for text size to prevent overflow
  titleFontSize?: number; // Custom title font size
  titleFontWeight?: string; // Custom title font weight
  titleColor?: string; // Custom title font color
  bodyFontSize?: number; // Custom body font size
  bodyFontWeight?: string; // Custom body font weight
  bodyLineHeight?: string; // Custom body line height
  bodyLetterSpacing?: string; // Custom body letter spacing
  overflowHandling?: 'truncate' | 'auto-scale' | 'none'; // How to handle text overflow
  bgImage?: string;
  bgImageScale?: number;
  bgImageX?: number;
  bgImageY?: number;
  bgImageOpacity?: number;
  fgImage?: string;
  fgImageScale?: number;
  fgImageX?: number;
  fgImageY?: number;
  fgImageRotation?: number;
  fgImageOpacity?: number;
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
    subtitle: 'NZ IMMIGRATION GUIDE',
    title: 'Starting School\nin New Zealand', 
    imagePlaceholder: 'https://picsum.photos/seed/nzlandscape/1080/1350',
    bgColor: '#F5EFE6',
    fontColor: '#2B3A36'
  },
  { 
    id: 2, 
    layout: 'social-quote', 
    subtitle: 'PARENT PERSPECTIVE',
    title: 'A New Life in Aotearoa', 
    content: 'Navigating the NZ school system as a newcomer can feel overwhelming. Here is my experience settling our girls in Auckland.',
    imagePlaceholder: 'https://picsum.photos/seed/family/1080/1350',
    bgColor: '#FFFFFF',
    fontColor: '#2B3A36',
    fontTheme: 'editorial'
  },
   { 
    id: 3, 
    layout: 'magazine-cover', 
    subtitle: 'EDUCATION SPECIAL',
    title: 'THE KIWI CLASSROOM', 
    content: 'Exploring the play-based learning and outdoor education that makes NZ schools unique.',
    imagePlaceholder: 'https://picsum.photos/seed/school/1080/1350',
    bgColor: '#F5EFE6',
    fontColor: '#2B3A36'
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
  { id: 'pohutukawa', name: 'Pohutukawa', component: Pohutukawa },
  { id: 'tui', name: 'Tui Bird', component: Tui },
  { id: 'kauri', name: 'Kauri Tree', component: Kauri },
];





function SlideEditorPanel({ slide, onUpdate }: { slide: Slide, onUpdate: (updates: Partial<Slide>) => void }) {
  const [activeTab, setActiveTab] = React.useState('layout');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const bgFileInputRef = React.useRef<HTMLInputElement>(null);
  const fgFileInputRef = React.useRef<HTMLInputElement>(null);
  const [displayImage, setDisplayImage] = React.useState<string | null>(slide.customImage || slide.imagePlaceholder || null);

  React.useEffect(() => {
    if (slide.customImage) setDisplayImage(slide.customImage);
    else if (slide.imagePlaceholder) setDisplayImage(slide.imagePlaceholder);
    else setDisplayImage(null);
  }, [slide.customImage, slide.imagePlaceholder]);

  return (
    <div className="flex flex-col h-full bg-white text-brand-dark">
      <div className="flex gap-2 p-4 border-b border-brand-dark/10 overflow-x-auto shrink-0 hide-scrollbar">
        {[
          { id: 'layout', icon: LayoutTemplate, label: 'Layout' },
          { id: 'text', icon: Edit3, label: 'Content' },
          { id: 'style', icon: Sparkles, label: 'Style' },
          { id: 'assets', icon: Library, label: 'Assets' },
          { id: 'advanced', icon: Sliders, label: 'Advanced' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'bg-brand-green text-white shadow-md' : 'bg-brand-dark/5 hover:bg-brand-dark/10 text-brand-dark/70'}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'layout' && (
          <div className="grid grid-cols-2 gap-3">
            {LAYOUTS.map(layout => {
              const Icon = layout.icon;
              const isActive = slide.layout === layout.id;
              return (
                <button
                  key={layout.id}
                  onClick={() => onUpdate({ layout: layout.id as LayoutType })}
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
        )}

        {activeTab === 'text' && (
          <div className="space-y-4">
            {slide.layout === 'step-list' || slide.layout === 'image-split' || slide.layout === 'photo-overlay' || slide.layout === 'bold-number' || slide.layout === 'info-donut-chart' || slide.layout === 'magazine-cover' ? (
              <div>
                <label className="block text-xs font-black uppercase text-brand-dark/50 mb-2 tracking-wider">Step Number / Issue / Percentage</label>
                <input 
                  type="text" 
                  value={slide.stepNumber !== undefined ? slide.stepNumber : ''} 
                  onChange={e => onUpdate({ stepNumber: e.target.value === '' ? undefined : e.target.value })} 
                  className="w-full border-2 border-brand-dark/10 rounded-xl p-3 text-base focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 outline-none transition-all" 
                  placeholder="e.g. 75, 2 (1/2), ISSUE 1" 
                />
              </div>
            ) : null}

            {slide.layout.startsWith('cover-') || slide.layout === 'continuous-line' || slide.layout.startsWith('info-') || slide.layout === 'neo-brutalism' || slide.layout === 'social-quote' ? (
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
              <label className="block text-xs font-black uppercase text-brand-dark/50 mb-2 tracking-wider">Main Title</label>
              <textarea 
                value={slide.title || ''} 
                onChange={e => onUpdate({ title: e.target.value })} 
                className="w-full border-2 border-brand-dark/10 rounded-xl p-4 text-lg font-medium focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 outline-none resize-none transition-all leading-tight" 
                placeholder="Enter title..." 
                rows={3}
              />
              <div className="mt-4 grid grid-cols-2 gap-4 bg-brand-dark/[0.02] p-4 rounded-2xl border border-brand-dark/5">
                <div className="col-span-1">
                  <label className="block text-[10px] font-black uppercase text-brand-dark/40 mb-2">Title Size</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" 
                      min="40" 
                      max="300" 
                      value={slide.titleFontSize || 90} 
                      onChange={e => onUpdate({ titleFontSize: parseInt(e.target.value) })} 
                      className="flex-1 h-2 bg-brand-dark/10 rounded-lg appearance-none cursor-pointer accent-brand-green" 
                    />
                    <span className="text-xs font-mono font-bold w-8 text-right">{slide.titleFontSize || 90}</span>
                  </div>
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold uppercase text-brand-dark/40 mb-1">Title Weight</label>
                  <select 
                    value={slide.titleFontWeight || 'bold'} 
                    onChange={e => onUpdate({ titleFontWeight: e.target.value })} 
                    className="w-full border border-brand-dark/10 rounded px-1.5 py-1 text-[10px] outline-none focus:ring-1 focus:ring-brand-green bg-white font-bold"
                  >
                    <option value="normal">Normal</option>
                    <option value="medium">Medium</option>
                    <option value="bold">Bold</option>
                    <option value="black">Extra Bold</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-brand-dark/40 mb-1">Title Color</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={slide.titleColor || '#000000'} 
                      onChange={e => onUpdate({ titleColor: e.target.value })} 
                      className="w-8 h-8 rounded border-none cursor-pointer overflow-hidden p-0"
                    />
                    <input 
                      type="text" 
                      value={slide.titleColor || ''} 
                      onChange={e => onUpdate({ titleColor: e.target.value })} 
                      placeholder="Custom Hex"
                      className="flex-1 border border-brand-dark/10 rounded px-2 py-1.5 text-[10px] font-mono outline-none focus:ring-1 focus:ring-brand-green"
                    />
                    {(slide.titleColor) && (
                      <button 
                        onClick={() => onUpdate({ titleColor: undefined })}
                        className="text-[9px] font-bold text-red-500 bg-red-50 px-2 py-1.5 rounded"
                      >
                        RESET
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {slide.layout !== 'cover-arch' && slide.layout !== 'continuous-line' && (
              <div>
                <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-1">Body Content</label>
                {slide.layout === 'info-stat-grid' || slide.layout === 'info-bar-chart' ? (
                  <div className="space-y-3 bg-brand-dark/5 p-3 rounded-lg border border-brand-dark/10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold uppercase text-brand-dark/50">Data Points</span>
                      <button 
                        onClick={() => {
                          const contentArray = Array.isArray(slide.content) ? slide.content : (typeof slide.content === 'string' ? slide.content.split('\n') : []);
                          const newContent = [...contentArray];
                          newContent.push('New Value', 'New Label');
                          onUpdate({ content: newContent });
                        }}
                        className="text-[10px] bg-brand-green/10 text-brand-green px-2 py-1 rounded hover:bg-brand-green/20 transition-colors font-bold"
                      >
                        + ADD ITEM
                      </button>
                    </div>
                    {Array.from({ length: Math.max(1, Math.ceil((Array.isArray(slide.content) ? slide.content.length : 0) / 2)) }).map((_, i) => {
                      const contentArray = Array.isArray(slide.content) ? slide.content : (typeof slide.content === 'string' ? slide.content.split('\n') : []);
                      return (
                        <div key={i} className="flex flex-col gap-1 bg-white p-2 rounded border border-brand-dark/10 shadow-sm relative group">
                          <button 
                            onClick={() => {
                              const newContent = [...contentArray];
                              newContent.splice(i * 2, 2);
                              onUpdate({ content: newContent });
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          >
                            ×
                          </button>
                          <input 
                            type="text" 
                            placeholder="Value (e.g. Free)"
                            className="w-full bg-transparent border-none p-1 text-xl font-serif text-brand-dark focus:ring-0 outline-none placeholder:text-brand-dark/20"
                            value={contentArray[i * 2] || ''}
                            onChange={(e) => {
                              const newContent = [...contentArray];
                              newContent[i * 2] = e.target.value;
                              onUpdate({ content: newContent });
                            }}
                          />
                          <input 
                            type="text" 
                            placeholder="Label (e.g. Wi-Fi Access)"
                            className="w-full bg-transparent border-none p-1 text-xs font-bold text-brand-dark/60 focus:ring-0 outline-none placeholder:text-brand-dark/20 uppercase tracking-wider"
                            value={contentArray[i * 2 + 1] || ''}
                            onChange={(e) => {
                              const newContent = [...contentArray];
                              newContent[i * 2 + 1] = e.target.value;
                              onUpdate({ content: newContent });
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                ) : slide.layout === 'cta-minimal' ? (
                  <textarea 
                    value={typeof slide.content === 'string' ? slide.content : (Array.isArray(slide.content) ? slide.content.join('\n') : '')} 
                    onChange={e => onUpdate({ content: e.target.value.split('\n') })} 
                    className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none resize-none" 
                    placeholder="Enter items (one per line)" 
                    rows={5}
                  />
                ) : (
                  <textarea 
                    value={typeof slide.content === 'string' ? slide.content : (Array.isArray(slide.content) ? slide.content.join('\n') : '')} 
                    onChange={e => onUpdate({ content: e.target.value })} 
                    className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none resize-none" 
                    placeholder="Enter body text..." 
                    rows={5}
                  />
                )}
                {slide.layout !== 'info-stat-grid' && slide.layout !== 'info-bar-chart' && (
                  <div className="mt-4 grid grid-cols-2 gap-4 bg-brand-dark/[0.02] p-4 rounded-2xl border border-brand-dark/5">
                    <div className="col-span-1">
                      <label className="block text-[10px] font-black uppercase text-brand-dark/40 mb-2">Body Size</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="range" 
                          min="20" 
                          max="120" 
                          value={slide.bodyFontSize || 48} 
                          onChange={e => onUpdate({ bodyFontSize: parseInt(e.target.value) })} 
                          className="flex-1 h-2 bg-brand-dark/10 rounded-lg appearance-none cursor-pointer accent-brand-green" 
                        />
                        <span className="text-xs font-mono font-bold w-6 text-right">{slide.bodyFontSize || 48}</span>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold uppercase text-brand-dark/40 mb-1">Line Height</label>
                      <select 
                        value={slide.bodyLineHeight || '1.4'} 
                        onChange={e => onUpdate({ bodyLineHeight: e.target.value })} 
                        className="w-full border border-brand-dark/10 rounded px-1.5 py-1 text-[10px] outline-none focus:ring-1 focus:ring-brand-green bg-white font-bold"
                      >
                        <option value="1">Tight (1.0)</option>
                        <option value="1.2">Snug (1.2)</option>
                        <option value="1.35">Reading (1.35)</option>
                        <option value="1.4">Normal (1.4)</option>
                        <option value="1.6">Relaxed (1.6)</option>
                        <option value="1.8">Loose (1.8)</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-brand-dark/40 mb-1">Letter Spacing (Kerning)</label>
                      <select 
                        value={slide.bodyLetterSpacing || 'normal'} 
                        onChange={e => onUpdate({ bodyLetterSpacing: e.target.value })} 
                        className="w-full border border-brand-dark/10 rounded px-1.5 py-1 text-[10px] outline-none focus:ring-1 focus:ring-brand-green bg-white font-bold"
                      >
                        <option value="-0.05em">Tighter (-0.05em)</option>
                        <option value="-0.02em">Tight (-0.02em)</option>
                        <option value="normal">Normal (0em)</option>
                        <option value="0.02em">Wide (0.02em)</option>
                        <option value="0.05em">Wider (0.05em)</option>
                        <option value="0.1em">Widest (0.1em)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'style' && (
          <div className="space-y-6">
             <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-xs font-black uppercase text-brand-dark/50 mb-2 tracking-wider">Slide Global Background</label>
                  <div className="flex gap-3">
                    <input 
                      type="color" 
                      value={slide.bgColor || '#ffffff'} 
                      onChange={e => onUpdate({ bgColor: e.target.value })}
                      className="w-12 h-12 rounded-xl shrink-0 p-0 border-2 border-brand-dark/10 cursor-pointer overflow-hidden"
                    />
                    <input 
                      type="text" 
                      value={slide.bgColor || ''} 
                      placeholder="#FFFFFF"
                      onChange={e => onUpdate({ bgColor: e.target.value })}
                      className="w-full border-2 border-brand-dark/10 rounded-xl px-4 text-base focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 outline-none bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-black uppercase text-brand-dark/50 mb-2 tracking-wider">Font Theme</label>
                  <select 
                    value={slide.fontTheme || 'modern'} 
                    onChange={e => onUpdate({ fontTheme: e.target.value as any })} 
                    className="w-full border-2 border-brand-dark/10 rounded-xl p-3 text-base font-bold focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 outline-none bg-white appearance-none cursor-pointer"
                  >
                    <option value="modern">Modern & Clean</option>
                    <option value="editorial">Editorial & Classic</option>
                    <option value="tech">Tech & Bold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-brand-dark/50 mb-2 tracking-wider">Title Font</label>
                  <select 
                    value={slide.titleFont || 'auto'} 
                    onChange={e => onUpdate({ titleFont: e.target.value as any })} 
                    className="w-full border-2 border-brand-dark/10 rounded-xl p-3 text-base focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 outline-none bg-white appearance-none cursor-pointer"
                  >
                    <option value="auto">- Auto (Theme) -</option>
                    <option value="inter">Inter (Sans)</option>
                    <option value="outfit">Outfit (Display)</option>
                    <option value="playfair">Playfair (Serif)</option>
                    <option value="roboto">Roboto (Sans)</option>
                    <option value="montserrat">Montserrat (Sans)</option>
                    <option value="oswald">Oswald (Display)</option>
                    <option value="lora">Lora (Serif)</option>
                    <option value="lato">Lato (Sans)</option>
                    <option value="bebas">Bebas Neue (Display)</option>
                    <option value="newsreader">Newsreader (Serif)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-brand-dark/50 mb-2 tracking-wider">Body Font</label>
                  <select 
                    value={slide.bodyFont || 'auto'} 
                    onChange={e => onUpdate({ bodyFont: e.target.value as any })} 
                    className="w-full border-2 border-brand-dark/10 rounded-xl p-3 text-base focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 outline-none bg-white appearance-none cursor-pointer"
                  >
                    <option value="auto">- Auto (Theme) -</option>
                    <option value="inter">Inter (Sans)</option>
                    <option value="outfit">Outfit (Display)</option>
                    <option value="playfair">Playfair (Serif)</option>
                    <option value="roboto">Roboto (Sans)</option>
                    <option value="montserrat">Montserrat (Sans)</option>
                    <option value="oswald">Oswald (Display)</option>
                    <option value="lora">Lora (Serif)</option>
                    <option value="lato">Lato (Sans)</option>
                    <option value="bebas">Bebas Neue (Display)</option>
                    <option value="newsreader">Newsreader (Serif)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-1">Text Color (Overrides Theme)</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={slide.fontColor || '#2B3A36'} 
                      onChange={e => onUpdate({ fontColor: e.target.value })}
                      className="w-8 h-8 rounded shrink-0 p-0 border-0 cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={slide.fontColor || ''} 
                      placeholder="#2B3A36"
                      onChange={e => onUpdate({ fontColor: e.target.value })}
                      className="w-full border border-brand-dark/20 rounded p-1.5 text-sm focus:ring-1 focus:ring-brand-green outline-none bg-white font-mono"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold uppercase text-brand-dark/50">Font Size Scale</label>
                    <span className="text-[9px] font-mono text-brand-dark/50">{slide.fontSizeScale ? slide.fontSizeScale.toFixed(2) : '1.00'}x</span>
                  </div>
                  <input 
                    type="range" min="0.5" max="2" step="0.05"
                    value={slide.fontSizeScale || 1}
                    onChange={e => onUpdate({ fontSizeScale: parseFloat(e.target.value) })}
                    className="w-full h-1.5 accent-brand-green"
                  />
                   <p className="text-[9px] text-brand-dark/40 mt-1">Adjust this if text is overflowing the card.</p>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-1">Text Background & Outline</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select 
                      value={slide.textBackground || 'none'} 
                      onChange={e => onUpdate({ textBackground: e.target.value as any })} 
                      className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none bg-white"
                    >
                      <option value="none">No BG</option>
                      <option value="glass-light">Glass (Light)</option>
                      <option value="glass-dark">Glass (Dark)</option>
                      <option value="solid-light">Solid (Light)</option>
                      <option value="solid-dark">Solid (Dark)</option>
                    </select>

                    <select 
                      value={slide.textOutline || 'none'} 
                      onChange={e => onUpdate({ textOutline: e.target.value as any })} 
                      className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none bg-white"
                    >
                      <option value="none">No Outline</option>
                      <option value="light">Light Outline</option>
                      <option value="dark">Dark Outline</option>
                    </select>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-1">Global Texture</label>
                  <select 
                    value={slide.globalTexture || 'none'} 
                    onChange={e => onUpdate({ globalTexture: e.target.value as any })} 
                    className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none bg-white"
                  >
                    <option value="none">None</option>
                    <option value="noise">Film Noise</option>
                    <option value="paper">Cream Paper</option>
                    <option value="paper-vintage">Vintage Paper</option>
                    <option value="paper-crumpled">Crumpled Paper</option>
                    <option value="canvas">Canvas Overlay</option>
                  </select>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="space-y-6">
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

            <div className="flex justify-between items-center mb-2">
              <label className="block text-[10px] font-bold uppercase text-brand-dark/50">Preset Images</label>
              <button 
                onClick={() => onUpdate({ customImage: undefined, imagePlaceholder: 'empty' })}
                className="text-[9px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded hover:bg-red-100 transition-colors flex items-center gap-1"
                title="Remove current image"
              >
                <Trash2 className="w-2.5 h-2.5" /> Clear Image
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {NZ_IMAGES.map((url, i) => (
                <button
                  key={i}
                  onClick={() => onUpdate({ customImage: url })}
                  className="relative aspect-square rounded overflow-hidden border-2 border-transparent hover:border-brand-green transition-all"
                >
                  <img src={url} alt={`Asset ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-brand-dark/10">
              <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-2">Preset Accents</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onUpdate({ accentIcon: 'none' })}
                  className={`relative p-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                    slide.accentIcon === 'none'
                      ? 'border-brand-green bg-brand-green/5' 
                      : 'border-transparent bg-brand-dark/5 hover:border-brand-dark/20 hover:bg-brand-dark/10'
                  }`}
                >
                  <X className="w-5 h-5 opacity-40 text-brand-dark" />
                  <span className="text-[10px] font-bold text-brand-dark">None</span>
                </button>
                {NZ_ACCENTS.map(accent => {
                  const Icon = accent.component;
                  const isActive = slide.accentIcon === accent.id;
                  return (
                    <button
                      key={accent.id}
                      onClick={() => onUpdate({ accentIcon: accent.id as any })}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${isActive ? 'border-brand-green bg-brand-green/5' : 'border-brand-dark/10 hover:border-brand-green/50 hover:bg-gray-50'}`}
                    >
                      <Icon className="w-6 h-6 text-brand-dark mb-1" />
                      <span className="font-bold text-[9px] text-brand-dark whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">{accent.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-6">
            
            {/* Accent Details */}
            {slide.accentIcon && slide.accentIcon !== 'none' && (
              <div className="space-y-3">
                <h5 className="font-bold text-sm border-b pb-1">Accent Transform</h5>
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[10px] font-bold uppercase text-brand-dark/40">Color</label>
                          {slide.accentColor && (
                            <button onClick={() => onUpdate({ accentColor: undefined })} className="text-[9px] text-brand-green cursor-pointer">Reset</button>
                          )}
                        </div>
                        <input type="color" value={slide.accentColor || '#000000'} onChange={e => onUpdate({ accentColor: e.target.value })} className="w-full h-8 cursor-pointer rounded" />
                     </div>
                     <div className="grid grid-cols-2 gap-1 items-end">
                          <button onClick={() => onUpdate({ accentFlipX: !slide.accentFlipX })} className={`py-1.5 px-1 text-[9px] font-bold uppercase rounded border ${slide.accentFlipX ? 'bg-brand-dark text-white border-brand-dark' : 'bg-white border-brand-dark/20'}`}>Flip X</button>
                          <button onClick={() => onUpdate({ accentFlipY: !slide.accentFlipY })} className={`py-1.5 px-1 text-[9px] font-bold uppercase rounded border ${slide.accentFlipY ? 'bg-brand-dark text-white border-brand-dark' : 'bg-white border-brand-dark/20'}`}>Flip Y</button>
                     </div>
                     
                     {[{label: 'Size', prop: 'accentSize', min: 0.2, max: 3, step: 0.1, def: 1},
                       {label: 'Opacity', prop: 'accentOpacity', min: 0, max: 1, step: 0.05, def: 0.2},
                       {label: 'Rotation', prop: 'accentRotation', min: 0, max: 360, step: 5, def: 0},
                       {label: 'X Pos', prop: 'accentX', min: -50, max: 150, step: 1, def: 85},
                       {label: 'Y Pos', prop: 'accentY', min: -50, max: 150, step: 1, def: 15}
                     ].map(c => (
                         <div key={c.prop}>
                           <div className="flex justify-between items-center mb-1">
                             <label className="text-[10px] font-bold uppercase text-brand-dark/40">{c.label}</label>
                             <span className="text-[9px] font-mono text-brand-dark/40">{(slide as any)[c.prop] ?? c.def}</span>
                           </div>
                           <input type="range" min={c.min} max={c.max} step={c.step} value={(slide as any)[c.prop] ?? c.def} onChange={e => onUpdate({ [c.prop]: parseFloat(e.target.value) })} className="w-full h-1 accent-brand-green" />
                         </div>
                     ))}
                </div>
              </div>
            )}

             <div className="space-y-3">
                <h5 className="font-bold text-sm border-b pb-1">Image Layers</h5>
                <div className="grid grid-cols-2 gap-4">
                  {/* Background Layer Tools */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-brand-dark/40">Background Layer</label>
                    <div className="flex flex-col gap-1">
                       <button onClick={() => bgFileInputRef.current?.click()} className="text-[10px] bg-brand-dark/5 py-1 rounded">Set BG Image</button>
                       {slide.bgImage && <button onClick={() => onUpdate({ bgImage: undefined })} className="text-[10px] text-red-500 bg-red-50 py-1 rounded">Remove</button>}
                    </div>
                    {slide.bgImage && (
                       <>
                         <input type="range" min="0.1" max="3" step="0.1" value={slide.bgImageScale || 1} onChange={e => onUpdate({ bgImageScale: parseFloat(e.target.value) })} className="w-full" title="Scale" />
                         <input type="range" min="0" max="1" step="0.05" value={slide.bgImageOpacity ?? 1} onChange={e => onUpdate({ bgImageOpacity: parseFloat(e.target.value) })} className="w-full" title="Opacity" />
                         <input type="color" value={slide.bgColor || '#ffffff'} onChange={e => onUpdate({ bgColor: e.target.value })} title="Base Color" className="w-full h-6" />
                       </>
                    )}
                  </div>
                  

                  <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase text-brand-dark/40">Foreground Layer</label>
                     <div className="flex flex-col gap-1">
                       <button onClick={() => fgFileInputRef.current?.click()} className="text-[10px] bg-brand-dark/5 py-1 rounded">Set FG Image</button>
                       {slide.fgImage && <button onClick={() => onUpdate({ fgImage: undefined })} className="text-[10px] text-red-500 bg-red-50 py-1 rounded">Remove</button>}
                    </div>
                    {slide.fgImage && (
                         <>
                         <input type="range" min="0.1" max="3" step="0.1" value={slide.fgImageScale || 1} onChange={e => onUpdate({ fgImageScale: parseFloat(e.target.value) })} className="w-full h-1" title="Scale" />
                         <input type="range" min="-50" max="150" step="1" value={slide.fgImageX ?? 50} onChange={e => onUpdate({ fgImageX: parseInt(e.target.value) })} className="w-full h-1" title="X Pos" />
                         <input type="range" min="-50" max="150" step="1" value={slide.fgImageY ?? 50} onChange={e => onUpdate({ fgImageY: parseInt(e.target.value) })} className="w-full h-1" title="Y Pos" />
                         <input type="range" min="0" max="360" step="5" value={slide.fgImageRotation ?? 0} onChange={e => onUpdate({ fgImageRotation: parseInt(e.target.value) })} className="w-full h-1" title="Rot" />
                       </>
                    )}
                  </div>
                </div>
             </div>

             <div className="space-y-3 pt-2 border-t border-brand-dark/5">
                <h5 className="font-bold text-[10px] uppercase text-brand-dark/30 tracking-widest">Text Container</h5>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-1">Overflow Strategy</label>
                  <select 
                    value={slide.overflowHandling || 'auto-scale'} 
                    onChange={e => onUpdate({ overflowHandling: e.target.value as any })} 
                    className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none bg-white"
                  >
                    <option value="auto-scale">Auto-Scale (Shrink text to fit)</option>
                    <option value="truncate">Truncate (Hide extra text)</option>
                    <option value="none">None (Allow overlap)</option>
                  </select>
                  <p className="text-[9px] text-brand-dark/40 mt-1 leading-tight">Decide how to handle text that exceeds the slide layout boundaries on smaller screens.</p>
                </div>

                <div className="pt-2">
                  <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-1">Global Texture Overlay</label>
                  <select 
                    value={slide.globalTexture || 'none'} 
                    onChange={e => onUpdate({ globalTexture: e.target.value as any })} 
                    className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none bg-white font-bold"
                  >
                    <option value="none">None</option>
                    <option value="noise">Noise / Grain</option>
                    <option value="paper">Paper Texture</option>
                    <option value="canvas">Canvas Overlay</option>
                    <option value="paper-vintage">Vintage Paper</option>
                    <option value="paper-crumpled">Crumpled Paper</option>
                  </select>
                </div>
             </div>

          </div>
        )}

      </div>
       <input type="file" ref={bgFileInputRef} className="hidden" accept="image/*" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const url = URL.createObjectURL(file);
            onUpdate({ bgImage: url });
          }
        }} />
        <input type="file" ref={fgFileInputRef} className="hidden" accept="image/*" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const url = URL.createObjectURL(file);
            onUpdate({ fgImage: url });
          }
        }} />
    </div>
  );
}

// Helper to resolve image URL from placeholder or keyword
const getImageUrl = (urlOrKeyword: string | undefined): string => {
  if (!urlOrKeyword) return '';
  if (typeof urlOrKeyword !== 'string') return '';
  if (urlOrKeyword.startsWith('http')) return urlOrKeyword;
  return `https://picsum.photos/seed/${urlOrKeyword.trim().replace(/\s+/g, '-')}/1080/1350`;
};

// Wrapper component that ensures 1080x1350 perfectly scales to fit any parent container
function ScaledSlideContainer({ children, aspectRatio = '4/5' }: { children: React.ReactNode, aspectRatio?: '4/5' | '1/1' }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        setScale(width / 1080);
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const targetHeight = aspectRatio === '1/1' ? 1080 : 1350;

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <div 
        className="absolute top-0 left-0 origin-top-left" 
        style={{ width: 1080, height: targetHeight, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

// Add this wrapper component to simulate iPhone preview with smart scaling
function PhonePreview({ slide, totalSlides, index, onPrev, onNext }: { slide: Slide, totalSlides: number, index: number, onPrev: () => void, onNext: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // iPhone 15 Pro Ratio (approx 19.5:9)
  const phoneWidth = 393;
  const phoneHeight = 852;

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        // Calculate scale to perfectly fit viewport with 20px padding
        const targetScale = Math.min((width - 40) / phoneWidth, (height - 40) / phoneHeight);
        setScale(targetScale); 
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center p-8 bg-editor-grid overflow-hidden relative">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-brand-dark/10 shadow-lg">
        <div className="flex gap-1.5">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-6 bg-brand-green' : 'w-1.5 bg-brand-dark/20'}`} />
          ))}
        </div>
        <span className="text-[10px] font-black text-brand-dark ml-2 uppercase tracking-widest">{index + 1} / {totalSlides}</span>
      </div>

      <motion.div 
        style={{ width: phoneWidth, height: phoneHeight, scale }}
        className="relative bg-[#0F0F0F] rounded-[55px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6),0_0_0_12px_#1F1F1F,0_0_0_14px_#333] overflow-hidden flex-shrink-0"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {/* Dynamic Island */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-full z-[100] border border-white/5" />
        
        {/* Screen Content */}
        <div className="absolute inset-[4px] bg-[#fafafa] rounded-[51px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-5 pt-8 pb-3 border-b border-gray-100 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[2px]">
              <div className="w-full h-full rounded-full bg-white p-[1px] overflow-hidden">
                <img src="https://picsum.photos/seed/profile/100" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-gray-900 leading-none">insight_artist</span>
              <span className="text-[10px] text-gray-500 font-medium">Sponsored</span>
            </div>
            <Bookmark className="w-5 h-5 ml-auto text-gray-400" />
          </div>

          {/* Carousel Viewport */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-gray-50">
            <AnimatePresence mode="wait">
              <motion.div 
                key={slide.id}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 200 }}
                className="w-full h-full"
              >
                <SlidePreview slide={slide} index={index} totalSlides={totalSlides} onUpdate={() => {}} readOnly />
              </motion.div>
            </AnimatePresence>

            {/* Tap Navigation */}
            <div className="absolute inset-x-0 inset-y-0 z-40 flex">
              <button onClick={onPrev} className="w-1/3 h-full cursor-w-resize" />
              <button onClick={onNext} className="w-2/3 h-full cursor-e-resize" />
            </div>

            {/* Desktop Navigation Arrows */}
            <button 
              onClick={onPrev}
              disabled={index === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur rounded-full shadow-2xl flex items-center justify-center z-50 text-brand-dark disabled:opacity-0 transition-opacity border border-gray-100"
            >
              <ChevronLeft className="w-6 h-6" strokeWidth={3} />
            </button>
            <button 
              onClick={onNext}
              disabled={index === totalSlides - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur rounded-full shadow-2xl flex items-center justify-center z-50 text-brand-dark disabled:opacity-0 transition-opacity border border-gray-100"
            >
              <ChevronRight className="w-6 h-6" strokeWidth={3} />
            </button>
          </div>

          {/* Instagram Social UI */}
          <div className="p-4 bg-white shrink-0">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-4">
                <Heart className="w-7 h-7" />
                <MessageCircle className="w-7 h-7" />
                <Send className="w-7 h-7" />
              </div>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalSlides, 5) }).map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-blue-500' : 'w-1.5 bg-gray-300'}`} />
                ))}
              </div>
              <Bookmark className="w-7 h-7" />
            </div>
            <p className="text-[13px] font-bold">1,234 likes</p>
            <p className="text-[12px] leading-snug mt-1">
              <span className="font-bold mr-1">insight_artist</span>
              Excellence defined. Swipe to explore the details.
            </p>
          </div>

          {/* Safari / OS Bar */}
          <div className="h-[80px] bg-white border-t border-gray-100 flex items-center justify-around pb-6 shrink-0">
             <div className="w-6 h-6 rounded bg-gray-100" />
             <div className="w-14 h-8 rounded-full bg-black flex items-center justify-center">
               <div className="w-3 h-3 bg-white rounded-sm" />
             </div>
             <div className="w-6 h-6 rounded-full border-2 border-gray-200" />
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[120px] h-[5px] bg-black/10 rounded-full" />
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [inputType, setInputType] = useState<InputSourceType>('text');
  const [aspectRatio, setAspectRatio] = useState<'4/5' | '1/1'>('4/5');
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [past, setPast] = useState<Slide[][]>([]);
  const [future, setFuture] = useState<Slide[][]>([]);
  const slidesRef = useRef<HTMLDivElement>(null);

  const [activeSlideId, setActiveSlideId] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (slides && slides.length > 0 && activeSlideId === null) {
      setActiveSlideId(slides[0].id);
    } else if (!slides || slides.length === 0) {
      setActiveSlideId(null);
    }
  }, [slides, activeSlideId]);

  const activeSlide = React.useMemo(() => slides ? slides.find(s => s.id === activeSlideId) : undefined, [slides, activeSlideId]);
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputType !== 'manual' && !input.trim()) return;
    
    setIsGenerating(true);
    setError(null);
        try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const systemInstruction = `
You are a World-Class Editorial Design Director and Social Media Strategist specializing in premium, high-impact Instagram carousels.
Your mission is to transform raw input (Text, URL, or JSON) into a professional, cohesive, and visually stunning 10-slide carousel that stops the scroll and drives engagement.

### CORE PERSONA & QUALITY STANDARD:
- Your taste is impeccable, minimalist, and editorial (think Kinfolk, Hypebeast, or top-tier design agencies).
- Your copywriting is pithy, punchy, and psychologically driven (think Alex Hormozi or Justin Welsh).
- You avoid generic "corporate" speak. You use bold, direct, and slightly provocative language when appropriate.

### CONTENT STRUCTURE GUIDELINES (10 SLIDES):
1. Slide 1 (THE HOOK): Must be an "impossible to ignore" headline. Use Curiosity Gaps, Bold Promises, or Relatable Pain Points.
2. Slide 2-9 (THE VALUE): Break content into "One Big Idea per Slide". Use lists, stats, or split layouts. Ensure each slide has a logical transition to the next.
3. Slide 10 (THE CTA): Clear, single instruction (Save, Share, Follow).

### DESIGN STRATEGY (Choose layouts intentionally):
- **Cover Layouts**: 'cover-arch', 'magazine-cover', or 'neo-brutalism' for prestige.
- **Data/Insights**: 'info-stat-grid', 'info-bar-chart', 'info-donut-chart', or 'bold-number'.
- **Narrative/Stories**: 'image-split', 'editorial-text', 'photo-overlay', or 'step-list'.
- **Pacing Slides**: 'quote-tip' or 'social-quote' for mid-carousel pauses.

### COPYWRITING DIRECTIVES:
- TITLES: Max 3-6 words. Extremely punchy.
- CONTENT: Max 1-2 short power sentences. BE EXTREMELY BRIEF. Long paragraphs WILL get cut off visually and ruin the layout. For 'info-stat-grid', separate values and labels with newlines (e.g., "75%\\nGrowth").
- NZ NUANCE: If the topic is NZ-related, use local flair but maintain world-class global design standards.

### SLIDE SCHEMA:
interface Slide {
  id: number;
  layout: 'cover-arch' | 'cover-image-full' | 'cover-split' | 'cover-minimal' | 'cover-polaroid' | 'step-list' | 'image-split' | 'quote-tip' | 'magazine-cover' | 'neo-brutalism' | 'social-quote' | 'cta-minimal' | 'polaroid-focus' | 'editorial-text' | 'photo-overlay' | 'abstract-shapes' | 'bold-number' | 'continuous-line' | 'info-stat-grid' | 'info-bar-chart' | 'info-donut-chart';
  stepNumber?: number | string;
  title: string; // HIGH-IMPACT HEADLINE
  subtitle?: string; // CATEGORY OR CONTEXT
  content?: string | string[]; // DISTILLED POWER SENTENCES
  imagePlaceholder: string; // REQUIRED: Vivid keyword for a high-quality editorial image (e.g., 'minimalist-interior-architectural', 'luxury-organic-texture')
  fontTheme: 'modern' | 'editorial' | 'tech';
  titleFontSize?: number; // Recommend 60-120 for 1080px
  titleFontWeight: 'bold' | 'black';
  bgColor: string; // Premium hex (e.g., #FDFBF7, #1A1A1A, #F5F5F0)
  accentIcon?: 'squiggle' | 'leaf' | 'koru' | 'fern' | 'kiwi' | 'mountain' | 'nzmap' | 'sun' | 'blob';
}

Generate exactly 10 slides. Return ONLY the raw JSON array. Ensure every word is refined for professional impact.
`;


      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Input Data: ${input} (Format: ${inputType})`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        }
      });

      let text = response.text || "[]";
      
      const generatedSlides = JSON.parse(text);
      
      const slidesWithIds = generatedSlides.map((slide: any, index: number) => ({
        ...slide,
        id: Date.now() + index
      }));

      setSlides(slidesWithIds);
      setPast([]);
      setFuture([]);
    } catch (err: any) {
      console.error("Error generating slides:", err);
      setError(err?.message || "Failed to generate slides. Please try again.");
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

  const deleteSlide = (id: number) => {
    if (!slides || slides.length <= 1) return;
    setPast(prev => [...prev, slides]);
    setFuture([]);
    const newSlides = slides.filter(s => s.id !== id);
    setSlides(newSlides);
    if (activeSlideId === id) {
      setActiveSlideId(newSlides[0].id);
    }
  };

  const duplicateSlide = (id: number) => {
    if (!slides) return;
    setPast(prev => [...prev, slides]);
    setFuture([]);
    const index = slides.findIndex(s => s.id === id);
    if (index === -1) return;
    
    const maxId = Math.max(...slides.map(s => s.id));
    const newSlide = { ...slides[index], id: maxId + 1 };
    
    const newSlides = [...slides];
    newSlides.splice(index + 1, 0, newSlide);
    setSlides(newSlides);
    setActiveSlideId(newSlide.id);
  };

  const reorderSlides = (newOrder: Slide[]) => {
    setSlides(newOrder);
  };

  const handlePrevSlide = () => {
    if (!slides) return;
    const currentIndex = slides.findIndex(s => s.id === activeSlideId);
    if (currentIndex > 0) {
      setActiveSlideId(slides[currentIndex - 1].id);
    }
  };

  const handleNextSlide = () => {
    if (!slides) return;
    const currentIndex = slides.findIndex(s => s.id === activeSlideId);
    if (currentIndex < slides.length - 1) {
      setActiveSlideId(slides[currentIndex + 1].id);
    }
  };

  const addNewSlide = () => {
    if (!slides) return;
    setPast(prev => [...prev, slides]);
    setFuture([]);
    
    const maxId = Math.max(...slides.map(s => s.id));
    const newId = maxId + 1;
    
    const baseSlide = activeSlideId 
      ? slides.find(s => s.id === activeSlideId) 
      : slides[slides.length - 1];
      
    const newSlide: Slide = {
      id: newId,
      layout: 'cover-minimal',
      title: 'New Slide',
      content: 'Edit this text and add a powerful insight.',
      stepNumber: slides.length + 1,
      imagePlaceholder: 'minimalist-abstract-editorial',
      bgColor: baseSlide?.bgColor || 'var(--color-card-bg)',
      fontTheme: baseSlide?.fontTheme || 'modern',
      globalTexture: baseSlide?.globalTexture || 'none',
    };
    
    setSlides([...slides, newSlide]);
    setActiveSlideId(newId);
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

  const [exportProgress, setExportProgress] = useState(0);

  const handleExport = async () => {
    if (!slides || slides.length === 0) return;
    setIsExporting(true);
    setExportProgress(0);
    
    // Allow React to render the hidden container first
    setTimeout(async () => {
      if (!slidesRef.current) {
        setIsExporting(false);
        return;
      }
      try {
        const zip = new JSZip();
        // Since we changed the hidden wrapper to use .slide-export-wrapper in the loop, we use that for sizing
        // Actually .slide-export-wrapper contains SlidePreview which uses .slide-export-target
        const slideElements = slidesRef.current.querySelectorAll('.slide-export-wrapper');
        
        // Split into chunks to balance speed and memory
        const chunkSize = 2;
        for (let i = 0; i < slideElements.length; i += chunkSize) {
          const chunk = Array.from(slideElements).slice(i, i + chunkSize);
          
          await Promise.all(chunk.map(async (wrapperElement, indexInChunk) => {
            const actualIndex = i + indexInChunk;
            const element = wrapperElement.querySelector('.slide-export-target') as HTMLElement;
            if (!element) return;
            const el = element;
            
            try {
              const targetWidth = 1080;
              const currentWidth = el.offsetWidth || 1080;
              const scale = targetWidth / currentWidth;
              
              const dataUrl = await htmlToImage.toPng(el, { 
                quality: 1.0, 
                pixelRatio: scale,
                style: {
                  transform: 'scale(1)',
                  transformOrigin: 'top left',
                  margin: '0',
                  padding: '0'
                }
              });
              
              const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
              zip.file(`slide_${actualIndex + 1}.png`, base64Data, { base64: true });
            } catch (slideError) {
              console.error(`Failed to export slide ${actualIndex + 1}:`, slideError);
              // We continue even if one slide fails
            } finally {
              setExportProgress(prev => prev + (1 / slideElements.length) * 100);
            }
          }));
        }
        
        if (Object.keys(zip.files).length === 0) {
            throw new Error("No slides were successfully captured.");
        }
        
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "mhj_cardnews.zip");
      } catch (error) {
        console.error("Export failed", error);
        alert("Failed to export slides. Memory might be low or an element failed to render.");
      } finally {
        setIsExporting(false);
        setExportProgress(0);
      }
    }, 500); // 500ms delay to ensure images/fonts are loaded
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#FDFBF7] font-sans text-brand-dark overflow-hidden select-none">
      {/* Global Loading Overlay */}
      <AnimatePresence>
        {(isGenerating || isExporting) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-brand-dark/80 backdrop-blur-md text-white p-8 overflow-hidden"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center max-w-md text-center"
            >
              <div className="relative mb-8 text-white">
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-24 h-24 border-4 border-brand-green/20 border-t-brand-green rounded-full shadow-[0_0_30px_rgba(43,200,121,0.2)]"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                   {isGenerating ? <Sparkles className="w-10 h-10 text-brand-green animate-pulse" /> : <Download className="w-10 h-10 text-brand-green animate-bounce" />}
                </div>
              </div>
              
              <h2 className="text-3xl font-black mb-4 tracking-tighter text-white">
                {isGenerating ? "Gemini is Crafting..." : "Publishing Carousel..."}
              </h2>
              
              <p className="text-white/60 text-lg leading-relaxed mb-8">
                {isGenerating 
                  ? "Analyzing your content and designing a stunning sequence of slides. This usually takes 5-10 seconds."
                  : `Rendering high-res slides: ${Math.round(exportProgress)}% completed.`}
              </p>

              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: isExporting ? `${Math.round(exportProgress)}%` : "100%" }}
                  transition={{ duration: isGenerating ? 8 : 0.5, ease: "easeInOut" }}
                  className="h-full bg-brand-green"
                />
              </div>
              
              <button 
                onClick={() => {
                  setIsGenerating(false);
                  setIsExporting(false);
                }}
                className="mt-12 text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
              >
                Cancel Process
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT SIDEBAR (EXPANDED FOR BETTER EDITING) */}
      <div className="w-full md:w-[550px] h-[50vh] md:h-full border-b md:border-b-0 md:border-r border-brand-dark/10 bg-white shadow-2xl z-20 flex flex-col shrink-0">
        
        {/* Logo / Header */}
        <div className="p-4 md:p-5 border-b border-brand-dark/5 bg-brand-dark/5 flex items-center justify-between shrink-0">
          <div className="font-sans font-black tracking-tighter text-xl md:text-2xl flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-green" />
            MHJ<span className="text-brand-green">.NZ</span>
          </div>
          {slides && slides.length > 0 && (
            <button
              onClick={() => {
                const confirmed = window.confirm('Clear all slides and start over?');
                if (confirmed) setSlides([]);
              }}
              className="text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded"
            >
              Start Over
            </button>
          )}
        </div>

        {/* Dynamic Sidebar Content */}
        {!slides || slides.length === 0 ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            <h2 className="text-lg font-bold">Create New Carousel</h2>
            {/* Context Inputs */}
             <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4 text-brand-green" />
                    <label className="font-bold text-sm text-brand-dark">Content Source</label>
                  </div>
                  <textarea
                    className="w-full h-32 md:h-40 p-4 rounded-xl border border-brand-dark/20 focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none resize-none shadow-inner bg-white text-brand-dark text-sm"
                    placeholder="Enter URL or paste your text content here... AI will automatically organize it into engaging slides."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                </div>
                
                {/* Format selection */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileJson className="w-4 h-4 text-brand-green" />
                    <label className="font-bold text-sm text-brand-dark">Input Format</label>
                  </div>
                  <select 
                    value={inputType} 
                    onChange={e => setInputType(e.target.value as any)} 
                    className="w-full p-2.5 rounded-lg border border-brand-dark/20 bg-white font-bold text-sm outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green text-brand-dark"
                  >
                     <option value="text">Raw Text / Topic</option>
                     <option value="url">URL Link</option>
                     <option value="json">JSON Data</option>
                  </select>
                </div>
             </div>
             
             {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
             )}
             
             <button
                onClick={handleGenerate}
                disabled={isGenerating || !input.trim()}
                className={`w-full py-4 rounded-xl font-bold text-base flex flex-col items-center justify-center transition-all bg-brand-green text-white shadow-lg ${
                  (isGenerating || !input.trim()) ? 'opacity-50 cursor-not-allowed transform-none' : 'hover:shadow-xl hover:-translate-y-1'
                }`}
             >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating...</span>
                  </div>
                ) : (
                  <>
                    <span>Generate Card News</span>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded mt-1 font-mono uppercase tracking-wider">Powered by Gemini 3 Flash</span>
                  </>
                )}
             </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeSlide ? (
              <SlideEditorPanel 
                slide={activeSlide} 
                onUpdate={(updates) => updateSlide(activeSlide.id, updates)} 
              />
            ) : (
              <div className="p-8 text-center text-brand-dark/50 flex flex-col items-center justify-center h-full">
                <ImageIcon className="w-12 h-12 mb-4 opacity-30" />
                Select a slide from the filmstrip below to edit.
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT WORKSPACE */}
      <div className="flex-1 h-[50vh] md:h-full flex flex-col relative bg-gray-100 overflow-hidden">
        
         {/* Top bar with Download */}
        <div className="absolute top-6 right-6 z-50">
           {slides && slides.length > 0 && (
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-3 px-8 py-4 rounded-full font-black text-lg bg-black text-white shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                {isExporting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Preparing...</>
                ) : (
                  <><Download className="w-5 h-5" /> Download Pack (.ZIP)</>
                )}
              </button>
           )}
        </div>

        {/* CENTER VIEW: Smart Scale Mockup Area */}
        <div className="flex-1 w-full flex items-center justify-center p-4 md:p-8 overflow-hidden relative">
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
          
           {!slides || slides.length === 0 ? (
             <div className="text-center z-10 flex flex-col items-center">
               <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mb-6">
                 <Wand2 className="w-8 h-8 text-brand-green" />
               </div>
               <h1 className="text-2xl font-black mb-2">Workspace</h1>
               <p className="text-gray-500 max-w-sm text-balance text-sm">Enter content to start.</p>
             </div>
           ) : activeSlide ? (
             <div className="w-full h-full z-10 flex items-center justify-center p-8 px-24 2xl:px-48">
                <div className="relative group">
                   <div className="absolute -inset-4 bg-gradient-to-r from-brand-green/20 to-blue-500/20 rounded-[3rem] blur-2xl opacity-50"></div>
                   <div className="relative bg-white rounded-[2rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-[8px] sm:border-[12px] border-white ring-1 ring-black/5 z-20">
                      <div className={`relative h-[65vh] xl:h-[72vh] ${aspectRatio === '1/1' ? 'aspect-square' : 'aspect-[4/5]'} bg-brand-beige rounded-xl overflow-hidden transition-all duration-300`}>
                         <ScaledSlideContainer aspectRatio={aspectRatio}>
                           <SlidePreview 
                             slide={activeSlide} 
                             index={slides.findIndex(s => s.id === activeSlideId)} 
                             totalSlides={slides.length} 
                             onUpdate={(updates) => updateSlide(activeSlide.id, updates)} 
                             aspectRatio={aspectRatio}
                           />
                         </ScaledSlideContainer>
                      </div>
                   </div>
                   <div className="absolute -left-28 top-1/2 -translate-y-1/2 hidden xl:flex">
                     <button 
                       onClick={handlePrevSlide} 
                       disabled={slides.findIndex(s => s.id === activeSlideId) === 0}
                       className="w-20 h-20 bg-white/90 backdrop-blur-md rounded-full shadow-2xl flex items-center justify-center text-brand-dark hover:bg-brand-green hover:text-white transition-all disabled:opacity-0 ring-4 ring-white"
                     >
                       <ChevronLeft className="w-12 h-12" strokeWidth={3} />
                     </button>
                   </div>
                   <div className="absolute -right-28 top-1/2 -translate-y-1/2 hidden xl:flex">
                     <button 
                       onClick={handleNextSlide} 
                       disabled={slides.findIndex(s => s.id === activeSlideId) === slides.length - 1}
                       className="w-20 h-20 bg-white/90 backdrop-blur-md rounded-full shadow-2xl flex items-center justify-center text-brand-dark hover:bg-brand-green hover:text-white transition-all disabled:opacity-0 ring-4 ring-white"
                     >
                       <ChevronRight className="w-12 h-12" strokeWidth={3} />
                     </button>
                   </div>
                   <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-brand-dark px-8 py-3 rounded-full text-white shadow-2xl border border-white/10 group-hover:scale-110 transition-transform">
                      <div className="flex gap-2">
                         {slides.map((_, i) => (
                            <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === slides.findIndex(s => s.id === activeSlideId) ? 'w-8 bg-brand-green' : 'w-2 bg-white/20'}`} />
                         ))}
                      </div>
                      <span className="text-xs font-black tracking-widest uppercase opacity-70 border-l border-white/20 pl-6">
                         {slides.findIndex(s => s.id === activeSlideId) + 1} / {slides.length}
                      </span>
                   </div>
                </div>
             </div>
           ) : null}
        </div>

        {/* BOTTOM VIEW: Filmstrip Gallery */}
        {slides && slides.length > 0 && (
           <Reorder.Group 
             axis="x" 
             values={slides} 
             onReorder={reorderSlides}
             className="h-56 md:h-64 lg:h-72 bg-white border-t border-brand-dark/10 shadow-[0_-20px_50px_rgba(0,0,0,0.05)] shrink-0 flex items-center px-10 gap-8 lg:gap-12 overflow-x-auto z-20 hide-scrollbar relative"
           >
              <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
              {slides.map((slide, i) => (
                <Reorder.Item 
                  key={slide.id} 
                  value={slide}
                  className="relative shrink-0 group flex items-center h-full pt-6"
                >
                  <button 
                    onClick={() => setActiveSlideId(slide.id)} 
                    className={`relative w-[150px] md:w-[180px] lg:w-[200px] ${aspectRatio === '1/1' ? 'aspect-square' : 'aspect-[4/5]'} rounded-2xl overflow-hidden transition-all duration-500 ring-offset-4 cursor-grab active:cursor-grabbing ${
                      activeSlideId === slide.id 
                      ? 'ring-[6px] ring-brand-green shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] z-30 scale-105' 
                      : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0 ring-1 ring-gray-200 z-20 hover:scale-105'
                    }`}
                  >
                    {activeSlideId === slide.id && (
                      <div className="absolute top-0 left-0 w-full bg-brand-green text-white py-1.5 text-[10px] font-black tracking-widest text-center z-[70] animate-pulse">
                        EDITING
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 z-[60] bg-black/80 backdrop-blur-md text-white text-[11px] font-black w-7 h-7 flex items-center justify-center rounded-full border border-white/20 shadow-lg">
                      {i + 1}
                    </div>
                    <div className="absolute inset-0 pointer-events-none">
                       <ScaledSlideContainer aspectRatio={aspectRatio}>
                         <SlidePreview slide={slide} onUpdate={() => {}} aspectRatio={aspectRatio} totalSlides={slides.length} index={i} readOnly={true} />
                       </ScaledSlideContainer>
                    </div>
                  </button>


                  <div className={`absolute -top-1 -right-4 flex flex-col gap-2 transition-opacity duration-300 ${activeSlideId === slide.id ? 'opacity-100 z-50' : 'opacity-0 group-hover:opacity-100 z-50'} ${slides.length === 1 ? 'hidden' : ''}`}>
                    <button onClick={(e) => { e.stopPropagation(); deleteSlide(slide.id); }} className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white w-9 h-9 flex items-center justify-center rounded-full shadow-xl border-2 border-white transition-all hover:scale-110" title="Delete Slide">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); duplicateSlide(slide.id); }} className="bg-white text-brand-dark hover:bg-brand-green hover:text-white w-9 h-9 flex items-center justify-center rounded-full shadow-xl border-2 border-white transition-all hover:scale-110" title="Duplicate Slide">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </Reorder.Item>
              ))}
              
              <button 
                onClick={addNewSlide}
                className={`h-28 md:h-32 ${aspectRatio === '1/1' ? 'aspect-square' : 'aspect-[4/5]'} rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:text-brand-green hover:border-brand-green transition-colors hover:bg-brand-green/5 shrink-0 z-10`}
                title="Add New Slide"
              >
                <Plus className="w-6 md:w-8 h-6 md:h-8" />
              </button>
              <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
           </Reorder.Group>
        )}
        
        {/* Hidden Export Container */}
        {(isExporting) && (
            <div className="fixed top-0 left-0 z-[-9999] opacity-0 pointer-events-none w-0 h-0 overflow-hidden hide-scrollbar">
              <div ref={slidesRef} className="flex flex-col gap-10 bg-white p-10">
                {slides.map((slide, i) => (
                  <div key={slide.id} className="w-[1080px] slide-export-wrapper" style={{ aspectRatio: aspectRatio === '4/5' ? '4/5' : '1/1' }}>
                    <SlidePreview slide={slide} onUpdate={() => {}} aspectRatio={aspectRatio} totalSlides={slides.length} index={i} readOnly={true} />
                  </div>
                ))}
              </div>
            </div>
        )}
      </div>
    </div>
  );
}



function SlidePreview({ slide, index, totalSlides, onUpdate, aspectRatio, readOnly = false }: { slide: Slide; index: number; totalSlides: number; onUpdate: (u: Partial<Slide>) => void; aspectRatio?: '4/5' | '1/1' | 'square'; key?: React.Key; readOnly?: boolean }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const fgFileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [activeAssetTab, setActiveAssetTab] = useState<'images' | 'accents'>('images');
  const exportTargetRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const handleOverflow = () => {
      const el = exportTargetRef.current;
      if (!el) return;

      const mode = slide.overflowHandling || 'auto-scale';

      if (mode === 'none' || mode === 'truncate') {
        el.style.setProperty('--auto-scale', '1');
        if (mode === 'truncate') {
          el.classList.add('overflow-mode-truncate');
        } else {
          el.classList.remove('overflow-mode-truncate');
        }
        return;
      }

      el.classList.remove('overflow-mode-truncate');

      // Reset to measure natural size
      el.style.setProperty('--auto-scale', '1');
      
      const checkOverflow = (element: HTMLElement): boolean => {
        // Ignore elements that are explicitly meant to overflow or don't matter
        if (element.classList.contains('absolute') && element.classList.contains('opacity-15')) return false; 
        
        if (element.scrollHeight > element.clientHeight + 2 || element.scrollWidth > element.clientWidth + 2) {
          return true;
        }
        for (let i = 0; i < element.children.length; i++) {
          if (checkOverflow(element.children[i] as HTMLElement)) {
            return true;
          }
        }
        return false;
      };

      let isOverflowing = checkOverflow(el);
      let currentScale = 1;
      let attempts = 0;

      while (isOverflowing && attempts < 20 && currentScale > 0.45) {
        currentScale -= 0.05;
        el.style.setProperty('--auto-scale', currentScale.toString());
        isOverflowing = checkOverflow(el);
        attempts++;
      }
    };

    // Use a small timeout to allow fonts and images to render/layout
    const timer = setTimeout(handleOverflow, 50);
    return () => clearTimeout(timer);
  }, [slide.content, slide.title, slide.subtitle, slide.layout, slide.fontSizeScale, slide.overflowHandling, aspectRatio]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdate({ customImage: url });
    }
  };

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdate({ bgImage: url });
    }
  };

  const handleFgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdate({ fgImage: url });
    }
  };

  const displayImage = getImageUrl(slide.customImage || slide.imagePlaceholder);
  const filterStyle = slide.imageFilter && slide.imageFilter !== 'none' ? IMAGE_FILTERS.find(f => f.id === slide.imageFilter)?.style : undefined;
  
  const getOutlineStyle = () => {
    if (slide.textOutline === 'light') return '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 2px 4px rgba(255,255,255,0.5)';
    if (slide.textOutline === 'dark') return '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 4px rgba(0,0,0,0.5)';
    return undefined;
  };

  const getAutoTextColor = (bgColor: string, userFontColor?: string) => {
    const parseColor = (color: string) => {
      if (!color) return { r: 0, g: 0, b: 0, valid: false };
      const hex = color.replace('#', '');
      if (hex.length !== 6 && hex.length !== 3) return { r: 0, g: 0, b: 0, valid: false };
      let r, g, b;
      if (hex.length === 3) {
        r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
        g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
        b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
      } else {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 2), 16);
        b = parseInt(hex.substring(4, 2), 16);
      }
      return { r, g, b, valid: !isNaN(r) && !isNaN(g) && !isNaN(b) };
    };

    const bg = parseColor(bgColor);
    if (!bg.valid) return userFontColor || '#4A3C31';
    
    // YIQ formula for perceived brightness
    const bgYiq = ((bg.r * 299) + (bg.g * 587) + (bg.b * 114)) / 1000;
    const optimalAutoColor = bgYiq >= 140 ? '#1A1A1A' : '#FAFAFA';

    // If user specified a font color, check its contrast against the background
    if (userFontColor) {
      const fg = parseColor(userFontColor);
      if (fg.valid) {
        const fgYiq = ((fg.r * 299) + (fg.g * 587) + (fg.b * 114)) / 1000;
        const contrastDiff = Math.abs(bgYiq - fgYiq);
        // If contrast is very poor (difference < 70), enforce the optimal auto color
        if (contrastDiff < 70) {
          return optimalAutoColor;
        }
      }
      return userFontColor;
    }

    return optimalAutoColor;
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
      if (slide.titleFont && slide.titleFont !== 'auto') {
        switch (slide.titleFont) {
          case 'inter': return 'font-sans tracking-tight';
          case 'outfit': return 'font-display tracking-tight';
          case 'playfair': return 'font-serif tracking-normal';
          case 'roboto': return 'font-roboto tracking-tight';
          case 'montserrat': return 'font-montserrat tracking-tight';
          case 'oswald': return 'font-oswald tracking-tight uppercase';
          case 'lora': return 'font-lora tracking-normal';
          case 'lato': return 'font-lato tracking-tight';
          case 'bebas': return 'font-bebas tracking-wider';
          case 'newsreader': return 'font-newsreader italic tracking-normal';
        }
      }
      
      if (theme === 'editorial') return 'font-serif tracking-normal';
      if (theme === 'tech') return 'font-mono tracking-tight uppercase';
      return 'font-display tracking-tight'; // modern
    } else {
      if (slide.bodyFont && slide.bodyFont !== 'auto') {
        switch (slide.bodyFont) {
          case 'inter': return 'font-sans leading-relaxed';
          case 'outfit': return 'font-display leading-relaxed';
          case 'playfair': return 'font-serif leading-relaxed';
          case 'roboto': return 'font-roboto leading-relaxed';
          case 'montserrat': return 'font-montserrat leading-relaxed';
          case 'oswald': return 'font-oswald leading-relaxed';
          case 'lora': return 'font-lora leading-relaxed';
          case 'lato': return 'font-lato leading-relaxed';
          case 'bebas': return 'font-bebas leading-relaxed';
          case 'newsreader': return 'font-newsreader leading-relaxed';
        }
      }

      if (theme === 'editorial') return 'font-sans font-light leading-relaxed';
      if (theme === 'tech') return 'font-mono text-base leading-relaxed';
      return 'font-sans leading-relaxed'; // modern
    }
  };

  const renderCustomAccent = () => {
    if (!slide.accentIcon || slide.accentIcon === 'none') return null;
    
    const iconData = NZ_ACCENTS.find(a => a.id === slide.accentIcon);
    if (!iconData) return null;
    
    const Icon = iconData.component;
    const x = slide.accentX ?? 85;
    const y = slide.accentY ?? 15;
    const scale = slide.accentSize ?? 1;
    const opacity = slide.accentOpacity ?? 0.2;
    const rotation = slide.accentRotation ?? 0;
    const flipX = slide.accentFlipX ? -1 : 1;
    const flipY = slide.accentFlipY ? -1 : 1;
    const color = slide.accentColor || 'var(--color-card-accent)';
    
    return (
      <div 
        className="absolute z-40 pointer-events-none transition-all duration-300"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          width: `${scale * 100}px`,
          height: `${scale * 100}px`,
          opacity: opacity,
          transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${flipX}, ${flipY})`,
          color: color
        }}
      >
        <Icon className="w-full h-full" />
      </div>
    );
  };

  const renderBackgroundImage = () => {
    if (!slide.bgImage) return null;
    return (
      <div 
        className="absolute inset-0 z-0 pointer-events-none transition-all duration-300 overflow-hidden"
      >
        <img 
          src={slide.bgImage} 
          alt="Background" 
          className="absolute max-w-none transition-all duration-300"
          referrerPolicy="no-referrer"
          style={{
            left: `${slide.bgImageX ?? 50}%`,
            top: `${slide.bgImageY ?? 50}%`,
            width: slide.bgImageScale ? `${slide.bgImageScale * 100}%` : '100%',
            height: slide.bgImageScale ? 'auto' : '100%',
            opacity: slide.bgImageOpacity ?? 1,
            objectFit: slide.bgImageScale ? 'contain' : 'cover',
            transform: 'translate(-50%, -50%)',
            filter: filterStyle
          }}
        />
      </div>
    );
  };

  const renderForegroundImage = () => {
    if (!slide.fgImage) return null;
    return (
      <div 
        className="absolute inset-0 z-20 pointer-events-none transition-all duration-300 overflow-hidden"
      >
        <img 
          src={slide.fgImage} 
          alt="Foreground" 
          className="absolute max-w-none transition-all duration-300"
          referrerPolicy="no-referrer"
          style={{
            left: `${slide.fgImageX ?? 50}%`,
            top: `${slide.fgImageY ?? 50}%`,
            width: slide.fgImageScale ? `${slide.fgImageScale * 100}%` : '50%',
            height: 'auto',
            transform: `translate(-50%, -50%) rotate(${slide.fgImageRotation || 0}deg)`,
            opacity: slide.fgImageOpacity ?? 1,
            objectFit: 'contain'
          }}
        />
      </div>
    );
  };
  
  const getTitleStyle = (defaultSizeStr: string | number = 95) => {
    const style: React.CSSProperties = {};
    const size = slide.titleFontSize || defaultSizeStr;
    style.fontSize = `calc(${typeof size === 'number' ? size + 'px' : size} * var(--text-scale, 1))`;
    
    if (slide.titleFontWeight) {
      if (slide.titleFontWeight === 'black') style.fontWeight = 900;
      else if (slide.titleFontWeight === 'bold') style.fontWeight = 700;
      else if (slide.titleFontWeight === 'medium') style.fontWeight = 500;
      else style.fontWeight = 400;
    }
    if (slide.titleColor) style.color = getAutoTextColor(slide.bgColor, slide.titleColor);
    return style;
  };

  const getBodyStyle = (defaultSizeStr: string | number = 48) => {
    const style: React.CSSProperties = {};
    const size = slide.bodyFontSize || defaultSizeStr;
    style.fontSize = `calc(${typeof size === 'number' ? size + 'px' : size} * var(--text-scale, 1))`;
    
    if (slide.bodyLineHeight) style.lineHeight = slide.bodyLineHeight;
    if (slide.bodyLetterSpacing) style.letterSpacing = slide.bodyLetterSpacing;
    return style;
  };

  const renderLayout = () => {
    switch (slide.layout) {
      case 'cover-arch':
        return (
          <div className="flex flex-col h-full items-center justify-center p-20 relative overflow-hidden bg-[var(--color-card-bg)]">
            <div className="w-[850px] h-[1050px] relative overflow-hidden shrink-0 border-[20px] border-white shadow-[0_40px_100px_rgba(0,0,0,0.1)] bg-black/5 mb-16 z-10" 
                 style={{ borderRadius: '425px 425px 0 0' }}>
              {displayImage && <img src={displayImage} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            <div className={`shrink-0 overflow-hidden text-center relative z-20 ${getTextBgClass()}`}>
              <h2 
                className={`${getFontThemeClass('title')} text-[105px] leading-[0.9] text-[var(--color-card-dark)] whitespace-pre-line text-balance font-black tracking-tighter uppercase`}
                style={getTitleStyle()}
              >
                {slide.title}
              </h2>
              {slide.subtitle && (
                <div className="mt-8 flex items-center justify-center gap-4">
                  <div className="h-0.5 w-12 bg-[var(--color-card-accent)]" />
                  <span className="font-sans text-[28px] font-bold tracking-[0.3em] uppercase opacity-60">{slide.subtitle}</span>
                  <div className="h-0.5 w-12 bg-[var(--color-card-accent)]" />
                </div>
              )}
            </div>
          </div>
        );
      case 'cover-image-full':
        return (
          <div className="flex flex-col h-full relative p-20 justify-end overflow-hidden">
            <div className="absolute inset-0">
               {displayImage && <img src={displayImage} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />}
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </div>
            <div className={`relative z-10 shrink-0 overflow-hidden ${slide.textBackground && slide.textBackground !== 'none' ? getTextBgClass() : 'bg-white/10 backdrop-blur-xl p-12 rounded-[3rem] border border-white/20 shadow-2xl'}`}>
              <span className="font-sans text-[26px] font-black tracking-[0.5em] uppercase text-[var(--color-card-accent)] mb-6 block shrink-0 text-white/90">
                {slide.subtitle || 'GUIDELINES'}
              </span>
              <h2 
                className={`${getFontThemeClass('title')} text-[110px] text-white leading-[0.9] whitespace-pre-line text-balance shrink-0 font-black tracking-tighter`}
                style={getTitleStyle()}
              >
                {slide.title}
              </h2>
            </div>
          </div>
        );


      case 'cover-split':
        return (
          <div className="flex flex-col h-full bg-[var(--color-card-dark)] overflow-hidden">
            <div className="h-[55%] w-full relative shrink-0">
               {displayImage && <img src={displayImage} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />}
               <div className="absolute bottom-0 left-0 w-full h-1/4 bg-gradient-to-t from-[var(--color-card-dark)] to-transparent" />
            </div>
            <div className="flex-1 p-16 flex flex-col justify-center overflow-hidden">
              <span className="font-sans text-[26px] font-black tracking-[0.4em] uppercase text-[var(--color-card-accent)] mb-6 block shrink-0 opacity-80">
                {slide.subtitle || 'COLLECTION'}
              </span>
              <h2 
                className="font-serif text-[105px] text-white leading-[0.95] tracking-tight whitespace-pre-line shrink-0 text-balance font-black"
                style={getTitleStyle()}
              >
                {slide.title}
              </h2>
              <div className="w-32 h-2 bg-[var(--color-card-accent)] mt-10 shrink-0" />
            </div>
          </div>
        );

      case 'cover-minimal':
        return (
          <div className="flex flex-col h-full p-24 justify-center relative overflow-hidden bg-[var(--color-card-bg)]">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-card-accent)] opacity-10 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--color-shape-sage)] opacity-10 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4" />
            <div className="relative z-10 w-full flex flex-col items-start gap-4">
               <span className="font-sans text-[26px] font-black tracking-[0.5em] uppercase text-[var(--color-card-accent)] mb-4">
                {slide.subtitle || 'INSIGHTS'}
              </span>
              <h2 
                className="font-serif text-[110px] text-[var(--color-card-dark)] leading-[0.95] tracking-tight whitespace-pre-line text-balance font-black"
                style={getTitleStyle()}
              >
                {slide.title}
              </h2>
              <div className="w-48 h-3 bg-[var(--color-card-accent)] mt-8" />
            </div>
          </div>
        );

      case 'cover-polaroid':
        return (
          <div className="flex flex-col h-full p-20 items-center justify-center bg-[var(--color-card-bg-alt)] relative overflow-hidden">
            <div className="w-[850px] aspect-[3/4.2] bg-white p-12 pb-[160px] shadow-3xl transform -rotate-2 mb-20 z-10 shrink-0 border-[2px] border-black/5">
              <div className="w-full h-full bg-black/5 border-2 border-black/5 overflow-hidden">
                {displayImage && <img src={displayImage} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />}
              </div>
            </div>
            <div className="text-center z-10 shrink-0 w-full overflow-hidden">
              <span className="font-sans text-[24px] font-bold tracking-[0.4em] uppercase text-[var(--color-card-accent)] mb-6 block relative">
                {slide.subtitle || 'NEW GUIDE'}
              </span>
              <h2 
                className="font-serif text-[95px] text-[var(--color-card-dark)] leading-[1.1] tracking-tight whitespace-pre-line text-balance font-black"
                style={getTitleStyle()}
              >
                {slide.title}
              </h2>
            </div>
          </div>
        );

      case 'step-list':
        return (
          <div className="flex flex-col h-full p-20 relative overflow-hidden bg-[var(--color-card-bg)]">
            <div className="absolute top-12 left-20 z-10">
               <span className="font-sans text-[24px] font-black tracking-[0.3em] text-[var(--color-card-accent)] uppercase">
                 Step {slide.stepNumber !== undefined ? slide.stepNumber : index}
               </span>
            </div>
            
            <div className="flex-1 flex flex-col justify-center relative z-10 mt-16 overflow-hidden">
               <h3 
                className={`${getFontThemeClass('title')} text-[95px] text-[var(--color-card-dark)] mb-10 font-black tracking-tight whitespace-pre-line leading-[0.95] text-balance`}
                style={getTitleStyle()}
              >
                {slide.title}
              </h3>
              <div className="w-32 h-3 bg-[var(--color-card-accent)] mb-12 shrink-0" />
              <div className="overflow-hidden">
                <p 
                  className={`${getFontThemeClass('body')} leading-[1.35] text-[var(--color-card-dark)] font-bold opacity-85 whitespace-pre-line text-balance max-w-full`}
                  style={{ fontSize: '48px', ...getBodyStyle() }}
                >
                  {slide.content}
                </p>
              </div>
            </div>

            {displayImage && (
              <div className="mt-8 self-end w-[600px] h-[450px] shrink-0 rounded-[40px] overflow-hidden border-[12px] border-white shadow-3xl bg-black/5 relative z-10 transform rotate-1">
                <img src={displayImage} alt="Step" className="w-full h-full object-cover" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />
              </div>
            )}
            
            {/* Background Accent */}
            <span className="absolute -bottom-24 -left-12 font-serif text-[600px] text-[var(--color-card-accent)] opacity-10 leading-none select-none font-black italic">
               {slide.stepNumber !== undefined ? slide.stepNumber : index}
            </span>
          </div>
        );

      case 'image-split':
        return (
          <div className="flex flex-col h-full relative overflow-hidden bg-white">
            <div className="h-[55%] w-full shrink-0 relative">
              <div className="w-full h-full overflow-hidden bg-black/5 relative">
                {displayImage && <img src={displayImage} alt="Split" className="w-full h-full object-cover" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            </div>
            <div className="h-[45%] p-20 flex flex-col justify-center overflow-hidden bg-[var(--color-card-bg)] relative border-t-[8px] border-[var(--color-card-accent)]/20">
              <div className="absolute top-0 right-20 -translate-y-1/2 bg-[var(--color-card-dark)] text-white font-black text-[32px] tracking-[0.2em] px-10 py-3 rounded-full shadow-2xl border-[6px] border-white z-20">
                {typeof slide.stepNumber === 'number' && slide.stepNumber < 10 ? `0${slide.stepNumber}` : slide.stepNumber || index}
              </div>
              <h3 
                className={`${getFontThemeClass('title')} text-[105px] text-[var(--color-card-dark)] mb-8 font-black tracking-tighter whitespace-pre-line leading-[0.9] text-balance shrink-0`}
                style={getTitleStyle()}
              >
                {slide.title}
              </h3>
              <div className="overflow-hidden">
                <p 
                  className={`${getFontThemeClass('body')} leading-[1.3] text-[var(--color-card-dark)] font-bold opacity-80 whitespace-pre-line text-balance`}
                  style={{ fontSize: '48px', ...getBodyStyle() }}
                >
                  {slide.content}
                </p>
              </div>
            </div>
          </div>
        );

      case 'quote-tip':
        return (
          <div className="flex flex-col h-full items-center justify-center p-24 bg-[var(--color-card-bg)] relative overflow-hidden">
            <div className="absolute inset-0 bg-[var(--color-card-accent)] opacity-5" />
            <Quote className="w-32 h-32 text-[var(--color-card-accent)] mb-12 opacity-30 shrink-0" />
            <div className={`relative z-10 w-full max-w-[950px] text-center ${getTextBgClass()}`}>
              <h3 
                className={`${getFontThemeClass('title')} text-[95px] text-[var(--color-card-dark)] mb-12 font-black leading-[0.95] tracking-tighter text-balance whitespace-pre-line uppercase`}
                style={getTitleStyle()}
              >
                {slide.title}
              </h3>
              <div className="w-[180px] h-3 bg-[var(--color-card-accent)] mx-auto mb-16 shrink-0 rounded-full" />
              <p 
                className={`${getFontThemeClass('body')} leading-[1.4] text-[var(--color-card-dark)] font-black italic opacity-85 whitespace-pre-line text-balance px-12`}
                style={{ fontSize: '48px', ...getBodyStyle() }}
              >
                {slide.content}
              </p>
            </div>
            <Quote className="w-32 h-32 text-[var(--color-card-accent)] mt-12 opacity-30 rotate-180 self-end mr-12 shrink-0" />
          </div>
        );

      case 'magazine-cover':
        return (
          <div className="flex flex-col h-full relative p-16 overflow-hidden bg-white">
            <div className="absolute inset-0">
               {displayImage && <img src={displayImage} alt="Cover" className="w-full h-full object-cover grayscale contrast-125 opacity-30 scale-110" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />}
               <div className="absolute inset-0 bg-white/20" />
            </div>
            <div className="relative z-20 flex flex-col h-full overflow-hidden border-[3px] border-[var(--color-card-dark)]/10 p-4">
              <div className="flex justify-between items-center shrink-0 uppercase font-black text-[24px] tracking-[0.4em] border-b-[8px] border-[var(--color-card-dark)] pb-8 mt-4">
                <span>{slide.subtitle || 'EDITORIAL'}</span>
                {slide.stepNumber !== undefined && (
                  <span className="bg-[var(--color-card-dark)] text-white px-6 py-1 rounded-sm">ISSUE {slide.stepNumber}</span>
                )}
              </div>
              <div className="relative w-full flex-1 my-8 shrink-0 min-h-0 flex items-center justify-center">
                <div className="relative aspect-[4/5] h-full border-[20px] border-white shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] overflow-hidden transform -rotate-1 shrink-0">
                  {displayImage && <img src={displayImage} alt="Cover" className="w-full h-full object-cover grayscale contrast-125" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />}
                </div>
              </div>
              <div className="overflow-hidden text-center mt-auto mb-4 shrink-0">
                 <h2 
                  className={`${getFontThemeClass('title')} text-[max(80px,min(120px,10vw))] text-[var(--color-card-dark)] font-black leading-[0.85] tracking-tighter whitespace-pre-line text-balance uppercase mb-4`}
                  style={getTitleStyle()}
                >
                  {slide.title}
                </h2>
                {slide.content ? (
                  <div className="overflow-hidden">
                    <p 
                      className={`${getFontThemeClass('body')} leading-[1.3] text-[var(--color-card-dark)] font-bold opacity-80 whitespace-pre-line text-balance px-8`}
                      style={getBodyStyle(42)}
                    >
                      {slide.content}
                    </p>
                  </div>
                ) : (
                  <div className="inline-block px-12 py-4 bg-[var(--color-card-accent)] text-white font-black text-[32px] tracking-[0.2em] uppercase rounded-full">
                    Read More
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'neo-brutalism':
        return (
          <div className="flex flex-col h-full p-20 relative border-[32px] border-black overflow-hidden" style={{ backgroundColor: slide.bgColor || '#FFE55C' }}>
            <div className="absolute top-12 right-12 bg-black text-white font-mono text-[42px] font-black px-12 py-5 border-8 border-black shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]">
              {slide.subtitle || 'TRENDING'}
            </div>
            <div className="flex-1 flex flex-col justify-center relative z-10 mt-24 overflow-hidden">
              <div className="bg-white border-[20px] border-black p-16 shadow-[40px_40px_0px_0px_rgba(0,0,0,1)] mb-24 transform -rotate-2 shrink-0">
                <h2 
                  className="font-mono text-[115px] font-black text-black leading-[0.9] uppercase whitespace-pre-line text-balance"
                  style={getTitleStyle()}
                >
                  {slide.title}
                </h2>
              </div>
              {displayImage && (
                <div className="w-full h-[650px] border-[20px] border-black shadow-[40px_40px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-white shrink-0 mb-16">
                  <img src={displayImage} alt="Brutalism" className="w-full h-full object-cover grayscale contrast-150" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />
                </div>
              )}
              {slide.content && (
                <div className="bg-[#FF90E8] border-[20px] border-black p-16 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                  <p className="font-sans font-black text-black text-[56px] leading-[1.3] whitespace-pre-line text-balance tracking-tight">
                    {slide.content}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 'social-quote':
        return (
          <div className="flex flex-col h-full items-center justify-center p-20 bg-gray-50/50 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-48 bg-[var(--color-card-accent)] opacity-10" />
            <div className="bg-white w-full rounded-[60px] p-20 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden flex flex-col max-h-[92%] relative z-10">
              <div className="flex items-center gap-10 mb-12 shrink-0">
                <div className="w-[140px] h-[140px] rounded-full overflow-hidden bg-gray-200 shrink-0 border-[6px] border-[var(--color-card-accent)]/20 shadow-md">
                  {displayImage ? (
                    <img src={displayImage} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />
                  ) : (
                    <User className="w-[80px] h-[80px] m-[30px] text-gray-400" />
                  )}
                </div>
                <div className="flex flex-col">
                  <h4 className="font-sans font-black text-[48px] text-[var(--color-card-dark)] leading-none mb-2">{slide.subtitle || 'Creator'}</h4>
                  <p className="font-sans text-[32px] font-bold text-[var(--color-card-accent)] leading-none tracking-tight">@insight_artist</p>
                </div>
                <div className="ml-auto text-[var(--color-card-accent)] shrink-0 bg-[var(--color-card-accent)]/10 p-5 rounded-3xl">
                  <Quote className="w-12 h-12 fill-current" />
                </div>
              </div>
              <div className="overflow-hidden flex-1 flex flex-col justify-center px-4">
                <h3 
                  className={`${getFontThemeClass('body')} text-[85px] font-black leading-[1.1] text-[var(--color-card-dark)] mb-10 whitespace-pre-line text-balance tracking-tight`}
                  style={getTitleStyle()}
                >
                  {slide.title}
                </h3>
                {slide.content && (
                  <p 
                    className="font-sans leading-[1.3] text-[var(--color-card-dark)] font-bold opacity-70 whitespace-pre-line text-balance border-l-[10px] border-[var(--color-card-accent)]/10 pl-8"
                    style={{ fontSize: '48px', ...getBodyStyle() }}
                  >
                    {slide.content}
                  </p>
                )}
              </div>
              <div className="mt-12 pt-10 border-t-[3px] border-gray-100 flex gap-12 text-gray-300 shrink-0 justify-center">
                <div className="flex items-center gap-3"><Heart className="w-10 h-10" /> <span className="text-2xl font-black">1.2k</span></div>
                <div className="flex items-center gap-3"><MessageCircle className="w-10 h-10" /> <span className="text-2xl font-black">240</span></div>
                <div className="flex items-center gap-3"><Share2 className="w-10 h-10" /> <span className="text-2xl font-black">85</span></div>
              </div>
            </div>
          </div>
        );

      case 'cta-minimal':
        return (
          <div className="flex flex-col h-full bg-[var(--color-card-bg)] relative overflow-hidden p-20">
            <div className="absolute top-0 right-0 w-full h-[30%] bg-[var(--color-card-accent)] opacity-5 skew-y-6 origin-top-right" />
            
            <div className={`flex flex-col h-full w-full relative z-10 ${getTextBgClass()}`}>
               <span className="font-sans text-[26px] font-black tracking-[0.4em] uppercase text-[var(--color-card-accent)] mb-8 block mt-12 text-center">
                FINAL THOUGHTS
              </span>
              <h3 
                className={`${getFontThemeClass('title')} text-[115px] text-[var(--color-card-dark)] font-black mb-16 tracking-tighter whitespace-pre-line leading-[0.85] text-balance text-center`}
                style={getTitleStyle()}
              >
                {slide.title}
              </h3>
              
              <div className="flex-1 flex flex-col justify-center gap-10 w-full max-w-[950px] mx-auto overflow-hidden">
                {Array.isArray(slide.content) && slide.content.map((item, i) => (
                  <div key={i} className="flex items-center gap-6 bg-white p-8 rounded-[2rem] shadow-sm border-2 border-[var(--color-card-dark)]/5 transform transition-transform hover:scale-102">
                    <div className="w-16 h-16 rounded-full bg-[var(--color-card-accent)] flex items-center justify-center text-white font-black text-3xl shrink-0 shadow-lg">
                      {i + 1}
                    </div>
                    <p className={`${getFontThemeClass('body')} text-[48px] font-black text-[var(--color-card-dark)] leading-tight line-clamp-2`}>
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-auto w-full pt-12 border-t-[6px] border-[var(--color-card-dark)]/10 text-center pb-12">
                <p className="font-sans text-[28px] font-black tracking-[0.3em] uppercase text-[var(--color-card-accent)] mb-12 animate-pulse">
                  Save this for later
                </p>
                <div className="flex items-center justify-around px-8">
                  <div className="flex flex-col items-center gap-2">
                    <Heart className="w-16 h-16 text-[var(--color-card-dark)]" strokeWidth={2.5} />
                    <span className="text-xl font-black opacity-40 uppercase">Like</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <MessageCircle className="w-16 h-16 text-[var(--color-card-dark)]" strokeWidth={2.5} />
                    <span className="text-xl font-black opacity-40 uppercase">Reply</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Send className="w-16 h-16 text-[var(--color-card-dark)]" strokeWidth={2.5} />
                    <span className="text-xl font-black opacity-40 uppercase">Send</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Bookmark className="w-16 h-16 text-[var(--color-card-accent)]" strokeWidth={2.5} fill="currentColor" />
                    <span className="text-xl font-black opacity-40 uppercase">Save</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'polaroid-focus':
        return (
          <div className="flex flex-col h-full items-center justify-center p-20 relative overflow-hidden bg-[var(--color-card-bg-alt)]">
            <div className="w-[850px] aspect-[3/4.2] bg-white p-12 pb-[180px] shadow-3xl mb-16 transform -rotate-2 border border-black/5 relative z-10 transition-transform hover:rotate-1 duration-500 shrink-0">
              <div className="w-full h-full bg-black/5 overflow-hidden border-2 border-black/5">
                {displayImage && <img src={displayImage} alt="Focus" className="w-full h-full object-cover" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />}
              </div>
            </div>
            <div className={`w-full text-center overflow-hidden flex flex-col px-16 ${getTextBgClass()}`}>
              <h3 
                className={`${getFontThemeClass('title')} text-[95px] text-[var(--color-card-dark)] font-black mb-10 tracking-tighter whitespace-pre-line leading-[1] text-balance shrink-0`}
                style={getTitleStyle()}
              >
                {slide.title}
              </h3>
              <div className="overflow-hidden">
                <p 
                  className={`${getFontThemeClass('body')} leading-[1.4] text-[var(--color-card-dark)] opacity-85 font-bold whitespace-pre-line text-balance`}
                  style={getBodyStyle(56)}
                >
                  {slide.content}
                </p>
              </div>
            </div>
          </div>
        );

      case 'editorial-text':
        return (
          <div className="flex flex-col h-full p-24 relative justify-center overflow-hidden bg-[var(--color-card-bg)]">
            <h3 
              className="font-serif text-[90px] text-[var(--color-card-dark)] font-black mb-16 border-b-[6px] border-[var(--color-card-dark)]/15 pb-12 leading-[1.1] tracking-tight whitespace-pre-line text-balance shrink-0"
              style={getTitleStyle()}
            >
              {slide.title}
            </h3>
            <div className="font-sans text-[var(--color-card-dark)] opacity-95 relative overflow-hidden whitespace-pre-line font-bold"
                 style={{ 
                   fontSize: '42px', 
                   lineHeight: '1.5' 
                 }}>
              <span className="float-left font-serif text-[var(--color-card-accent)] pr-10 pt-4 select-none font-black"
                    style={{ 
                      fontSize: '180px', 
                      lineHeight: '0.75' 
                    }}>
                {typeof slide.content === 'string' ? slide.content.charAt(0) : ''}
              </span>
              {typeof slide.content === 'string' ? slide.content.substring(1) : slide.content}
            </div>
          </div>
        );

      case 'photo-overlay':
        return (
          <div className="flex flex-col h-full relative overflow-hidden">
            <div className="absolute inset-0">
              {displayImage && <img src={displayImage} alt="Background" className="w-full h-full object-cover" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />}
              <div className="absolute inset-0 bg-black/30" />
            </div>
            <div className="relative z-10 mt-auto p-12 w-full overflow-hidden flex flex-col max-h-full">
              <div className="bg-white/90 backdrop-blur-2xl p-16 rounded-[4rem] shadow-3xl border-2 border-white/60 overflow-hidden flex flex-col">
                {slide.stepNumber !== undefined && (
                  <span className="inline-block font-sans text-[28px] font-black tracking-[0.2em] uppercase text-white bg-[var(--color-card-accent)] px-10 py-3 rounded-full mb-8 shadow-xl shrink-0 self-start">
                    Tip {typeof slide.stepNumber === 'number' && slide.stepNumber < 10 ? `0${slide.stepNumber}` : slide.stepNumber}
                  </span>
                )}
                <h3 
                  className="font-serif text-[90px] text-[var(--color-card-dark)] font-black mb-8 leading-[1.1] tracking-tight whitespace-pre-line text-balance shrink-0"
                  style={getTitleStyle()}
                >
                  {slide.title}
                </h3>
                <div className="overflow-hidden">
                  <p className="font-sans text-[42px] leading-[1.5] text-[var(--color-card-dark)] opacity-90 font-bold whitespace-pre-line">
                    {slide.content}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'abstract-shapes':
        return (
          <div className="flex flex-col h-full p-20 relative overflow-hidden justify-center items-center bg-[var(--color-card-bg)]">
            <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] rounded-full bg-[var(--color-shape-peach)] opacity-60 mix-blend-multiply blur-3xl" />
            <div className="absolute bottom-1/3 -right-20 w-[550px] h-[550px] rounded-full bg-[var(--color-shape-sage)] opacity-60 mix-blend-multiply blur-3xl" />
            <div className="absolute top-1/2 left-1/2 w-[700px] h-[700px] rounded-full bg-[var(--color-shape-blue)] opacity-40 mix-blend-multiply -translate-x-1/2 -translate-y-1/2 blur-3xl" />
            
            <div className={`relative z-10 w-full text-center shrink-0 mb-16 ${getTextBgClass()}`}>
              <h3 
                className={`${getFontThemeClass('title')} text-[105px] text-[var(--color-card-dark)] font-black tracking-tighter whitespace-pre-line leading-[0.9] text-balance uppercase`}
                style={getTitleStyle()}
              >
                {slide.title}
              </h3>
            </div>
            
            <div className="w-[550px] h-[650px] z-10 shadow-[0_50px_100px_rgba(0,0,0,0.15)] bg-white p-6 transform rotate-2 transition-transform hover:rotate-0 shrink-0 border-[2px] border-black/5">
              <div className="w-full h-full bg-black/5 overflow-hidden">
                {displayImage && <img src={displayImage} alt="Abstract" className="w-full h-full object-cover" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />}
              </div>
            </div>
            
            <div className={`relative z-10 w-full text-center shrink-0 mt-16 overflow-hidden ${slide.textBackground && slide.textBackground !== 'none' ? getTextBgClass() : 'bg-white/20 backdrop-blur-3xl p-12 rounded-[3.5rem] border-[3px] border-white/40 shadow-2xl'}`}>
              <p 
                className={`${getFontThemeClass('body')} leading-[1.4] text-[var(--color-card-dark)] font-black whitespace-pre-line text-balance px-8`}
                style={{ fontSize: '48px', ...getBodyStyle() }}
              >
                {slide.content}
              </p>
            </div>
          </div>
        );

      case 'bold-number':
        return (
          <div className="flex flex-col h-full p-20 relative overflow-hidden" style={{ backgroundColor: slide.bgColor === 'var(--color-card-bg)' ? 'var(--color-bold-green)' : slide.bgColor }}>
            <div className="flex-1 relative z-10 flex flex-col justify-center">
              <span className="block font-sans font-black text-[380px] leading-[0.8] text-[var(--color-bold-yellow)] mb-12 tracking-tighter shrink-0 drop-shadow-2xl">
                {slide.stepNumber !== undefined ? slide.stepNumber : index}
              </span>
              <h3 
                className="font-sans font-black text-[95px] text-white mb-12 leading-[1] tracking-tight whitespace-pre-line text-balance shrink-0"
                style={getTitleStyle()}
              >
                {slide.title}
              </h3>
              <div className="overflow-hidden">
                <p className="font-sans text-[42px] font-black leading-[1.4] text-white/90 whitespace-pre-line text-balance">
                  {slide.content}
                </p>
              </div>
            </div>
            {/* Geometric Accent */}
            <svg className="absolute bottom-[-50px] right-[-50px] w-96 h-96 text-black/10" viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="12" />
              <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="12" />
            </svg>
          </div>
        );

      case 'continuous-line':
        return (
          <div className="flex flex-col h-full items-center justify-center p-20 relative overflow-hidden bg-[var(--color-card-bg)]">
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 1080 1350" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M-100 200 C 300 0, 800 600, 1180 400" stroke="var(--color-card-accent)" strokeWidth="12" strokeLinecap="round" opacity="0.15"/>
              <path d="M-100 1100 C 400 1300, 700 800, 1180 1000" stroke="var(--color-card-accent)" strokeWidth="8" strokeLinecap="round" opacity="0.15"/>
            </svg>
            
            <div className="relative z-10 w-full flex flex-col items-center">
              <span className="font-sans text-[26px] tracking-[0.5em] font-black uppercase text-[var(--color-card-accent)] mb-12 block">
                {slide.subtitle || 'LIMITLESS'}
              </span>
              
              <div className="w-[650px] h-[650px] rounded-full overflow-hidden border-[2px] border-black/5 p-8 relative z-10 mb-16 shrink-0 bg-white/50 backdrop-blur-md shadow-[0_40px_80px_rgba(0,0,0,0.1)]">
                <div className="w-full h-full rounded-full overflow-hidden bg-black/5 ring-[24px] ring-[var(--color-card-accent)]/10 ring-inset">
                  {displayImage && <img src={displayImage} alt="Line Art" className="w-full h-full object-cover scale-110" referrerPolicy="no-referrer" style={{ filter: filterStyle }} />}
                </div>
              </div>
              
              <div className={`relative z-10 shrink-0 w-full text-center overflow-hidden flex flex-col ${getTextBgClass()}`}>
                <h2 
                  className={`${getFontThemeClass('title')} text-[100px] text-[var(--color-card-dark)] font-black tracking-tighter whitespace-pre-line leading-[0.9] text-balance mb-12`}
                  style={getTitleStyle()}
                >
                  {slide.title}
                </h2>
                {slide.content && (
                  <div className="overflow-hidden">
                    <p 
                      className={`${getFontThemeClass('body')} leading-[1.4] text-[var(--color-card-dark)] font-black opacity-80 whitespace-pre-line text-balance px-20 border-t-[4px] border-[var(--color-card-accent)]/10 pt-10 inline-block mx-auto`}
                      style={getBodyStyle(48)}
                    >
                      {slide.content}
                    </p>
                  </div>
                )}
              </div>
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
          <div className="flex flex-col h-full p-20 bg-[var(--color-card-bg)] overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[var(--color-card-accent)] opacity-5 rounded-full blur-3xl" />
            
            <div className="relative z-10 flex-1 flex flex-col">
              {slide.subtitle && (
                <span className="font-sans text-[28px] tracking-[0.5em] font-black uppercase text-[var(--color-card-accent)] mb-10 shrink-0">
                  {slide.subtitle}
                </span>
              )}
              <h3 
                className={`${getFontThemeClass('title')} text-[95px] text-[var(--color-card-dark)] mb-16 font-black leading-[0.95] tracking-tighter whitespace-pre-line shrink-0 text-balance uppercase`}
                style={getTitleStyle()}
              >
                {slide.title}
              </h3>
              <div className="grid grid-cols-2 gap-x-12 gap-y-16 flex-1 content-center overflow-hidden">
                {stats.length > 0 ? stats.map((stat, i) => (
                  <div key={i} className="flex flex-col border-t-[10px] border-[var(--color-card-dark)] pt-8 overflow-hidden group hover:border-[var(--color-card-accent)] transition-colors duration-500">
                    <span className={`font-serif text-[var(--color-card-accent)] mb-2 tracking-tighter font-black ${stat.value.length > 12 ? 'text-[60px] leading-[1.1] line-clamp-3' : 'text-[100px] truncate'}`}>{stat.value}</span>
                    <span className="font-sans text-[32px] font-black text-[var(--color-card-dark)] opacity-70 leading-[1.2] line-clamp-2 uppercase tracking-tight">{stat.label}</span>
                  </div>
                )) : (
                   <div className="col-span-2 text-center text-gray-400 font-sans text-2xl italic py-20 border-2 border-dashed border-gray-200 rounded-3xl">
                    Add data points (Value \n Label)
                  </div>
                )}
              </div>
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
          <div className="flex flex-col h-full p-16 bg-[var(--color-card-dark)] text-white overflow-hidden">
            {slide.subtitle && (
              <span className="font-sans text-[28px] tracking-[0.4em] font-black uppercase text-[var(--color-card-accent)] mb-12 shrink-0">
                {slide.subtitle}
              </span>
            )}
            <h3 
              className="font-serif text-[85px] mb-12 leading-[1.05] font-black tracking-tight whitespace-pre-line shrink-0 text-balance"
              style={getTitleStyle()}
            >
              {slide.title}
            </h3>
            <div className="flex flex-col gap-10 flex-1 justify-center overflow-hidden">
              {items.map((item, i) => {
                const width = getWidth(item);
                return (
                  <div key={i} className="flex flex-col gap-4 shrink-0">
                    <div className="flex justify-between font-sans text-[36px] font-black opacity-90">
                      <span className="truncate pr-4">{getLabel(item)}</span>
                      <span className="text-[var(--color-card-accent)] shrink-0">{getValue(item)}</span>
                    </div>
                    <div className="w-full h-8 bg-white/10 rounded-full overflow-hidden shrink-0">
                      <div className="h-full bg-[var(--color-card-accent)] rounded-full transition-all duration-1000" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'info-donut-chart': {
        const percentage = slide.stepNumber !== undefined ? parseInt(String(slide.stepNumber)) || 75 : 75;
        const deg = (percentage / 100) * 360;
        return (
          <div className="flex flex-col h-full p-20 items-center justify-center bg-[var(--color-card-bg)] relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-[var(--color-card-accent)]/5" />
            
            <div className="relative z-10 w-full mb-12 flex flex-col items-center">
              {slide.subtitle && (
                <span className="font-sans text-[28px] tracking-[0.5em] font-black uppercase text-[var(--color-card-accent)] mb-10 shrink-0 w-full text-center">
                  {slide.subtitle}
                </span>
              )}
              <h3 className={`${getFontThemeClass('title')} text-[100px] text-[var(--color-card-dark)] mb-16 text-center leading-[0.9] font-black tracking-tighter whitespace-pre-line shrink-0 w-full text-balance uppercase`}>
                {slide.title}
              </h3>
            </div>
            
            <div className="relative w-[550px] h-[550px] rounded-full flex items-center justify-center shrink-0 mb-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] bg-gray-100"
                 style={{ background: `conic-gradient(var(--color-card-accent) ${deg}deg, rgba(0,0,0,0.05) 0deg)` }}>
              <div className="absolute inset-16 bg-[var(--color-card-bg)] rounded-full flex items-center justify-center shadow-inner border-[2px] border-white/50">
                <span className="font-serif text-[140px] font-black text-[var(--color-card-dark)] tracking-tighter">
                  {percentage}%
                </span>
              </div>
            </div>
            
            <div className="overflow-hidden w-full relative z-10">
              <p 
                className={`${getFontThemeClass('body')} leading-[1.35] text-[var(--color-card-dark)] font-black opacity-80 text-center whitespace-pre-line max-w-[90%] mx-auto`}
                style={{ fontSize: '48px', ...getBodyStyle() }}
              >
                {slide.content}
              </p>
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Editor Controls - Floating Vertical Bar on the Right Margin */}
      {!readOnly && (
      <div className="absolute top-1/2 -right-4 translate-x-full -translate-y-1/2 flex flex-col items-center justify-center bg-white p-3 rounded-2xl border-2 border-brand-dark/10 shadow-xl gap-y-4 z-50 w-16">
        
        {/* Layout Switcher Button */}
        <button 
          onClick={() => setIsLayoutModalOpen(true)}
          className="flex flex-col items-center gap-1 text-brand-dark/70 hover:text-brand-dark transition-colors"
          title="Change Layout"
        >
          <div className="w-10 h-10 rounded-full bg-brand-beige/50 hover:bg-brand-beige flex items-center justify-center transition-colors">
            <LayoutTemplate className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold">Layout</span>
        </button>
        
        {/* Separator */}
        <div className="w-8 h-[2px] bg-brand-dark/5 rounded-full" />

        {/* Media Buttons */}
        {slide.layout !== 'quote-tip' && slide.layout !== 'cta-minimal' && slide.layout !== 'editorial-text' && slide.layout !== 'bold-number' && slide.layout !== 'info-stat-grid' && slide.layout !== 'info-bar-chart' && slide.layout !== 'info-donut-chart' && (
          <div className="flex flex-col items-center gap-4">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={bgFileInputRef}
              onChange={handleBgImageUpload}
            />
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fgFileInputRef}
              onChange={handleFgImageUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-1 text-brand-dark/70 hover:text-brand-dark transition-colors"
              title="Upload Photo"
            >
              <div className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold">Photo</span>
            </button>
            <button 
              onClick={() => setIsAssetModalOpen(true)}
              className="flex flex-col items-center gap-1 text-brand-dark/70 hover:text-brand-dark transition-colors"
              title="Library Assets"
            >
              <div className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                <Library className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold">Assets</span>
            </button>
            <div className="w-8 h-[2px] bg-brand-dark/5 rounded-full" />
          </div>
        )}

        {/* Edit Text Button */}
        <button 
          onClick={() => setIsEditingText(!isEditingText)}
          className={`flex flex-col items-center gap-1 transition-colors ${isEditingText ? 'text-brand-green' : 'text-brand-dark/70 hover:text-brand-dark'}`}
          title="Edit Text Layers"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isEditingText ? 'bg-brand-green/10' : 'hover:bg-gray-100'}`}>
            <Edit3 className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold">Text</span>
        </button>

        {/* Style Buttons */}
        <div className="flex flex-col items-center gap-4 mt-2">
          <div className="flex flex-col items-center gap-1" title="Bg Color">
            <div className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center relative transition-colors">
              <Palette className="w-5 h-5 text-brand-dark/50" />
              <input 
                type="color" 
                value={slide.bgColor === 'var(--color-card-bg)' ? '#F5EFE6' : (slide.bgColor || '#E8DCCB')} 
                onChange={(e) => onUpdate({ bgColor: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
            <span className="text-[10px] font-bold">Color</span>
          </div>

          <div className="flex flex-col items-center gap-1 relative group/texture" title="Texture">
            <div className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors overflow-hidden relative cursor-pointer">
              <Droplet className="w-5 h-5 text-brand-dark/50" />
              <select 
                value={slide.globalTexture || 'none'} 
                onChange={e => onUpdate({ globalTexture: e.target.value as any })} 
                className="absolute inset-0 opacity-0 cursor-pointer text-brand-dark/70 w-full h-full"
              >
                <option value="none">No Texture</option>
                <option value="noise">Noise</option>
                <option value="paper">Cream Paper</option>
                <option value="paper-vintage">Vintage Paper</option>
                <option value="paper-crumpled">Crumpled</option>
                <option value="canvas">Canvas</option>
              </select>
            </div>
          </div>
        </div>

      </div>
      )}

      {/* Slide Container */}
      <div ref={exportTargetRef}
           className={`slide-export-target relative w-full h-full flex flex-col justify-between overflow-hidden shadow-md border border-brand-dark/10 transition-colors duration-300 break-words`}

           style={{ 
             backgroundColor: slide.bgColor, 
             '--title-outline': getOutlineStyle(),
             '--text-scale': `calc(${slide.fontSizeScale || 1} * var(--auto-scale, 1))`,
             '--color-card-dark': getAutoTextColor(slide.bgColor, slide.fontColor)
           } as React.CSSProperties}>
        
        {/* Global Texture Overlay */}
        {slide.globalTexture === 'noise' && (
          <div className="absolute inset-0 z-[60] pointer-events-none opacity-[0.2]" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')", backgroundSize: "cover", mixBlendMode: "overlay" }}></div>
        )}
        {slide.globalTexture === 'paper' && (
          <div className="absolute inset-0 z-[60] pointer-events-none opacity-[0.6]" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cream-paper.png')", mixBlendMode: "multiply" }}></div>
        )}
        {slide.globalTexture === 'paper-vintage' && (
          <div className="absolute inset-0 z-[60] pointer-events-none opacity-[0.6]" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/aged-paper.png')", mixBlendMode: "multiply" }}></div>
        )}
        {slide.globalTexture === 'paper-crumpled' && (
          <div className="absolute inset-0 z-[60] pointer-events-none opacity-[0.4]" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/noisy-grid.png')", mixBlendMode: "multiply" }}></div>
        )}
        {slide.globalTexture === 'canvas' && (
          <div className="absolute inset-0 z-[60] pointer-events-none opacity-[0.5]" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/stucco.png')", mixBlendMode: "multiply" }}></div>
        )}

        {/* Background Image Layer */}
        {renderBackgroundImage()}

        {/* Trendy Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-black/5 z-50">
          <div 
            className="h-full bg-[var(--color-card-accent)] transition-all duration-300" 
            style={{ width: `${((index + 1) / totalSlides) * 100}%` }}
          />
        </div>

        {/* Custom Accent Icon Layer */}
        {renderCustomAccent()}

        {/* Foreground Image Layer */}
        {renderForegroundImage()}

        {/* Layout Library Modal */}
        {!readOnly && isLayoutModalOpen && (
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
        {!readOnly && isAssetModalOpen && (
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
            
            <div className="flex justify-between items-center mb-4 shrink-0">
              <div className="flex gap-2">
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
                  Shapes
                </button>
              </div>
              
              {activeAssetTab === 'images' && (
                <button 
                  onClick={() => {
                    onUpdate({ customImage: undefined, imagePlaceholder: 'empty' });
                    setIsAssetModalOpen(false);
                  }}
                  className="text-[10px] font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-md hover:bg-red-100 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3 h-3" /> Clear Current Image
                </button>
              )}
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
                  <button
                    onClick={() => {
                      onUpdate({ accentIcon: 'none' });
                      setIsAssetModalOpen(false);
                    }}
                    className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${
                      slide.accentIcon === 'none'
                        ? 'border-brand-green bg-brand-green/5' 
                        : 'border-transparent bg-brand-dark/5 hover:border-brand-dark/20 hover:bg-brand-dark/10'
                    }`}
                  >
                    <X className="w-8 h-8 opacity-40 text-brand-dark" />
                    <span className="text-xs font-bold text-brand-dark">None</span>
                  </button>
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
        {!readOnly && isEditingText && (
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
              {slide.layout === 'step-list' || slide.layout === 'image-split' || slide.layout === 'photo-overlay' || slide.layout === 'bold-number' || slide.layout === 'info-donut-chart' || slide.layout === 'magazine-cover' ? (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-1">Step Number / Issue / Percentage</label>
                  <input 
                    type="text" 
                    value={slide.stepNumber !== undefined ? slide.stepNumber : ''} 
                    onChange={e => onUpdate({ stepNumber: e.target.value === '' ? undefined : e.target.value })} 
                    className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none" 
                    placeholder="e.g. 75 or 2" 
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
                  {slide.layout === 'info-stat-grid' || slide.layout === 'info-bar-chart' ? (
                    <div className="space-y-3 bg-brand-dark/5 p-3 rounded-lg border border-brand-dark/10">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold uppercase text-brand-dark/50">Data Points</span>
                        <button 
                          onClick={() => {
                            const contentArray = Array.isArray(slide.content) ? slide.content : (typeof slide.content === 'string' ? slide.content.split('\n') : []);
                            const newContent = [...contentArray];
                            newContent.push('New Value', 'New Label');
                            onUpdate({ content: newContent });
                          }}
                          className="text-[10px] bg-brand-green/10 text-brand-green px-2 py-1 rounded hover:bg-brand-green/20 transition-colors font-bold"
                        >
                          + ADD ITEM
                        </button>
                      </div>
                      {Array.from({ length: Math.max(1, Math.ceil((Array.isArray(slide.content) ? slide.content.length : 0) / 2)) }).map((_, i) => {
                        const contentArray = Array.isArray(slide.content) ? slide.content : (typeof slide.content === 'string' ? slide.content.split('\n') : []);
                        return (
                          <div key={i} className="flex flex-col gap-1 bg-white p-2 rounded border border-brand-dark/10 shadow-sm relative group">
                            <button 
                              onClick={() => {
                                const newContent = [...contentArray];
                                newContent.splice(i * 2, 2);
                                onUpdate({ content: newContent });
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                              title="Remove item"
                            >
                              ×
                            </button>
                            <input 
                              type="text" 
                              placeholder="Value (e.g. Free)"
                              className="w-full bg-transparent border-none p-1 text-xl font-serif text-brand-dark focus:ring-0 outline-none placeholder:text-brand-dark/20"
                              style={{ fontFamily: slide.fontTheme === 'modern' ? 'sans-serif' : 'serif' }}
                              value={contentArray[i * 2] || ''}
                              onChange={(e) => {
                                const newContent = [...contentArray];
                                newContent[i * 2] = e.target.value;
                                onUpdate({ content: newContent });
                              }}
                            />
                            <input 
                              type="text" 
                              placeholder="Label (e.g. Wi-Fi Access)"
                              className="w-full bg-transparent border-none p-1 text-xs font-bold text-brand-dark/60 focus:ring-0 outline-none placeholder:text-brand-dark/20 uppercase tracking-wider"
                              value={contentArray[i * 2 + 1] || ''}
                              onChange={(e) => {
                                const newContent = [...contentArray];
                                newContent[i * 2 + 1] = e.target.value;
                                onUpdate({ content: newContent });
                              }}
                            />
                          </div>
                        )
                      })}
                    </div>
                  ) : slide.layout === 'cta-minimal' ? (
                    <textarea 
                      value={typeof slide.content === 'string' ? slide.content : (Array.isArray(slide.content) ? slide.content.join('\n') : '')} 
                      onChange={e => onUpdate({ content: e.target.value.split('\n') })} 
                      className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none resize-none" 
                      placeholder="Enter items (one per line)" 
                      rows={5}
                    />
                  ) : (
                    <textarea 
                      value={typeof slide.content === 'string' ? slide.content : (Array.isArray(slide.content) ? slide.content.join('\n') : '')} 
                      onChange={e => onUpdate({ content: e.target.value })} 
                      className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none resize-none" 
                      placeholder="Enter body text..." 
                      rows={5}
                    />
                  )}
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

                  <div className="col-span-2 grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-1">Font Theme</label>
                      <select 
                        value={slide.fontTheme || 'modern'} 
                        onChange={e => onUpdate({ fontTheme: e.target.value as any })} 
                        className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none bg-white"
                      >
                        <option value="modern">Modern</option>
                        <option value="editorial">Editorial</option>
                        <option value="tech">Tech</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-1">Title Font</label>
                      <select 
                        value={slide.titleFont || 'default'} 
                        onChange={e => onUpdate({ titleFont: e.target.value as any })} 
                        className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none bg-white"
                      >
                        <option value="default">- Auto (Theme) -</option>
                        <option value="inter">Inter (Sans)</option>
                        <option value="outfit">Outfit (Display)</option>
                        <option value="playfair">Playfair (Serif)</option>
                        <option value="roboto">Roboto (Sans)</option>
                        <option value="montserrat">Montserrat (Sans)</option>
                        <option value="oswald">Oswald (Display)</option>
                        <option value="lora">Lora (Serif)</option>
                        <option value="lato">Lato (Sans)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-1">Body Font</label>
                      <select 
                        value={slide.bodyFont || 'default'} 
                        onChange={e => onUpdate({ bodyFont: e.target.value as any })} 
                        className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none bg-white"
                      >
                        <option value="default">- Auto (Theme) -</option>
                        <option value="inter">Inter (Sans)</option>
                        <option value="outfit">Outfit (Display)</option>
                        <option value="playfair">Playfair (Serif)</option>
                        <option value="roboto">Roboto (Sans)</option>
                        <option value="montserrat">Montserrat (Sans)</option>
                        <option value="oswald">Oswald (Display)</option>
                        <option value="lora">Lora (Serif)</option>
                        <option value="lato">Lato (Sans)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-1">Text Color</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={slide.fontColor || '#2B3A36'} 
                          onChange={e => onUpdate({ fontColor: e.target.value })}
                          className="w-8 h-8 rounded shrink-0 p-0 border-0 cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={slide.fontColor || ''} 
                          placeholder="#2B3A36"
                          onChange={e => onUpdate({ fontColor: e.target.value })}
                          className="w-full border border-brand-dark/20 rounded p-1.5 text-sm focus:ring-1 focus:ring-brand-green outline-none bg-white font-mono"
                        />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold uppercase text-brand-dark/50">Font Size Scale</label>
                        <span className="text-[9px] font-mono text-brand-dark/50">{slide.fontSizeScale ? slide.fontSizeScale.toFixed(2) : '1.00'}x</span>
                      </div>
                      <input 
                        type="range" min="0.5" max="2" step="0.05"
                        value={slide.fontSizeScale || 1}
                        onChange={e => onUpdate({ fontSizeScale: parseFloat(e.target.value) })}
                        className="w-full h-1.5 accent-brand-green"
                      />
                    </div>
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
                      <option value="paper">Cream Paper</option>
                      <option value="paper-vintage">Vintage Paper</option>
                      <option value="paper-crumpled">Crumpled Paper</option>
                      <option value="canvas">Canvas Overlay</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold uppercase text-brand-dark/50">Text Size Scale</label>
                      <span className="text-[10px] font-mono text-brand-dark/50">{Math.round((slide.fontSizeScale || 1) * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="1.5" 
                      step="0.05"
                      value={slide.fontSizeScale || 1} 
                      onChange={e => onUpdate({ fontSizeScale: parseFloat(e.target.value) })} 
                      className="w-full accent-brand-green"
                    />
                    <p className="text-[9px] text-brand-dark/40 mt-1">Adjust this if text is overflowing the card.</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-2">Overflow Handling</label>
                    <div className="flex gap-2">
                      {(['auto-scale', 'truncate', 'none'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => onUpdate({ overflowHandling: mode })}
                          className={`flex-1 py-1.5 px-2 text-[10px] font-bold uppercase rounded-md border transition-colors ${
                            (slide.overflowHandling || 'auto-scale') === mode
                              ? 'bg-brand-dark text-white border-brand-dark'
                              : 'bg-white text-brand-dark/70 border-brand-dark/20 hover:border-brand-dark/40'
                          }`}
                        >
                          {mode.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Image Layers Section */}
                  <div className="col-span-2 pt-4 border-t border-brand-dark/10">
                    <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-3">Advanced Image Layers</label>
                    
                    <div className="grid grid-cols-2 gap-6">
                      {/* Background Image Control */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold uppercase text-brand-dark/40">Background Layer</label>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => bgFileInputRef.current?.click()}
                              className="text-[9px] bg-brand-dark/5 hover:bg-brand-dark/10 px-2 py-0.5 rounded transition-colors"
                            >
                              {slide.bgImage ? 'Replace' : 'Upload'}
                            </button>
                            {slide.bgImage && (
                              <button 
                                onClick={() => onUpdate({ bgImage: undefined })}
                                className="text-[9px] bg-red-50 text-red-500 hover:bg-red-100 px-2 py-0.5 rounded transition-colors"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {slide.bgImage && (
                          <div className="space-y-3 pt-2">
                             <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-[9px] font-bold text-brand-dark/30 uppercase">Scale</label>
                                <span className="text-[9px] font-mono text-brand-dark/30">{Math.round((slide.bgImageScale || 1) * 100)}%</span>
                              </div>
                              <input 
                                type="range" min="0.1" max="3" step="0.1"
                                value={slide.bgImageScale || 1}
                                onChange={e => onUpdate({ bgImageScale: parseFloat(e.target.value) })}
                                className="w-full h-1 accent-brand-dark/20"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-[9px] font-bold text-brand-dark/30 uppercase">Opacity</label>
                                <span className="text-[9px] font-mono text-brand-dark/30">{Math.round((slide.bgImageOpacity ?? 1) * 100)}%</span>
                              </div>
                              <input 
                                type="range" min="0" max="1" step="0.05"
                                value={slide.bgImageOpacity ?? 1}
                                onChange={e => onUpdate({ bgImageOpacity: parseFloat(e.target.value) })}
                                className="w-full h-1 accent-brand-dark/20"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Foreground Image Control */}
                      <div className="space-y-3 border-l border-brand-dark/5 pl-6">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold uppercase text-brand-dark/40">Foreground Layer</label>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => fgFileInputRef.current?.click()}
                              className="text-[9px] bg-brand-dark/5 hover:bg-brand-dark/10 px-2 py-0.5 rounded transition-colors"
                            >
                              {slide.fgImage ? 'Replace' : 'Upload'}
                            </button>
                            {slide.fgImage && (
                              <button 
                                onClick={() => onUpdate({ fgImage: undefined })}
                                className="text-[9px] bg-red-50 text-red-500 hover:bg-red-100 px-2 py-0.5 rounded transition-colors"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>

                        {slide.fgImage && (
                          <div className="space-y-3 pt-2">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-[9px] font-bold text-brand-dark/30 uppercase">Scale</label>
                                <span className="text-[9px] font-mono text-brand-dark/30">{Math.round((slide.fgImageScale || 1) * 100)}%</span>
                              </div>
                              <input 
                                type="range" min="0.1" max="2" step="0.05"
                                value={slide.fgImageScale || 1}
                                onChange={e => onUpdate({ fgImageScale: parseFloat(e.target.value) })}
                                className="w-full h-1 accent-brand-dark/20"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-[9px] font-bold text-brand-dark/30 uppercase">X Position</label>
                                <span className="text-[9px] font-mono text-brand-dark/30">{Math.round(slide.fgImageX ?? 50)}%</span>
                              </div>
                              <input 
                                type="range" min="-20" max="120" step="1"
                                value={slide.fgImageX ?? 50}
                                onChange={e => onUpdate({ fgImageX: parseInt(e.target.value) })}
                                className="w-full h-1 accent-brand-dark/20"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-[9px] font-bold text-brand-dark/30 uppercase">Y Position</label>
                                <span className="text-[9px] font-mono text-brand-dark/30">{Math.round(slide.fgImageY ?? 50)}%</span>
                              </div>
                              <input 
                                type="range" min="-20" max="120" step="1"
                                value={slide.fgImageY ?? 50}
                                onChange={e => onUpdate({ fgImageY: parseInt(e.target.value) })}
                                className="w-full h-1 accent-brand-dark/20"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-[9px] font-bold text-brand-dark/30 uppercase">Rotation</label>
                                <span className="text-[9px] font-mono text-brand-dark/30">{slide.fgImageRotation ?? 0}°</span>
                              </div>
                              <input 
                                type="range" min="0" max="360" step="5"
                                value={slide.fgImageRotation ?? 0}
                                onChange={e => onUpdate({ fgImageRotation: parseInt(e.target.value) })}
                                className="w-full h-1 accent-brand-dark/20"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Accent Icon Section */}
                  <div className="col-span-2 pt-4 border-t border-brand-dark/10">
                    <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-3">Custom Accent Icon</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-brand-dark/40 mb-1">Select Icon</label>
                        <select 
                          value={slide.accentIcon || 'none'} 
                          onChange={e => onUpdate({ accentIcon: e.target.value as any })} 
                          className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none bg-white"
                        >
                          <option value="none">None</option>
                          {NZ_ACCENTS.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                          ))}
                        </select>
                      </div>
                      {slide.accentIcon && slide.accentIcon !== 'none' && (
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[10px] font-bold uppercase text-brand-dark/40">Color</label>
                            {slide.accentColor && (
                              <button 
                                onClick={() => onUpdate({ accentColor: undefined })}
                                className="text-[9px] text-brand-green font-bold uppercase hover:underline"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                          <input 
                            type="color" 
                            value={slide.accentColor || '#000000'} 
                            onChange={e => onUpdate({ accentColor: e.target.value })} 
                            className="w-full h-9 p-1 bg-white border border-brand-dark/20 rounded cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                    
                    {slide.accentIcon && slide.accentIcon !== 'none' && (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-4">
                        <div className="flex gap-2 items-end">
                          <button
                            onClick={() => onUpdate({ accentFlipX: !slide.accentFlipX })}
                            className={`flex-1 py-1 px-2 text-[9px] font-bold uppercase rounded border transition-colors ${slide.accentFlipX ? 'bg-brand-dark text-white border-brand-dark' : 'bg-white text-brand-dark border-brand-dark/20 hover:border-brand-dark/40'}`}
                          >
                            Flip X
                          </button>
                          <button
                            onClick={() => onUpdate({ accentFlipY: !slide.accentFlipY })}
                            className={`flex-1 py-1 px-2 text-[9px] font-bold uppercase rounded border transition-colors ${slide.accentFlipY ? 'bg-brand-dark text-white border-brand-dark' : 'bg-white text-brand-dark border-brand-dark/20 hover:border-brand-dark/40'}`}
                          >
                            Flip Y
                          </button>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-bold uppercase text-brand-dark/40">Rotation</label>
                            <span className="text-[9px] font-mono text-brand-dark/40">{slide.accentRotation ?? 0}°</span>
                          </div>
                          <input 
                            type="range" min="0" max="360" step="5"
                            value={slide.accentRotation ?? 0}
                            onChange={e => onUpdate({ accentRotation: parseInt(e.target.value) })}
                            className="w-full h-1.5 accent-brand-green"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-bold uppercase text-brand-dark/40">Size</label>
                            <span className="text-[9px] font-mono text-brand-dark/40">{Math.round((slide.accentSize || 1) * 100)}%</span>
                          </div>
                          <input 
                            type="range" min="0.2" max="3" step="0.1"
                            value={slide.accentSize || 1}
                            onChange={e => onUpdate({ accentSize: parseFloat(e.target.value) })}
                            className="w-full h-1.5 accent-brand-green"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-bold uppercase text-brand-dark/40">Opacity</label>
                            <span className="text-[9px] font-mono text-brand-dark/40">{Math.round((slide.accentOpacity ?? 0.2) * 100)}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="1" step="0.05"
                            value={slide.accentOpacity ?? 0.2}
                            onChange={e => onUpdate({ accentOpacity: parseFloat(e.target.value) })}
                            className="w-full h-1.5 accent-brand-green"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-bold uppercase text-brand-dark/40">X Position</label>
                            <span className="text-[9px] font-mono text-brand-dark/40">{Math.round(slide.accentX ?? 85)}%</span>
                          </div>
                          <input 
                            type="range" min="-20" max="120" step="1"
                            value={slide.accentX ?? 85}
                            onChange={e => onUpdate({ accentX: parseInt(e.target.value) })}
                            className="w-full h-1.5 accent-brand-green"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-bold uppercase text-brand-dark/40">Y Position</label>
                            <span className="text-[9px] font-mono text-brand-dark/40">{Math.round(slide.accentY ?? 15)}%</span>
                          </div>
                          <input 
                            type="range" min="-20" max="120" step="1"
                            value={slide.accentY ?? 15}
                            onChange={e => onUpdate({ accentY: parseInt(e.target.value) })}
                            className="w-full h-1.5 accent-brand-green"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Render the specific layout */}
        <div className="w-full h-full relative z-10 break-words">
          {renderLayout()}
        </div>
      </div>
    </div>
  );
}

