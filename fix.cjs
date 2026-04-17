const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. We need to split the file. The file currently looks like:
// import { Home, Search, Plus, Send } from 'lucide-react';
// function SlideEditorPanel(...) { ... }
// function PhonePreview(...) { ... }
// import ...

// Everything up to line 541 is the prepended stuff.
const lines = content.split('\n');

let prependedCode = lines.slice(0, 541).join('\n');
let restOfCode = lines.slice(541).join('\n');

// Fix the duplicate import issue in prependedCode
prependedCode = prependedCode.replace("import { Home, Search, Plus, Send } from 'lucide-react';", "");
prependedCode = prependedCode.replace(/PartialSlide/g, "Partial<Slide>");

// Fix lucide-react imports in restOfCode
restOfCode = restOfCode.replace(
  /Image as ImageIcon, Save, Share2, Heart, Bookmark, Loader2, Download,/,
  "Image as ImageIcon, Save, Share2, Heart, Bookmark, Loader2, Download, Home, Search, Plus, Send, Sparkles, Sliders,"
);
// Remove the duplicate Send from the import
restOfCode = restOfCode.replace("MessageCircle, Send, ArrowDown", "MessageCircle, ArrowDown");

// Fix SlidePreview definition
restOfCode = restOfCode.replace(
  /function SlidePreview\(\{ slide, index, totalSlides, onUpdate, aspectRatio \}: \{ slide: Slide; index: number; totalSlides: number; onUpdate: \(u: Partial<Slide>\) => void; aspectRatio: '4\/5' \| '1\/1'; key\?: React.Key \}\) \{/g,
  "function SlidePreview({ slide, index, totalSlides, onUpdate, aspectRatio, readOnly = false }: { slide: Slide; index: number; totalSlides: number; onUpdate: (u: Partial<Slide>) => void; aspectRatio?: '4/5' | '1/1' | 'square'; key?: React.Key; readOnly?: boolean }) {"
);

// Remove the `{!readOnly && (` hack if it failed or is incomplete. 
// No, the hack was for `<div className="absolute top-4 right-4 flex gap-2 z-[100]` which is actually in `SlidePreview`. Let's just safely find and replace it.

// Let's find where the types end. 
// type LayoutType = ...
// interface Slide { ... }
// const NZ_IMAGES = ...
// const NZ_ACCENTS = ...
// const LAYOUTS = ...
// It's easiest to place `SlideEditorPanel` and `PhonePreview` AFTER `const THEMES = ...` or right before `export default function App() {`
const appIndex = restOfCode.indexOf('export default function App() {');
const newContent = restOfCode.slice(0, appIndex) + "\n\n" + prependedCode + "\n\n" + restOfCode.slice(appIndex);

fs.writeFileSync('src/App.tsx', newContent);
console.log('App.tsx rewritten again');
