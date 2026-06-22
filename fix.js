const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Hover animations smooth butter
content = content.replace(/transition-all(?!\s+duration-)/g, 'transition-all duration-500 ease-out');
content = content.replace(/transition-colors(?!\s+duration-)/g, 'transition-colors duration-500 ease-out');
content = content.replace(/transition-transform(?!\s+duration-)/g, 'transition-transform duration-500 ease-out');

// 2. Hero Section Adjustments
const heroRegex = /<section className="pt-20 sm:pt-32 pb-16 relative" id="hero">\s*<div className="max-w-7xl mx-auto px-4 sm:px-8 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">\s*{\/\* Left Side: Text \*\/}\s*<div className="order-2 lg:order-1">\s*<h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">\s*Don't Sign Away Your Rights\.\{" "\}\s*<br className="hidden md:block" \/>\s*<span className="text-indigo-400">Let AI Read the Fine Print\.<\/span>\s*<\/h1>/;

const heroReplacement = `<section className="pt-20 sm:pt-32 pb-16 relative" id="hero">
            <div className="max-w-7xl mx-auto px-4 sm:px-8">
              {/* Main Hero Text Centered at the top */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-16 text-center max-w-4xl mx-auto">
                Don't Sign Away Your Rights.{" "}
                <br className="hidden md:block" />
                <span className="text-indigo-400">Let AI Read the Fine Print.</span>
              </h1>
              
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              {/* Left Side: Text */}
              <div className="order-2 lg:order-1">`;
content = content.replace(heroRegex, heroReplacement);

// Add closing </div> for the new max-w-7xl wrapper in Hero section
const heroEndRegex = /{\/\* EXACT COPY of existing input logic ends here \*\/}\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/section>/;
const heroEndReplacement = `{/* EXACT COPY of existing input logic ends here */}
                </div>
              </div>
            </div>
            </div>
          </section>`;
content = content.replace(heroEndRegex, heroEndReplacement);

// 3. Product Demo Section
// Make sure to escape regex characters. Instead of regex, let's use string split and join or exact replacement.
const demoRegex = /<section className="py-24 relative overflow-hidden">\s*<div className="max-w-7xl mx-auto px-4 sm:px-8">\s*<div className="grid lg:grid-cols-2 gap-16 items-center">/;
const demoReplacement = `<section className="py-24 relative overflow-hidden">
              <div className="max-w-7xl mx-auto px-4 sm:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Spot Red Flags Instantly</h2>
                  <p className="text-lg text-zinc-400 max-w-2xl mx-auto">Upload your contract and Vera will highlight exactly what you need to look out for.</p>
                </div>
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">`;
content = content.replace(demoRegex, demoReplacement);

// Update Demo section card (the mockup)
content = content.replace(
    /relative h-\[400px\] bg-\[#121216\] border border-white\/10 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl">\s*<div className="absolute inset-0 bg-gradient-to-br from-indigo-500\/10 to-transparent"><\/div>\s*<div className="flex flex-col items-center gap-4 z-10">\s*<div className="w-20 h-20 bg-white\/5 rounded-2xl flex items-center justify-center border border-white\/10 shadow-lg">\s*<svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth=\{1\.5\}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9\.414a1 1 0 00-\.293-\.707l-5\.414-5\.414A1 1 0 0012\.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" \/><\/svg>\s*<\/div>\s*<span className="font-mono text-sm text-zinc-400 bg-black\/40 px-3 py-1 rounded-md border border-white\/5">CLIENT_AGREEMENT\.pdf<\/span>\s*<\/div>\s*<\/div>/,
    `relative h-[400px] bg-[#1a1a24] border border-white/20 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
                    <div className="h-12 border-b border-white/10 bg-[#121216] flex items-center px-4 gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                      <span className="ml-4 font-mono text-xs text-zinc-500">CLIENT_AGREEMENT.pdf</span>
                    </div>
                    <div className="flex-grow p-8 flex flex-col gap-6">
                      <div className="h-4 bg-white/10 rounded-full w-3/4"></div>
                      <div className="h-4 bg-white/10 rounded-full w-full"></div>
                      <div className="h-4 bg-white/10 rounded-full w-5/6"></div>
                      <div className="h-4 bg-indigo-500/30 rounded-full w-full relative">
                        <div className="absolute inset-0 border-2 border-indigo-500/50 rounded-full animate-pulse"></div>
                      </div>
                      <div className="h-4 bg-white/10 rounded-full w-2/3"></div>
                      <div className="h-4 bg-white/10 rounded-full w-4/5"></div>
                      <div className="h-4 bg-red-500/30 rounded-full w-full relative mt-4">
                        <div className="absolute inset-0 border-2 border-red-500/50 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>`
);

// Update Demo section spacing for the right-side cards
content = content.replace(
    /relative -ml-8 lg:-ml-16 z-20 backdrop-blur-xl hover:-translate-y-1/g,
    'relative z-20 backdrop-blur-xl hover:-translate-y-1'
);

content = content.replace(
    /relative ml-4 lg:ml-8 z-20 backdrop-blur-xl hover:-translate-y-1/g,
    'relative z-20 backdrop-blur-xl hover:-translate-y-1'
);


// 4. Swap FAQ and Final CTA
const faqRegex = /{\/\* 12\. FAQ Section \*\/}\s*<section id="faq" className="py-24">[\s\S]*?<\/section>/;
const ctaRegex = /{\/\* 13\. Final CTA Section \*\/}\s*<section className="py-32 relative overflow-hidden">[\s\S]*?<\/section>/;

const faqMatch = content.match(faqRegex);
const ctaMatch = content.match(ctaRegex);

if (faqMatch && ctaMatch) {
    const faqContent = faqMatch[0].replace('12.', '13.');
    const ctaContent = ctaMatch[0].replace('13.', '12.');
    
    const swapped = ctaContent + '\\n\\n            ' + faqContent;
    
    const combinedRegex = new RegExp(faqRegex.source + '\\s*' + ctaRegex.source);
    content = content.replace(combinedRegex, swapped);
}

fs.writeFileSync('src/app/page.tsx', content);
console.log('Script completed.');
