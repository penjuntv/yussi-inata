const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const startPattern = '  return (\n    <div className="min-h-screen bg-brand-beige text-brand-dark font-sans selection:bg-brand-green selection:text-white pb-20">';
const endPattern = '      </main>\n    </div>\n  );\n}';

const startIndex = content.indexOf(startPattern);
if (startIndex === -1) {
  console.log("Start pattern not found");
  process.exit(1);
}

const endIndex = content.indexOf(endPattern, startIndex);
if (endIndex === -1) {
  console.log("End pattern not found!");
  process.exit(1);
}

const appLogic = `
  const [activeSlideId, setActiveSlideId] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (slides && slides.length > 0 && activeSlideId === null) {
      setActiveSlideId(slides[0].id);
    } else if (!slides || slides.length === 0) {
      setActiveSlideId(null);
    }
  }, [slides, activeSlideId]);

  const activeSlide = React.useMemo(() => slides ? slides.find(s => s.id === activeSlideId) : undefined, [slides, activeSlideId]);

  const updateSlide = (id: number, updates: Partial<Slide>) => {
    if (!slides) return;
    setPast(prev => [...prev, slides]);
    setFuture([]);
    setSlides(slides.map(s => s.id === id ? { ...s, ...updates } : s));
  };
`;

const newAppReturn = `  return (
    <div className="flex h-screen w-full bg-[#FDFBF7] font-sans text-brand-dark overflow-hidden">
      {/* LEFT SIDEBAR (FIXED WIDTH) */}
      <div className="w-[380px] h-full border-r border-brand-dark/10 bg-white shadow-2xl z-20 flex flex-col shrink-0">
        
        {/* Logo / Header */}
        <div className="p-5 border-b border-brand-dark/5 bg-brand-dark/5 flex items-center justify-between shrink-0">
          <div className="font-sans font-black tracking-tighter text-2xl flex items-center gap-2">
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
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <h2 className="text-lg font-bold">Create New Carousel</h2>
            {/* Context Inputs */}
             <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4 text-brand-green" />
                    <label className="font-bold text-sm text-brand-dark">Content Source</label>
                  </div>
                  <textarea
                    className="w-full h-40 p-4 rounded-xl border border-brand-dark/20 focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none resize-none shadow-inner bg-white text-brand-dark text-sm"
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
                className={\`w-full py-4 rounded-xl font-bold text-base flex flex-col items-center justify-center transition-all bg-brand-green text-white shadow-lg \${
                  (isGenerating || !input.trim()) ? 'opacity-50 cursor-not-allowed transform-none' : 'hover:shadow-xl hover:-translate-y-1'
                }\`}
             >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating...</span>
                  </div>
                ) : (
                  <>
                    <span>Generate Card News</span>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded mt-1 font-mono uppercase tracking-wider">Powered by Gemini 2.5 Pro</span>
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
      <div className="flex-1 h-full flex flex-col relative bg-gray-100">
        
        {/* Top bar with Download */}
        <div className="absolute top-4 right-4 z-50">
           {slides && slides.length > 0 && (
              <button
                onClick={handleExport}
                disabled={isExporting}
                className={\`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-brand-dark text-white shadow-lg transition-all \${
                  isExporting ? 'opacity-75 cursor-wait' : 'hover:shadow-xl hover:-translate-y-1'
                }\`}
              >
                {isExporting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Preparing ZIP...</>
                ) : (
                  <><Download className="w-4 h-4" /> Download All (ZIP)</>
                )}
              </button>
           )}
        </div>

        {/* CENTER VIEW: iPhone Mode */}
        <div className="flex-1 w-full flex items-center justify-center p-8 overflow-hidden relative">
          {/* Subtle background grid pattern */}
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: "linear-gradient(to right, #ccc 1px, transparent 1px), linear-gradient(to bottom, #ccc 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
          
           {!slides || slides.length === 0 ? (
             <div className="text-center z-10 flex flex-col items-center">
               <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center mb-6">
                 <Wand2 className="w-10 h-10 text-brand-green" />
               </div>
               <h1 className="text-3xl font-black mb-2">Workspace</h1>
               <p className="text-gray-500 max-w-sm text-balance">Enter your content on the left to see the AI magic happen here.</p>
             </div>
           ) : activeSlide ? (
             <div className="z-10 transition-all duration-500 transform hover:scale-[1.02]">
                <PhonePreview slide={activeSlide} totalSlides={slides.length} index={slides.findIndex(s => s.id === activeSlideId)} />
             </div>
           ) : null}
        </div>

        {/* BOTTOM VIEW: Filmstrip Gallery */}
        {slides && slides.length > 0 && (
           <div className="h-44 bg-white border-t border-brand-dark/10 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] shrink-0 flex items-center px-6 gap-6 overflow-x-auto z-20 hide-scrollbar relative">
              <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
              {slides.map((slide, i) => (
                <button 
                  key={slide.id}
                  onClick={() => setActiveSlideId(slide.id)} 
                  className={\`relative h-32 aspect-[4/5] rounded-xl overflow-hidden shrink-0 transition-all duration-300 ring-offset-2 hover:scale-105 group \${
                    activeSlideId === slide.id 
                    ? 'ring-4 ring-brand-green shadow-xl z-30 scale-110' 
                    : 'opacity-50 hover:opacity-100 ring-1 ring-gray-200 z-20'
                  }\`}
                >
                  <div className="absolute top-2 left-2 z-[60] bg-black/50 text-white text-[10px] font-bold px-1.5 rounded backdrop-blur-md">
                    {i + 1}
                  </div>
                  {/* Super scaled down version of the slide */}
                  <div className="pointer-events-none w-[1080px] h-[1350px] origin-top-left scale-[0.095] bg-black">
                     <SlidePreview slide={slide} onUpdate={() => {}} aspectRatio="4/5" totalSlides={slides.length} index={i} readOnly={true} />
                  </div>
                </button>
              ))}
              <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
           </div>
        )}
        
        {/* Hidden Export Container */}
        {(isExporting) && (
            <div className="fixed top-0 left-0 z-[-9999] opacity-0 pointer-events-none w-0 h-0 overflow-hidden hide-scrollbar">
              <div ref={slidesRef} className="flex flex-col gap-10 bg-white p-10">
                {slides.map((slide, i) => (
                  <div key={slide.id} className="w-[1080px] slide-export-target" style={{ aspectRatio: aspectRatio === '4/5' ? '4/5' : '1/1' }}>
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
`;

const statePattern = '  const slidesRef = useRef<HTMLDivElement>(null);';
const stateIndex = content.indexOf(statePattern);

let newContent = content;

newContent = newContent.slice(0, startIndex) + newAppReturn + '\n' + newContent.slice(endIndex + endPattern.length);

if (stateIndex !== -1 && newContent.indexOf('const [activeSlideId') === -1) {
  const insertPos = stateIndex + statePattern.length;
  newContent = newContent.slice(0, insertPos) + '\n' + appLogic + newContent.slice(insertPos);
}

fs.writeFileSync('src/App.tsx', newContent);
console.log('App return replaced successfully');
