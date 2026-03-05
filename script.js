// ScholaCite v2 — Citation Formatting Engine
document.addEventListener('DOMContentLoaded', function () {
  // Cache DOM elements
  const formatBtn = document.getElementById('format-btn');
  const citationInput = document.getElementById('citation-input');
  const citationStyle = document.getElementById('citation-style');
  const citationOutput = document.getElementById('citation-output');
  const resultSection = document.getElementById('result-section');
  const copyBtn = document.getElementById('copy-btn');
  const exportBtn = document.getElementById('export-btn');

  // ── Parsing ──────────────────────────────────────────────
  // Attempts to extract structured fields from free-text citation input.
  // Handles common patterns: "Last, First. Title. Journal Vol (Year): pages."
  function parseCitation(raw) {
    const text = raw.trim();
    const result = {
      authorLast: '',
      authorFirst: '',
      title: '',
      journal: '',
      volume: '',
      issue: '',
      year: '',
      pages: '',
      doi: '',
      publisher: '',
      city: '',
      raw: text,
    };

    // Try to extract DOI
    const doiMatch = text.match(/\b(10\.\d{4,}\/\S+)/i);
    if (doiMatch) result.doi = doiMatch[1].replace(/[.,;]+$/, '');

    // Try to extract year
    const yearMatch = text.match(/\((\d{4})\)|\b((?:19|20)\d{2})\b/);
    if (yearMatch) result.year = yearMatch[1] || yearMatch[2];

    // Try to extract pages  (e.g.  123-456  or  pp. 12–34)
    const pagesMatch = text.match(/(?:pp?\.\s*)?(\d+\s*[-–—]\s*\d+)/);
    if (pagesMatch) result.pages = pagesMatch[1].replace(/\s/g, '');

    // Try to extract volume / issue  (e.g.  Vol. 12, no. 3  or  12(3)  or  12, no. 3)
    const volIssue = text.match(/(?:vol(?:ume)?\.?\s*)?(\d+)\s*[,(]\s*(?:no\.?\s*)?(\d+)\)?/i);
    if (volIssue) {
      result.volume = volIssue[1];
      result.issue = volIssue[2];
    } else {
      const volOnly = text.match(/\bvol(?:ume)?\.?\s*(\d+)/i);
      if (volOnly) result.volume = volOnly[1];
    }

    // Try to extract author (Last, First pattern at start)
    const authorMatch = text.match(/^([A-Z][a-zA-Z'-]+),\s*([A-Z][a-zA-Z.\s'-]+?)[\.\s]/);
    if (authorMatch) {
      result.authorLast = authorMatch[1].trim();
      result.authorFirst = authorMatch[2].trim().replace(/\.$/, '');
    }

    // Try to extract quoted title
    const quotedTitle = text.match(/"([^"]+)"|"([^"]+)"|"([^"]+)"/);
    if (quotedTitle) {
      result.title = (quotedTitle[1] || quotedTitle[2] || quotedTitle[3]).trim().replace(/\.+$/, '');
    }

    // Try to extract journal — text between title and volume/year, often in italics markers or just plain
    // Heuristic: after the quoted title, before volume or year
    if (result.title) {
      const afterTitle = text.split(result.title).pop();
      if (afterTitle) {
        // Remove leading punctuation/whitespace
        let rest = afterTitle.replace(/^[""'"\s.,;:]+/, '');
        // Try to grab journal name before volume number or year
        const journalMatch = rest.match(/^([A-Za-z][A-Za-z\s&:]+?)[\s,]*(?:\d|$)/);
        if (journalMatch) {
          result.journal = journalMatch[1].trim().replace(/[.,;:]+$/, '');
        }
      }
    }

    // Try publisher / city from "City: Publisher" pattern
    const pubMatch = text.match(/([A-Z][a-zA-Z\s]+):\s*([A-Z][a-zA-Z\s&]+?)(?:,\s*\d{4}|\.)/);
    if (pubMatch && !result.journal) {
      result.city = pubMatch[1].trim();
      result.publisher = pubMatch[2].trim();
    }

    return result;
  }

  // ── Formatting ───────────────────────────────────────────
  function formatSBL(c) {
    if (c.journal) {
      // Journal article
      let out = '';
      if (c.authorLast) out += `${c.authorLast}, ${c.authorFirst}. `;
      if (c.title) out += `"${c.title}." `;
      out += `*${c.journal}*`;
      if (c.volume) out += ` ${c.volume}`;
      if (c.issue) out += `, no. ${c.issue}`;
      if (c.year) out += ` (${c.year})`;
      if (c.pages) out += `: ${c.pages}`;
      out += '.';
      if (c.doi) out += ` ${c.doi}.`;
      return out;
    }
    // Book
    let out = '';
    if (c.authorLast) out += `${c.authorLast}, ${c.authorFirst}. `;
    if (c.title) out += `*${c.title}*. `;
    if (c.city) out += `${c.city}: `;
    if (c.publisher) out += `${c.publisher}, `;
    if (c.year) out += `${c.year}.`;
    return out || c.raw;
  }

  function formatTurabian(c) {
    if (c.journal) {
      let out = '';
      if (c.authorLast) out += `${c.authorLast}, ${c.authorFirst}. `;
      if (c.title) out += `"${c.title}." `;
      out += c.journal;
      if (c.volume) out += ` ${c.volume}`;
      if (c.issue) out += `, no. ${c.issue}`;
      if (c.year) out += ` (${c.year})`;
      if (c.pages) out += `: ${c.pages}`;
      out += '.';
      return out;
    }
    let out = '';
    if (c.authorLast) out += `${c.authorLast}, ${c.authorFirst}. `;
    if (c.title) out += `*${c.title}*. `;
    if (c.city) out += `${c.city}: `;
    if (c.publisher) out += `${c.publisher}, `;
    if (c.year) out += `${c.year}.`;
    return out || c.raw;
  }

  function formatChicago(c) {
    if (c.journal) {
      let out = '';
      if (c.authorLast) out += `${c.authorLast}, ${c.authorFirst}. `;
      if (c.title) out += `"${c.title}." `;
      out += c.journal;
      if (c.volume) out += ` ${c.volume}`;
      if (c.issue) out += `, no. ${c.issue}`;
      if (c.year) out += ` (${c.year})`;
      if (c.pages) out += `: ${c.pages}`;
      out += '.';
      if (c.doi) out += ` doi: ${c.doi}.`;
      return out;
    }
    let out = '';
    if (c.authorLast) out += `${c.authorLast}, ${c.authorFirst}. `;
    if (c.title) out += `*${c.title}*. `;
    if (c.city) out += `${c.city}: `;
    if (c.publisher) out += `${c.publisher}, `;
    if (c.year) out += `${c.year}.`;
    return out || c.raw;
  }

  // ── Toast feedback ───────────────────────────────────────
  function showToast(message, isError) {
    // Remove existing toast
    const old = document.querySelector('.scholacite-toast');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.className = 'scholacite-toast';
    toast.textContent = message;
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '2rem',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '0.75rem 1.5rem',
      borderRadius: '8px',
      color: '#fff',
      fontFamily: "'Inter', sans-serif",
      fontSize: '0.9rem',
      fontWeight: '500',
      zIndex: '9999',
      boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      background: isError ? '#b33' : '#2a7a3a',
      transition: 'opacity 0.3s ease',
    });
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 350);
    }, 2200);
  }

  // ── Format button ────────────────────────────────────────
  formatBtn.addEventListener('click', function () {
    const raw = citationInput.value.trim();
    if (!raw) {
      showToast('Please enter a citation to format.', true);
      citationInput.focus();
      return;
    }

    const parsed = parseCitation(raw);
    const style = citationStyle.value;

    let formatted;
    switch (style) {
      case 'sbl':
        formatted = formatSBL(parsed);
        break;
      case 'turabian':
        formatted = formatTurabian(parsed);
        break;
      case 'chicago':
        formatted = formatChicago(parsed);
        break;
      default:
        formatted = parsed.raw;
    }

    citationOutput.textContent = formatted;
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  // ── Copy button ──────────────────────────────────────────
  copyBtn.addEventListener('click', function () {
    const text = citationOutput.textContent;
    if (!text) return;

    navigator.clipboard.writeText(text).then(
      () => showToast('Copied to clipboard!'),
      () => {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        showToast('Copied to clipboard!');
      }
    );
  });

  // ── Export button ────────────────────────────────────────
  exportBtn.addEventListener('click', function () {
    const text = citationOutput.textContent;
    if (!text) return;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scholacite-citation.txt';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    showToast('Citation exported!');
  });

  console.log('ScholaCite v2 loaded');
});
