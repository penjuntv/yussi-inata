const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// We want to create a new component `SlideEditorPanel` directly above `SlidePreview`.
// First, extract the modal inputs.
const newSidebarComponent = `
function SlideEditorPanel({ slide, onUpdate }: { slide: Slide, onUpdate: (updates: PartialSlide) => void }) {
  const [activeTab, setActiveTab] = React.useState('text');
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
            className={\`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 \${activeTab === tab.id ? 'bg-brand-green text-white' : 'bg-brand-dark/5 hover:bg-brand-dark/10 text-brand-dark/70'}\`}
          >
            <tab.icon className="w-3.5 h-3.5" />
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
                  className={\`flex flex-col text-left p-3 rounded-xl border-2 transition-all \${isActive ? 'border-brand-green bg-brand-green/5' : 'border-brand-dark/10 hover:border-brand-green/50 hover:bg-gray-50'}\`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={\`p-1.5 rounded-md \${isActive ? 'bg-brand-green text-white' : 'bg-brand-dark/5 text-brand-dark'}\`}>
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
            {slide.layout === 'step-list' || slide.layout === 'image-split' || slide.layout === 'photo-overlay' || slide.layout === 'bold-number' || slide.layout === 'info-donut-chart' ? (
              <div>
                <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-1">Step Number / Percentage</label>
                <input 
                  type="text" 
                  value={slide.stepNumber !== undefined ? slide.stepNumber : ''} 
                  onChange={e => onUpdate({ stepNumber: e.target.value === '' ? undefined : e.target.value })} 
                  className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none" 
                  placeholder="e.g. 75 or 2 (1/2)" 
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
                          const contentArray = Array.isArray(slide.content) ? slide.content : (typeof slide.content === 'string' ? slide.content.split('\\n') : []);
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
                      const contentArray = Array.isArray(slide.content) ? slide.content : (typeof slide.content === 'string' ? slide.content.split('\\n') : []);
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
                    value={typeof slide.content === 'string' ? slide.content : (Array.isArray(slide.content) ? slide.content.join('\\n') : '')} 
                    onChange={e => onUpdate({ content: e.target.value.split('\\n') })} 
                    className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none resize-none" 
                    placeholder="Enter items (one per line)" 
                    rows={5}
                  />
                ) : (
                  <textarea 
                    value={typeof slide.content === 'string' ? slide.content : (Array.isArray(slide.content) ? slide.content.join('\\n') : '')} 
                    onChange={e => onUpdate({ content: e.target.value })} 
                    className="w-full border border-brand-dark/20 rounded p-2 text-sm focus:ring-1 focus:ring-brand-green outline-none resize-none" 
                    placeholder="Enter body text..." 
                    rows={5}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'style' && (
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-1">Slide Global Background</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={slide.bgColor || '#ffffff'} 
                      onChange={e => onUpdate({ bgColor: e.target.value })}
                      className="w-8 h-8 rounded shrink-0 p-0 border-0 cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={slide.bgColor || ''} 
                      placeholder="#FFFFFF"
                      onChange={e => onUpdate({ bgColor: e.target.value })}
                      className="w-full border border-brand-dark/20 rounded p-1.5 text-sm focus:ring-1 focus:ring-brand-green outline-none bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="col-span-2">
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

            <div>
              <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-2">Preset Images</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdate({ customImage: undefined, imagePlaceholder: 'empty' })}
                  className="relative p-2 rounded border-2 border-brand-dark/10 hover:border-brand-green/50 flex items-center justify-center bg-gray-50 h-24"
                >
                  <span className="text-xs font-bold text-gray-400">Clear Image</span>
                </button>
                {NZ_IMAGES.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => onUpdate({ customImage: url })}
                    className="relative aspect-square rounded overflow-hidden border-2 border-transparent hover:border-brand-green transition-all"
                  >
                    <img src={url} alt={\`Asset \${i}\`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-brand-dark/10">
              <label className="block text-[10px] font-bold uppercase text-brand-dark/50 mb-2">Preset Accents</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onUpdate({ accentIcon: 'none' })}
                  className={\`relative p-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 \${
                    slide.accentIcon === 'none'
                      ? 'border-brand-green bg-brand-green/5' 
                      : 'border-transparent bg-brand-dark/5 hover:border-brand-dark/20 hover:bg-brand-dark/10'
                  }\`}
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
                      className={\`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all \${isActive ? 'border-brand-green bg-brand-green/5' : 'border-brand-dark/10 hover:border-brand-green/50 hover:bg-gray-50'}\`}
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
                          <button onClick={() => onUpdate({ accentFlipX: !slide.accentFlipX })} className={\`py-1.5 px-1 text-[9px] font-bold uppercase rounded border \${slide.accentFlipX ? 'bg-brand-dark text-white border-brand-dark' : 'bg-white border-brand-dark/20'}\`}>Flip X</button>
                          <button onClick={() => onUpdate({ accentFlipY: !slide.accentFlipY })} className={\`py-1.5 px-1 text-[9px] font-bold uppercase rounded border \${slide.accentFlipY ? 'bg-brand-dark text-white border-brand-dark' : 'bg-white border-brand-dark/20'}\`}>Flip Y</button>
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

// Add this wrapper component to simulate iPhone preview
function PhonePreview({ slide, totalSlides, index }: { slide: Slide, totalSlides: number, index: number }) {
  return (
    <div className="w-[375px] h-[812px] bg-black rounded-[50px] shadow-2xl relative border-[12px] border-black flex flex-col overflow-hidden shrink-0 scale-95 origin-center isolate">
      {/* Dynamic Island */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-b-3xl z-50"></div>
      
      {/* App Header (Fake IG/TikTok standard) */}
      <div className="h-14 bg-white flex items-center justify-between px-4 pt-4 shrink-0 shadow-sm z-40 relative">
        <span className="font-bold text-sm tracking-tight">MHJ.NZ</span>
        <div className="flex items-center gap-3">
           <Heart className="w-5 h-5 text-gray-800" />
           <Send className="w-5 h-5 text-gray-800" />
        </div>
      </div>

      {/* Main Slide Carousel Area (1:1 or 4:5 aspect ratio) */}
      <div className="flex-1 overflow-hidden bg-[var(--color-card-bg)] flex items-center justify-center w-full relative z-10">
        <SlidePreview 
          slide={slide}
          onUpdate={() => {}}
          aspectRatio="4/5" // Standard carousel post size
          totalSlides={totalSlides}
          index={index}
          readOnly={true} // new prop to prevent modals
        />
      </div>

      {/* App Footer */ }
      <div className="h-20 bg-white border-t border-gray-100 flex items-center justify-around px-4 shrink-0 pb-4 relative z-40">
        <Home className="w-6 h-6 text-gray-800" />
        <Search className="w-6 h-6 text-gray-800" />
        <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center">
          <Plus className="w-5 h-5" />
        </div>
        <LayoutTemplate className="w-6 h-6 text-gray-800" />
        <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden"><User className="w-full h-full text-gray-400 p-1" /></div>
      </div>
    </div>
  );
}
`;

// Now we need to modify SlidePreview to support readOnly
// We find SlidePreview definition
content = content.replace(
  /export function SlidePreview\(\{ slide, onUpdate, aspectRatio = 'square', totalSlides, index \}: \{ slide: Slide; onUpdate: \(updates: PartialSlide\) => void; aspectRatio\?\: 'square' \| '4\/5', totalSlides: number, index: number \}\) \{/g,
  "export function SlidePreview({ slide, onUpdate, aspectRatio = 'square', totalSlides, index, readOnly = false }: { slide: Slide; onUpdate: (updates: PartialSlide) => void; aspectRatio?: 'square' | '4/5', totalSlides: number, index: number, readOnly?: boolean }) {"
);

// We need to hide the toolbars if readOnly is true
// The toolbars start at `<div className="absolute top-4 right-4 flex gap-2 z-[100] transition-opacity duration-300 opacity-0 group-hover:opacity-100">`
// And the bottom toolbar is `<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-brand-dark/10 p-1.5 z-[100] opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">`

// Easiest hack: string replacement to prefix with `{!readOnly && (`
content = content.replace(
  /<div className="absolute top-4 right-4 flex gap-2 z-\[100\]/g,
  "{!readOnly && <div className=\"absolute top-4 right-4 flex gap-2 z-[100]"
);
// Need to carefully close it... actually it's easier to use a regex that safely matches the main App return.

// Wait, since we are doing a massive UI overhaul, let's substitute the App return entirely.
const mainAppReturnRegex = /return \(\s*<div className="min-h-screen bg-\[\#FDFBF7\].*?\)[\s]*;/s;

const newAppReturn = `
  const [activeSlideId, setActiveSlideId] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (slides.length > 0 && activeSlideId === null) {
      setActiveSlideId(slides[0].id);
    } else if (slides.length === 0) {
      setActiveSlideId(null);
    }
  }, [slides, activeSlideId]);

  const activeSlide = React.useMemo(() => slides.find(s => s.id === activeSlideId), [slides, activeSlideId]);

  return (
    <div className="flex h-screen w-full bg-[#FDFBF7] font-sans text-brand-dark overflow-hidden">
      {/* LEFT SIDEBAR (FIXED WIDTH) */}
      <div className="w-[380px] h-full border-r border-brand-dark/10 bg-white shadow-2xl z-20 flex flex-col shrink-0">
        
        {/* Logo / Header */}
        <div className="p-5 border-b border-brand-dark/5 bg-brand-dark/5 flex items-center justify-between shrink-0">
          <div className="font-sans font-black tracking-tighter text-2xl flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-green" />
            MHJ<span className="text-brand-green">.NZ</span>
          </div>
          {slides.length > 0 && (
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
        {!slides.length ? (
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
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Wand2 className="w-4 h-4 text-brand-green" />
                    <label className="font-bold text-sm text-brand-dark">Primary Language</label>
                  </div>
                  <select 
                    value={language} 
                    onChange={e => setLanguage(e.target.value)} 
                    className="w-full p-2.5 rounded-lg border border-brand-dark/20 bg-white font-bold text-sm outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green text-brand-dark"
                  >
                     <option value="English">English</option>
                     <option value="Korean">한국어 (Korean)</option>
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
                className={\`w-full py-4 rounded-xl font-bold text-base flex flex-col items-center justify-center transition-all bg-brand-green text-white shadow-lg hover:shadow-xl hover:-translate-y-1 \${
                  (isGenerating || !input.trim()) ? 'opacity-50 cursor-not-allowed transform-none' : ''
                }\`}
             >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{generatingMsg}</span>
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
                onUpdate={(updates) => handleSlideUpdate(activeSlideId, updates)} 
              />
            ) : (
              <div className="p-8 text-center text-brand-dark/50">
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
           {slides.length > 0 && (
              <button
                onClick={exportToZip}
                disabled={isDownloading}
                className={\`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-brand-dark text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 \${
                  isDownloading ? 'opacity-75 cursor-wait' : ''
                }\`}
              >
                {isDownloading ? (
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
          
           {slides.length === 0 ? (
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
        {slides.length > 0 && (
           <div className="h-44 bg-white border-t border-brand-dark/10 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] shrink-0 flex items-center px-6 gap-6 overflow-x-auto z-20 hide-scrollbar relative">
              <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
              {slides.map((slide, i) => (
                <button 
                  key={slide.id}
                  onClick={() => setActiveSlideId(slide.id)} 
                  className={\`relative h-32 aspect-[4/5] rounded-xl overflow-hidden shrink-0 transition-all duration-300 ring-offset-2 hover:scale-105 group \${
                    activeSlideId === slide.id 
                    ? 'ring-4 ring-brand-green shadow-xl z-10 scale-105' 
                    : 'opacity-50 hover:opacity-100 ring-1 ring-gray-200'
                  }\`}
                >
                  <div className="absolute top-2 left-2 z-[60] bg-black/50 text-white text-[10px] font-bold px-1.5 rounded backdrop-blur-md">
                    {i + 1}
                  </div>
                  {/* Super scaled down version of the slide */}
                  <div className="pointer-events-none w-[1080px] h-[1350px] origin-top-left scale-[0.095]">
                     <SlidePreview slide={slide} onUpdate={() => {}} aspectRatio="4/5" totalSlides={slides.length} index={i} readOnly={true} />
                  </div>
                </button>
              ))}
              <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
           </div>
        )}
        
        {/* Hidden Export Container */}
        {(isDownloading) && (
            <div className="fixed top-0 left-0 z-[-9999] opacity-0 pointer-events-none w-0 h-0 overflow-hidden hide-scrollbar">
              <div ref={slidesRef} className="flex flex-col gap-10 bg-white p-10">
                {slides.map((slide, i) => (
                  <div key={slide.id} className="w-[1080px]">
                    <SlidePreview slide={slide} onUpdate={() => {}} aspectRatio="4/5" totalSlides={slides.length} index={i} readOnly={true} />
                  </div>
                ))}
              </div>
            </div>
        )}
      </div>
    </div>
  );
`;

content = newSidebarComponent + "\\n" + content.replace(mainAppReturnRegex, newAppReturn + "\\n  }");

// Fix the hidden export container conditionally logic, since slidesRef is used, we need it to be bound.
// Notice I added it in the newAppReturn. We should ensure the Home, Search, Plus icons are imported.
content = `import { Home, Search, Plus, Send } from 'lucide-react';\n` + content;

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx rewritten');
