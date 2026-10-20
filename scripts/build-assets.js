import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'assets');
fs.mkdirSync(output, { recursive: true });

const themes = {
  dark: {
    bg: '#0d1117', bg2: '#0a0f1f', panel: '#101827', panel2: '#121d30',
    text: '#e6edf3', muted: '#8b9bb4', cyan: '#00f5ff', magenta: '#ff2bd6',
    violet: '#7c3aed', lime: '#a3ff12', blue: '#3b82f6', red: '#ff5b7f',
    grid: '#24556f', shadow: '#000000',
  },
  light: {
    bg: '#ffffff', bg2: '#eef2ff', panel: '#f8faff', panel2: '#e8edff',
    text: '#1f2328', muted: '#596579', cyan: '#0969da', magenta: '#d1242f',
    violet: '#8250df', lime: '#188038', blue: '#0969da', red: '#cf222e',
    grid: '#8ba6d9', shadow: '#4b5c7a',
  },
};

const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const commonStyle = `
  text { font-family: 'Segoe UI', Ubuntu, Arial, sans-serif; }
  .mono { font-family: 'Courier New', monospace; }
  .glow { filter: url(#glow); }
  .float { animation: float 5s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
  .pulse { animation: pulse 3s ease-in-out infinite; }
  .shadow-pulse { animation: shadowPulse 5s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
  .drift { animation: drift 18s linear infinite; }
  .shimmer { animation: shimmer 4s ease-in-out infinite; }
  @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
  @keyframes pulse { 0%,100% { opacity: .52; } 50% { opacity: 1; } }
  @keyframes shadowPulse { 0%,100% { transform: scaleX(1); opacity: .28; } 50% { transform: scaleX(.72); opacity: .12; } }
  @keyframes drift { from { transform: translateX(0); } to { transform: translateX(-60px); } }
  @keyframes shimmer { 0%,100% { opacity: .5; } 50% { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; }
    text[opacity="0"] { opacity: 1 !important; }
    .role-cycle:not(:first-child) { display: none; }
    animate, animateTransform, animateMotion { display: none; }
  }
`;

function base(theme, width, height, content, defs = '') {
  const c = themes[theme];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${esc(content.title || 'Dika Glorya animated portfolio artwork')}</title>
  <desc id="desc">${esc(content.description || 'Self-contained animated vector artwork for the Dika Glorya GitHub profile.')}</desc>
  <defs>
    <linearGradient id="backdrop" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${c.bg}"/><stop offset="1" stop-color="${c.bg2}"/></linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${c.cyan}"/><stop offset=".48" stop-color="${c.violet}"/><stop offset="1" stop-color="${c.magenta}"/></linearGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0"><stop stop-color="${c.cyan}" stop-opacity="0"/><stop offset=".5" stop-color="${c.cyan}"/><stop offset="1" stop-color="${c.magenta}" stop-opacity="0"/></linearGradient>
    <radialGradient id="spot"><stop stop-color="${c.cyan}" stop-opacity=".2"/><stop offset="1" stop-color="${c.cyan}" stop-opacity="0"/></radialGradient>
    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="soft" x="-40%" y="-50%" width="180%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>
    <filter id="shadow" x="-30%" y="-40%" width="160%" height="190%"><feGaussianBlur in="SourceAlpha" stdDeviation="8" result="blur"/><feOffset dy="10" result="offset"/><feComponentTransfer><feFuncA type="linear" slope=".38"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <style>${commonStyle}</style>${defs ? `\n    ${defs}` : ''}
  </defs>
  <rect width="${width}" height="${height}" rx="20" fill="url(#backdrop)"/>
  ${content.body}
</svg>`;
}

function hero(theme) {
  const c = themes[theme];
  const starfield = (count, seedX, seedY, radius, opacityBase, filter = '') => Array.from({ length: count }, (_, index) => {
    const x = (index * seedX + 17) % 1200;
    const y = (index * seedY + 13) % 270;
    const r = radius + (index % 5 === 0 ? .6 : 0);
    const opacity = (opacityBase + (index % 5) * .08).toFixed(2);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${index % 4 === 0 ? c.magenta : c.cyan}" opacity="${opacity}" class="pulse" style="animation-delay:${(index % 7) * -.4}s"${filter ? ` filter="${filter}"` : ''}/>`;
  }).join('');
  const farStars = starfield(24, 131, 71, .55, .16);
  const stars = starfield(42, 83, 47, .8, .22, 'mid');
  const nearStars = starfield(14, 197, 109, 1.45, .38, 'near');
  const grid = Array.from({ length: 19 }, (_, index) => {
    const x = 600 + (index - 9) * 95;
    return `<path d="M600 260 L${x} 420"/>`;
  }).join('') + Array.from({ length: 9 }, (_, index) => {
    const y = 276 + index * index * 1.72;
    return `<path d="M0 ${y.toFixed(1)} Q600 ${y - 25} 1200 ${y.toFixed(1)}"/>`;
  }).join('');
  const defs = `<clipPath id="floor"><path d="M0 255H1200V420H0Z"/></clipPath>
    <linearGradient id="floorFade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${c.cyan}" stop-opacity=".2"/><stop offset="1" stop-color="${c.violet}" stop-opacity=".04"/></linearGradient>
    <path id="orbit" d="M0 0 C65 -36 142 -36 202 0 C142 36 65 36 0 0"/>`;
  const body = `<ellipse cx="600" cy="173" rx="300" ry="148" fill="url(#spot)"/>
    <g opacity=".62" filter="url(#soft)">${farStars}</g>
    <g>${stars}</g>
    <g>${nearStars}</g>
    <g clip-path="url(#floor)" opacity=".6"><path d="M0 260H1200V420H0Z" fill="url(#floorFade)"/><g fill="none" stroke="${c.grid}" stroke-width="1" class="drift">${grid}</g></g>
    <path d="M0 260H1200" stroke="url(#beam)" opacity=".45"/>
    <g transform="translate(600 169)" fill="none" stroke-linejoin="round" class="glow">
      <g class="float"><g><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="24s" repeatCount="indefinite"/>
        <path d="M0 -82L70 -41L70 41L0 82L-70 41L-70 -41Z" stroke="${c.cyan}" stroke-width="2.2"/>
        <path d="M0 -82L0 0L70 -41M0 0L70 41M0 0L0 82M0 0L-70 41M0 0L-70 -41" stroke="${c.magenta}" stroke-width="1.5" opacity=".92"/>
        <path d="M0 -82L70 -41L0 0L-70 -41ZM0 0L70 -41L70 41ZM0 0L70 41L0 82L-70 41Z" stroke="${c.violet}" stroke-width="1" opacity=".8"/>
        <circle r="5" fill="${c.lime}" stroke="none"/>
      </g></g>
      <ellipse rx="112" ry="40" stroke="${c.cyan}" opacity=".8" transform="rotate(-28)"/>
      <ellipse rx="112" ry="40" stroke="${c.magenta}" opacity=".7" transform="rotate(48)"/>
    </g>
    <g fill="${c.cyan}" stroke="${c.bg}" stroke-width="3" filter="url(#glow)">
      <circle r="9"><animateMotion dur="9s" repeatCount="indefinite" rotate="auto"><mpath href="#orbit"/></animateMotion></circle>
      <circle r="7" fill="${c.magenta}"><animateMotion dur="12s" begin="-4s" repeatCount="indefinite" rotate="auto"><mpath href="#orbit"/></animateMotion></circle>
      <circle r="6" fill="${c.lime}"><animateMotion dur="15s" begin="-8s" repeatCount="indefinite" rotate="auto"><mpath href="#orbit"/></animateMotion></circle>
    </g>
    <g text-anchor="middle">
      <text x="600" y="326" fill="${c.text}" font-size="47" font-weight="750" letter-spacing="1.5" opacity="0">Dika Glorya<animate attributeName="opacity" values="0;1;1;1" keyTimes="0;.08;.2;1" dur="7s" repeatCount="indefinite"/></text>
      <text x="600" y="354" fill="${c.muted}" font-size="14" class="mono" letter-spacing="2">BUILDING DIGITAL WORLDS <tspan fill="${c.cyan}">/</tspan> OPEN SOURCE</text>
      <g font-size="13" class="mono">
        <text class="role-cycle" x="600" y="385" fill="${c.cyan}" opacity="0">Full-Stack Developer<animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;.04;.29;.34;1" dur="9s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 8;0 0;0 0;0 -5;0 -5" keyTimes="0;.04;.29;.34;1" dur="9s" repeatCount="indefinite"/></text>
        <text class="role-cycle" x="600" y="385" fill="${c.magenta}" opacity="0">Open Source Enthusiast<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;.29;.34;.60;.65;1" dur="9s" repeatCount="indefinite"/></text>
        <text class="role-cycle" x="600" y="385" fill="${c.lime}" opacity="0">Problem Solver<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;.60;.65;.91;.96;1" dur="9s" repeatCount="indefinite"/></text>
      </g>
    </g>
    <path d="M32 32h34M32 32v34M1168 32h-34M1168 32v34M32 388h34M32 388v-34M1168 388h-34M1168 388v-34" fill="none" stroke="${c.cyan}" opacity=".62"/>`;
  return base(theme, 1200, 420, { title: 'Dika Glorya | animated developer portfolio', description: 'Neon wireframe crystal rotating above a moving perspective grid, with orbiting lights and animated developer identity.' , body }, defs);
}

function about(theme) {
  const c = themes[theme];
  const lines = [
    ['const developer = {', 88, c.cyan],
    ['  name: "Dika Glorya",', 112, c.text],
    ['  focus: ["web", "tools"],', 136, c.text],
    ['  values: "build useful",', 160, c.text],
    ['  status: "always learning"', 184, c.lime],
    ['};', 208, c.magenta],
  ];
  const code = lines.map(([text, y, color], index) => `<text x="${92 + (index === 1 || index === 2 || index === 3 || index === 4 ? 14 : 0)}" y="${y}" fill="${color}" font-size="15" class="mono" opacity="0"><tspan>${esc(text)}</tspan><animate attributeName="opacity" values="0;1;1" keyTimes="0;.1;1" begin="${index * .62}s" dur="5s" repeatCount="indefinite"/></text>`).join('');
  const body = `<ellipse cx="432" cy="279" rx="290" ry="32" fill="${c.cyan}" opacity=".16" filter="url(#soft)"/>
    <g transform="translate(160 45) skewY(-3)" filter="url(#shadow)">
      <path d="M0 22Q0 8 14 8H546Q560 8 560 22V237Q560 251 546 251H14Q0 251 0 237Z" fill="${c.panel}" stroke="${c.cyan}" stroke-opacity=".65" stroke-width="1.5"/>
      <path d="M0 22Q0 8 14 8H546Q560 8 560 22V49H0Z" fill="${c.panel2}"/>
      <circle cx="23" cy="29" r="5" fill="${c.red}"/><circle cx="42" cy="29" r="5" fill="${c.lime}"/><circle cx="61" cy="29" r="5" fill="${c.cyan}"/>
      <text x="280" y="33" text-anchor="middle" fill="${c.muted}" font-size="11" class="mono">~/profile/README.ts</text>
      <text x="28" y="85" fill="${c.muted}" font-size="14" class="mono">01</text><text x="28" y="109" fill="${c.muted}" font-size="14" class="mono">02</text><text x="28" y="133" fill="${c.muted}" font-size="14" class="mono">03</text><text x="28" y="157" fill="${c.muted}" font-size="14" class="mono">04</text><text x="28" y="181" fill="${c.muted}" font-size="14" class="mono">05</text><text x="28" y="205" fill="${c.muted}" font-size="14" class="mono">06</text>
      ${code}
      <rect x="92" y="216" width="8" height="17" fill="${c.cyan}" class="pulse"/>
      <path d="M12 251H548L582 276H-22Z" fill="${c.panel2}" stroke="${c.violet}" stroke-opacity=".6"/>
      <path d="M202 252H358L372 265H188Z" fill="${c.bg}" opacity=".75"/>
      <path d="M-22 276H582" stroke="${c.cyan}" opacity=".6"/>
    </g>
    <text x="862" y="111" fill="${c.cyan}" font-size="12" class="mono" letter-spacing="2">ABOUT / 01</text>
    <text x="862" y="149" fill="${c.text}" font-size="25" font-weight="700">Curious by default.</text>
    <text x="862" y="178" fill="${c.muted}" font-size="15">I build thoughtful software,</text>
    <text x="862" y="201" fill="${c.muted}" font-size="15">useful tools, and experiences</text>
    <text x="862" y="224" fill="${c.muted}" font-size="15">that make the everyday better.</text>
    <circle cx="825" cy="282" r="4" fill="${c.lime}" class="pulse"/><path d="M842 282h205" stroke="${c.grid}" stroke-dasharray="2 7"/>`;
  return base(theme, 1200, 330, { title: 'About Dika Glorya', description: 'Floating isometric terminal showing a typed developer profile beside a short introduction.', body });
}

function skills(theme) {
  const c = themes[theme];
  const items = [
    ['JavaScript', 'JS', c.lime], ['TypeScript', 'TS', c.cyan], ['Python', 'PY', c.blue],
    ['React', 'RE', c.cyan], ['Node.js', 'ND', c.lime], ['Docker', 'DK', c.blue],
    ['Git', 'GT', c.red], ['SQL', 'DB', c.violet], ['Linux', 'LX', c.magenta],
  ];
  const tiles = items.map(([name, mark, color], index) => {
    const col = index % 3; const row = Math.floor(index / 3);
    const x = 140 + col * 320;
    const y = 24 + row * 126;
    const delay = (index % 5) * -.42;
    return `<g transform="translate(${x} ${y})">
      <g class="float" style="animation-delay:${delay}s">
        <ellipse cx="76" cy="77" rx="73" ry="14" fill="${c.shadow}" opacity=".28" filter="url(#soft)" class="shadow-pulse" style="animation-delay:${delay}s"/>
        <path d="M0 20L76 0L152 20L76 40Z" fill="${color}" opacity=".95"/>
        <path d="M0 20L76 40V83L0 63Z" fill="${c.panel2}" stroke="${color}" stroke-opacity=".62"/>
        <path d="M76 40L152 20V63L76 83Z" fill="${c.panel}" stroke="${color}" stroke-opacity=".72"/>
        <path d="M8 24L76 7L143 24" fill="none" stroke="#ffffff" stroke-opacity=".42"/>
        <text x="76" y="60" text-anchor="middle" fill="${color}" font-size="17" font-weight="800" class="mono">${mark}</text>
        <text x="76" y="99" text-anchor="middle" fill="${c.text}" font-size="12" font-weight="600">${name}</text>
      </g>
    </g>`;
  }).join('');
  const body = `<path d="M110 271L600 150L1090 271L600 398Z" fill="${c.cyan}" opacity=".035"/>
    <path d="M100 278L600 153L1100 278" fill="none" stroke="${c.grid}" opacity=".48" stroke-dasharray="3 8"/>
    ${tiles}
    <text x="66" y="38" fill="${c.muted}" font-size="11" class="mono" letter-spacing="2">STACK / 09 MODULES</text>`;
  return base(theme, 1200, 420, { title: 'Dika Glorya technology stack', description: 'Nine colorful isometric tiles for JavaScript, TypeScript, Python, React, Node.js, Docker, Git, SQL, and Linux hover over a ground plane.', body });
}

function stats(theme) {
  const c = themes[theme];
  const bars = [
    ['JS', 112, c.lime, '72'], ['TS', 154, c.cyan, '84'], ['PY', 92, c.blue, '58'],
    ['HTML', 132, c.magenta, '66'], ['CSS', 104, c.violet, '61'], ['SQL', 76, c.red, '42'],
  ];
  const shapes = bars.map(([label, height, color, count], index) => {
    const x = 194 + index * 138;
    const top = 284 - height;
    const leftFace = `M${x} ${top}v${height}l22 13v-${height}Z`;
    const rightFace = `M${x + 22} ${top + 13}l42 -12v${height}l-42 12Z`;
    const topFace = `M${x} ${top}l42 -13l22 12l-42 13Z`;
    const collapsedLeft = `M${x} 284v0l22 13v0Z`;
    const collapsedRight = `M${x + 22} 297l42 -12v0l-42 12Z`;
    const collapsedTop = `M${x} 284l42 -13l22 12l-42 13Z`;
    return `<g>
      <path d="${leftFace}" fill="${color}" opacity=".64"><animate attributeName="d" values="${collapsedLeft};${leftFace};${leftFace};${collapsedLeft}" keyTimes="0;.24;.78;1" dur="6s" begin="${index * -.32}s" repeatCount="indefinite"/></path>
      <path d="${rightFace}" fill="${color}" opacity=".84"><animate attributeName="d" values="${collapsedRight};${rightFace};${rightFace};${collapsedRight}" keyTimes="0;.24;.78;1" dur="6s" begin="${index * -.32}s" repeatCount="indefinite"/></path>
      <path d="${topFace}" fill="${color}" class="glow"><animate attributeName="d" values="${collapsedTop};${topFace};${topFace};${collapsedTop}" keyTimes="0;.24;.78;1" dur="6s" begin="${index * -.32}s" repeatCount="indefinite"/></path>
      <path d="M${x - 7} 298h78" stroke="${c.shadow}" stroke-width="8" opacity=".2" filter="url(#soft)"/>
      <text x="${x + 35}" y="270" text-anchor="middle" fill="${c.text}" font-size="14" font-weight="700" class="mono">${count}<animate attributeName="y" values="270;${top - 18};${top - 18};270" keyTimes="0;.24;.78;1" dur="6s" begin="${index * -.32}s" repeatCount="indefinite"/><animate attributeName="opacity" values=".35;1;.72;1" dur="3.5s" begin="${index * .3}s" repeatCount="indefinite"/></text>
      <text x="${x + 35}" y="326" text-anchor="middle" fill="${c.muted}" font-size="12" class="mono">${label}</text>
    </g>`;
  }).join('');
  const body = `<ellipse cx="595" cy="299" rx="480" ry="45" fill="${c.violet}" opacity=".08" filter="url(#soft)"/>
    <path d="M111 285L600 226L1089 285L600 346Z" fill="${c.panel2}" stroke="${c.grid}" stroke-opacity=".6"/>
    <path d="M111 285L600 346V365L111 304Z" fill="${c.panel}"/><path d="M600 346L1089 285V304L600 365Z" fill="${c.bg2}"/>
    ${shapes}
    <text x="600" y="45" text-anchor="middle" fill="${c.text}" font-size="20" font-weight="700">Code, in motion</text>
    <text x="600" y="66" text-anchor="middle" fill="${c.muted}" font-size="12" class="mono">LANGUAGE SNAPSHOT / ILLUSTRATIVE VALUES</text>
    <path d="M142 377H1058" stroke="url(#beam)" opacity=".72"/>`;
  return base(theme, 1200, 405, { title: 'Animated language stats', description: 'Isometric bar chart with illustrative language percentages and animated glowing bars.', body });
}

function divider(theme) {
  const c = themes[theme];
  const body = `<path d="M0 45C140 45 155 10 300 10S470 80 600 45 760 10 900 45 1060 80 1200 45" fill="none" stroke="${c.cyan}" stroke-width="2" opacity=".28"/>
    <path d="M0 45C140 45 155 10 300 10S470 80 600 45 760 10 900 45 1060 80 1200 45" fill="none" stroke="url(#beam)" stroke-width="3" stroke-dasharray="22 980" class="shimmer" filter="url(#glow)"><animate attributeName="stroke-dashoffset" from="1000" to="0" dur="5s" repeatCount="indefinite"/></path>
    <path d="M0 52C140 52 155 17 300 17S470 87 600 52 760 17 900 52 1060 87 1200 52" fill="none" stroke="${c.magenta}" stroke-width="1" opacity=".22"/>
    <circle r="4" fill="${c.lime}" filter="url(#glow)"><animateMotion dur="7s" repeatCount="indefinite"><mpath href="#wave"/></animateMotion></circle>`;
  return base(theme, 1200, 90, { title: 'Animated energy divider', description: 'Glowing wave line travels through the profile section divider.', body }, `<path id="wave" d="M0 45C140 45 155 10 300 10S470 80 600 45 760 10 900 45 1060 80 1200 45" fill="none"/>`);
}

function footer(theme) {
  const c = themes[theme];
  const ridges = [
    `<path d="M0 230L0 165L110 120L205 174L320 85L420 164L530 108L660 178L770 90L900 164L1020 103L1200 170V300H0Z" fill="${c.violet}" opacity=".2"/>`,
    `<path d="M0 248L0 196L140 150L260 208L400 132L520 209L665 143L790 214L930 138L1065 206L1200 160V300H0Z" fill="${c.cyan}" opacity=".13"/>`,
    `<path d="M0 261L130 226L240 250L380 191L500 240L630 201L760 250L910 191L1040 239L1200 207V300H0Z" fill="${c.magenta}" opacity=".12"/>`,
  ].join('');
  const body = `<g class="drift">${ridges}</g>
    <path d="M0 248Q200 234 400 249T800 248T1200 246V300H0Z" fill="url(#backdrop)" opacity=".65"/>
    <path d="M0 248Q200 234 400 249T800 248T1200 246" fill="none" stroke="url(#beam)" stroke-width="2" filter="url(#glow)"/>
    <g text-anchor="middle" class="shimmer"><text x="600" y="210" fill="${c.text}" font-size="24" font-weight="650" opacity=".94">Thanks for visiting</text><text x="600" y="232" fill="${c.muted}" font-size="11" class="mono" letter-spacing="2">LET'S BUILD SOMETHING USEFUL</text></g>
    <circle cx="186" cy="114" r="2" fill="${c.cyan}" class="pulse"/><circle cx="995" cy="88" r="2.5" fill="${c.magenta}" class="pulse" style="animation-delay:-1s"/><circle cx="834" cy="149" r="1.5" fill="${c.lime}" class="pulse" style="animation-delay:-2s"/>`;
  return base(theme, 1200, 300, { title: 'Thanks for visiting', description: 'Three softly animated mountain layers frame a subtle thank-you message.', body });
}

const outputs = [
  ['hero-dark.svg', hero('dark')], ['hero-light.svg', hero('light')],
  ['about-3d.svg', about('dark')], ['about-3d-light.svg', about('light')],
  ['skills-3d.svg', skills('dark')], ['skills-3d-light.svg', skills('light')],
  ['stats-3d.svg', stats('dark')], ['stats-3d-light.svg', stats('light')],
  ['divider.svg', divider('dark')], ['divider-light.svg', divider('light')],
  ['footer-dark.svg', footer('dark')], ['footer-light.svg', footer('light')],
];
for (const [filename, content] of outputs) {
  fs.writeFileSync(path.join(output, filename), `${content}\n`);
  console.log(`Generated assets/${filename} (${Buffer.byteLength(content)} bytes)`);
}
