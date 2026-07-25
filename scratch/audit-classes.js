const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  const files = [];
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      files.push(...walkDir(full));
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      files.push(full);
    }
  });
  return files;
}

const colorRegex = /^(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black|transparent)/;

function getCategory(token) {
  // We want to identify the CSS property this class affects.
  // e.g. text color, text size, bg color, border color, etc.
  
  let prefix = '';
  let rest = token;

  // Extract prefixes like hover:, focus:, dark:, dark:hover:, etc.
  const prefixes = [];
  while (true) {
    if (rest.startsWith('dark:')) {
      prefixes.push('dark');
      rest = rest.substring(5);
    } else if (rest.startsWith('hover:')) {
      prefixes.push('hover');
      rest = rest.substring(6);
    } else if (rest.startsWith('focus:')) {
      prefixes.push('focus');
      rest = rest.substring(6);
    } else if (rest.startsWith('active:')) {
      prefixes.push('active');
      rest = rest.substring(7);
    } else if (rest.startsWith('disabled:')) {
      prefixes.push('disabled');
      rest = rest.substring(9);
    } else if (rest.startsWith('group-hover:')) {
      prefixes.push('group-hover');
      rest = rest.substring(12);
    } else if (rest.startsWith('focus-visible:')) {
      prefixes.push('focus-visible');
      rest = rest.substring(14);
    } else {
      break;
    }
  }

  const prefixKey = prefixes.sort().join(':');

  // Now analyze the rest class name
  if (rest.startsWith('text-')) {
    const val = rest.substring(5);
    // Is it a color or a size/alignment/weight?
    if (colorRegex.test(val) || val === 'white' || val === 'black' || val === 'transparent') {
      return `${prefixKey ? prefixKey + ':' : ''}text-color`;
    }
    if (['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'].some(s => val.startsWith(s))) {
      return `${prefixKey ? prefixKey + ':' : ''}text-size`;
    }
    if (['left', 'center', 'right', 'justify', 'start', 'end'].includes(val)) {
      return `${prefixKey ? prefixKey + ':' : ''}text-align`;
    }
    // E.g. font-semibold is not text-, but text-weight isn't standard Tailwind anyway.
  }

  if (rest.startsWith('bg-')) {
    const val = rest.substring(3);
    if (colorRegex.test(val) || val === 'white' || val === 'black' || val === 'transparent' || val.startsWith('[#')) {
      return `${prefixKey ? prefixKey + ':' : ''}bg-color`;
    }
  }

  if (rest.startsWith('border-')) {
    const val = rest.substring(7);
    if (colorRegex.test(val) || val === 'white' || val === 'black' || val === 'transparent' || val.startsWith('[#')) {
      return `${prefixKey ? prefixKey + ':' : ''}border-color`;
    }
    if (['0', '2', '4', '8', 't', 'b', 'l', 'r', 'x', 'y'].some(s => val === s || val.startsWith(s + '-'))) {
      return `${prefixKey ? prefixKey + ':' : ''}border-width`;
    }
  }

  if (rest.startsWith('ring-')) {
    const val = rest.substring(5);
    if (colorRegex.test(val) || val === 'white' || val === 'black' || val === 'transparent' || val.startsWith('[#')) {
      return `${prefixKey ? prefixKey + ':' : ''}ring-color`;
    }
  }

  if (rest.startsWith('placeholder-')) {
    const val = rest.substring(12);
    if (colorRegex.test(val) || val === 'white' || val === 'black' || val === 'transparent') {
      return `${prefixKey ? prefixKey + ':' : ''}placeholder-color`;
    }
  }

  return null;
}

const files = walkDir('src');
let totalIssues = 0;
const results = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Simple regex to extract classNames. Support className="..." and className={`...`}
  // We will scan lines or match all className attributes.
  const lines = content.split('\n');
  lines.forEach((line, lineIndex) => {
    // Look for classNames
    const matches = line.match(/className=(?:["']([^"']*)["']|{`([^`]*)`})/g);
    if (!matches) return;

    matches.forEach(match => {
      // Clean matches to extract only the tokens
      let classStr = '';
      if (match.startsWith('className="') || match.startsWith("className='")) {
        classStr = match.substring(11, match.length - 1);
      } else if (match.startsWith('className={`') && match.endsWith('`}')) {
        classStr = match.substring(12, match.length - 2);
      }

      // Tokenize
      const tokens = classStr.split(/\s+/).map(t => t.trim()).filter(Boolean);
      const categories = {};
      const duplicates = [];

      tokens.forEach(token => {
        const cat = getCategory(token);
        if (!cat) return;

        if (categories[cat]) {
          categories[cat].push(token);
        } else {
          categories[cat] = [token];
        }
      });

      // Find duplicate properties
      for (const [cat, list] of Object.entries(categories)) {
        if (list.length > 1) {
          // Check if they are actually duplicates or just different classes
          // In some cases we might have e.g. text-color with different values or identical ones.
          // Note: sometimes developers write active:text-blue-600 active:text-blue-500 etc. or just dark:text-slate-900 dark:text-slate-100.
          // Let's filter out cases where there are duplicate classes in the same category.
          // For text-align / text-size, having multiple might be a bug.
          duplicates.push({ category: cat, classes: list });
        }
      }

      if (duplicates.length > 0) {
        totalIssues += duplicates.length;
        results.push({
          file,
          lineNumber: lineIndex + 1,
          line: line.trim(),
          duplicates
        });
      }
    });
  });
});

console.log(JSON.stringify({ totalIssues, results }, null, 2));
