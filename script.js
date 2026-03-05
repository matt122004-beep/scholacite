// ScholaCite v3.0 — Citation Reformatter Engine
// All processing is client-side. No data leaves the browser.

document.addEventListener('DOMContentLoaded', function () {
  // ── DOM refs ──
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const fileInfo = document.getElementById('file-info');
  const fileName = document.getElementById('file-name');
  const clearFileBtn = document.getElementById('clear-file');
  const reformatBtn = document.getElementById('reformat-btn');
  const statusBar = document.getElementById('status-bar');
  const statusText = document.getElementById('status-text');
  const resultsSection = document.getElementById('results-section');
  const footnoteCount = document.getElementById('footnote-count');
  const footnotesList = document.getElementById('footnotes-list');
  const parsedList = document.getElementById('parsed-list');
  const downloadBtn = document.getElementById('download-btn');
  const tabs = document.querySelectorAll('.tab');

  // ── State ──
  let currentFile = null;
  let extractedFootnotes = [];
  let parsedCitations = [];

  // ══════════════════════════════════════════════════════════
  //  STYLE RULES (Phase 2 will fill these in fully)
  // ══════════════════════════════════════════════════════════
  const STYLES = {
    JBL: {
      name: 'Journal of Biblical Literature',
      abbrev: 'JBL',
      base: 'SBLHS',
      notes: 'SBL Handbook of Style, 2nd ed. Footnote citation format.',
      // Phase 2: abbreviation lists, ibid rules, bibliography vs footnote format, etc.
      rules: {}
    },
    JSNT: {
      name: 'Journal for the Study of the New Testament',
      abbrev: 'JSNT',
      base: 'SBLHS',
      notes: 'Follows SBLHS with slight variations for Bloomsbury/SAGE house style.',
      rules: {}
    },
    JSOT: {
      name: 'Journal for the Study of the Old Testament',
      abbrev: 'JSOT',
      base: 'SBLHS',
      notes: 'Follows SBLHS with slight variations for Bloomsbury/SAGE house style.',
      rules: {}
    }
  };

  // ══════════════════════════════════════════════════════════
  //  CITATION PATTERN DETECTION
  // ══════════════════════════════════════════════════════════

  // Regex patterns for common citation formats
  const PATTERNS = {
    // Journal article: Author, "Article Title," *Journal* Volume (Year): Pages.
    journal: /^(.+?),\s*[""\u201c](.+?)[""\u201d],?\s*(?:in\s+)?(?:\*)?([A-Z][\w\s&:]+?)(?:\*)?[\s,]*(\d+)(?:[.,]\s*(?:no\.\s*)?(\d+))?\s*\((\d{4})\):\s*([\d\-–—,\s]+)/,

    // Book: Author, *Title* (City: Publisher, Year), Pages.
    book: /^(.+?),\s*(?:\*)?([^*""\u201c]+?)(?:\*)?[\s,]*\(([A-Z][\w\s]+?):\s*(.+?),\s*(\d{4})\)(?:,\s*([\d\-–—,\s]+))?/,

    // Chapter in edited volume: Author, "Chapter," in *Book*, ed. Editor (City: Publisher, Year), Pages.
    chapter: /^(.+?),\s*[""\u201c](.+?)[""\u201d],?\s*in\s+(?:\*)?(.+?)(?:\*)?,\s*ed\.\s*(.+?)\s*\(([A-Z][\w\s]+?):\s*(.+?),\s*(\d{4})\)(?:,\s*([\d\-–—,\s]+))?/
  };

  function parseCitation(text) {
    const trimmed = text.trim();

    // Try chapter first (most specific — contains "in" + "ed.")
    let m = trimmed.match(PATTERNS.chapter);
    if (m) {
      return {
        type: 'chapter',
        author: m[1].trim(),
        title: m[2].trim(),
        bookTitle: m[3].trim(),
        editor: m[4].trim(),
        city: m[5].trim(),
        publisher: m[6].trim(),
        year: m[7],
        pages: (m[8] || '').trim(),
        raw: trimmed
      };
    }

    // Try journal
    m = trimmed.match(PATTERNS.journal);
    if (m) {
      return {
        type: 'journal',
        author: m[1].trim(),
        title: m[2].trim(),
        journal: m[3].trim(),
        volume: m[4],
        issue: m[5] || '',
        year: m[6],
        pages: (m[7] || '').trim(),
        raw: trimmed
      };
    }

    // Try book
    m = trimmed.match(PATTERNS.book);
    if (m) {
      return {
        type: 'book',
        author: m[1].trim(),
        title: m[2].trim(),
        city: m[3].trim(),
        publisher: m[4].trim(),
        year: m[5],
        pages: (m[6] || '').trim(),
        raw: trimmed
      };
    }

    return { type: 'unknown', raw: trimmed };
  }

  // ══════════════════════════════════════════════════════════
  //  DOCX PARSING (mammoth.js)
  // ══════════════════════════════════════════════════════════

  async function extractFootnotes(file) {
    const arrayBuffer = await file.arrayBuffer();

    // mammoth converts docx to HTML — footnotes come through as <li> inside <ol>
    const result = await mammoth.convertToHtml(
      { arrayBuffer },
      {
        includeDefaultStyleMap: true,
        convertImage: mammoth.images.imgElement(function () {
          return { src: '' }; // skip images
        })
      }
    );

    const html = result.value;
    const messages = result.messages;

    // Parse footnotes from the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // mammoth renders footnotes as <li id="footnote-N"> inside an <ol>
    const footnoteLIs = doc.querySelectorAll('li[id^="footnote-"]');
    const footnotes = [];

    footnoteLIs.forEach(function (li, idx) {
      // Remove the back-reference link
      const backLinks = li.querySelectorAll('a[href^="#footnote-ref-"]');
      backLinks.forEach(function (a) { a.remove(); });
      const text = li.textContent.trim();
      if (text) {
        footnotes.push({ index: idx + 1, text: text, html: li.innerHTML });
      }
    });

    // If mammoth didn't produce structured footnotes, try to find them in body text
    // (some .docx files have inline footnote markers)
    if (footnotes.length === 0) {
      // Fallback: split by common footnote patterns in body text
      const allText = doc.body.textContent;
      const fnPattern = /(?:^|\n)\s*(\d+)\.\s+(.+?)(?=\n\s*\d+\.\s+|\n*$)/gs;
      let match;
      while ((match = fnPattern.exec(allText)) !== null) {
        footnotes.push({ index: parseInt(match[1], 10), text: match[2].trim(), html: '' });
      }
    }

    return { footnotes, html, messages };
  }

  // ══════════════════════════════════════════════════════════
  //  RENDERING
  // ══════════════════════════════════════════════════════════

  function renderFootnotes(footnotes) {
    footnotesList.innerHTML = '';
    footnotes.forEach(function (fn) {
      const div = document.createElement('div');
      div.className = 'footnote-item';
      div.innerHTML =
        '<span class="fn-num">' + fn.index + '.</span>' +
        '<span class="fn-text">' + escapeHtml(fn.text) + '</span>';
      footnotesList.appendChild(div);
    });
  }

  function renderParsed(citations) {
    parsedList.innerHTML = '';
    citations.forEach(function (c, i) {
      const div = document.createElement('div');
      div.className = 'parsed-item';

      let typeLabel = c.type.charAt(0).toUpperCase() + c.type.slice(1);
      let fieldsHtml = '';

      if (c.type === 'journal') {
        fieldsHtml =
          field('Author', c.author) +
          field('Title', c.title) +
          field('Journal', c.journal) +
          field('Volume', c.volume + (c.issue ? ', no. ' + c.issue : '')) +
          field('Year', c.year) +
          field('Pages', c.pages);
      } else if (c.type === 'book') {
        fieldsHtml =
          field('Author', c.author) +
          field('Title', c.title) +
          field('Place', c.city) +
          field('Publisher', c.publisher) +
          field('Year', c.year) +
          field('Pages', c.pages);
      } else if (c.type === 'chapter') {
        fieldsHtml =
          field('Author', c.author) +
          field('Chapter', c.title) +
          field('Book', c.bookTitle) +
          field('Editor', c.editor) +
          field('Place', c.city) +
          field('Publisher', c.publisher) +
          field('Year', c.year) +
          field('Pages', c.pages);
      } else {
        fieldsHtml = '<div style="color:#8a8a8a;font-style:italic;">Could not parse — will be kept as-is.</div>' +
          '<div style="margin-top:0.4rem;font-size:0.82rem;color:#546179;">' + escapeHtml(c.raw.substring(0, 200)) + (c.raw.length > 200 ? '…' : '') + '</div>';
      }

      div.innerHTML =
        '<span class="parsed-type ' + c.type + '">' + typeLabel + '</span>' +
        '<div class="parsed-fields">' + fieldsHtml + '</div>';
      parsedList.appendChild(div);
    });
  }

  function field(label, value) {
    if (!value) return '';
    return '<div><strong>' + label + ':</strong> ' + escapeHtml(value) + '</div>';
  }

  function escapeHtml(str) {
    const el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
  }

  // ══════════════════════════════════════════════════════════
  //  DRAG & DROP + FILE HANDLING
  // ══════════════════════════════════════════════════════════

  dropzone.addEventListener('click', function () { fileInput.click(); });

  dropzone.addEventListener('dragover', function (e) {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', function () {
    dropzone.classList.remove('dragover');
  });
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length && files[0].name.endsWith('.docx')) {
      handleFile(files[0]);
    } else {
      showToast('Please drop a .docx file.', true);
    }
  });

  fileInput.addEventListener('change', function () {
    if (fileInput.files.length) handleFile(fileInput.files[0]);
  });

  clearFileBtn.addEventListener('click', function () {
    currentFile = null;
    fileInfo.classList.add('hidden');
    reformatBtn.disabled = true;
    resultsSection.classList.add('hidden');
    fileInput.value = '';
  });

  function handleFile(file) {
    if (!file.name.endsWith('.docx')) {
      showToast('Only .docx files are supported.', true);
      return;
    }
    currentFile = file;
    fileName.textContent = file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)';
    fileInfo.classList.remove('hidden');
    reformatBtn.disabled = false;
    resultsSection.classList.add('hidden');
  }

  // ══════════════════════════════════════════════════════════
  //  REFORMAT BUTTON
  // ══════════════════════════════════════════════════════════

  reformatBtn.addEventListener('click', async function () {
    if (!currentFile) return;

    // Show status
    statusBar.classList.remove('hidden');
    statusText.textContent = 'Parsing .docx…';
    reformatBtn.disabled = true;
    resultsSection.classList.add('hidden');

    try {
      // Step 1: Extract
      statusText.textContent = 'Extracting footnotes…';
      const { footnotes } = await extractFootnotes(currentFile);

      extractedFootnotes = footnotes;

      if (footnotes.length === 0) {
        statusText.textContent = 'No footnotes found in this document.';
        setTimeout(function () { statusBar.classList.add('hidden'); }, 3000);
        reformatBtn.disabled = false;
        return;
      }

      // Step 2: Parse citations
      statusText.textContent = 'Detecting citation patterns…';
      parsedCitations = footnotes.map(function (fn) {
        return parseCitation(fn.text);
      });

      // Step 3: Render
      renderFootnotes(footnotes);
      renderParsed(parsedCitations);

      const detected = parsedCitations.filter(function (c) { return c.type !== 'unknown'; }).length;
      footnoteCount.textContent = footnotes.length + ' footnotes · ' + detected + ' citations detected';

      resultsSection.classList.remove('hidden');
      statusBar.classList.add('hidden');
      reformatBtn.disabled = false;

      // Scroll to results
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (err) {
      console.error('ScholaCite error:', err);
      statusText.textContent = 'Error: ' + err.message;
      setTimeout(function () { statusBar.classList.add('hidden'); }, 5000);
      reformatBtn.disabled = false;
    }
  });

  // ══════════════════════════════════════════════════════════
  //  TABS
  // ══════════════════════════════════════════════════════════

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
      document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    });
  });

  // ══════════════════════════════════════════════════════════
  //  DOWNLOAD (stub — Phase 2 will do full reformat)
  // ══════════════════════════════════════════════════════════

  downloadBtn.addEventListener('click', function () {
    if (!extractedFootnotes.length) return;
    const selectedJournal = document.querySelector('input[name="journal"]:checked').value;
    const style = STYLES[selectedJournal];

    // For now, export extracted + parsed data as a text summary
    let content = 'ScholaCite v3.0 — Citation Analysis\n';
    content += 'Target style: ' + style.name + ' (' + style.base + ')\n';
    content += '═'.repeat(50) + '\n\n';

    parsedCitations.forEach(function (c, i) {
      content += 'Footnote ' + (i + 1) + ' [' + c.type.toUpperCase() + ']\n';
      if (c.type === 'journal') {
        content += '  Author: ' + c.author + '\n';
        content += '  Title: ' + c.title + '\n';
        content += '  Journal: ' + c.journal + '\n';
        content += '  Volume: ' + c.volume + (c.issue ? ', no. ' + c.issue : '') + '\n';
        content += '  Year: ' + c.year + '\n';
        content += '  Pages: ' + c.pages + '\n';
      } else if (c.type === 'book') {
        content += '  Author: ' + c.author + '\n';
        content += '  Title: ' + c.title + '\n';
        content += '  Place: ' + c.city + '\n';
        content += '  Publisher: ' + c.publisher + '\n';
        content += '  Year: ' + c.year + '\n';
        content += '  Pages: ' + c.pages + '\n';
      } else if (c.type === 'chapter') {
        content += '  Author: ' + c.author + '\n';
        content += '  Chapter: ' + c.title + '\n';
        content += '  Book: ' + c.bookTitle + '\n';
        content += '  Editor: ' + c.editor + '\n';
        content += '  Place: ' + c.city + '\n';
        content += '  Publisher: ' + c.publisher + '\n';
        content += '  Year: ' + c.year + '\n';
        content += '  Pages: ' + c.pages + '\n';
      } else {
        content += '  [Unparsed] ' + c.raw.substring(0, 150) + '\n';
      }
      content += '\n';
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'scholacite-analysis.txt');
    showToast('Analysis exported!');
  });

  // ══════════════════════════════════════════════════════════
  //  TOAST
  // ══════════════════════════════════════════════════════════

  function showToast(message, isError) {
    const old = document.querySelector('.scholacite-toast');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.className = 'scholacite-toast';
    toast.textContent = message;
    Object.assign(toast.style, {
      position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
      padding: '0.75rem 1.5rem', borderRadius: '8px', color: '#fff',
      fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: '500',
      zIndex: '9999', boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      background: isError ? '#c5221f' : '#137333',
      transition: 'opacity 0.3s ease'
    });
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 350);
    }, 2500);
  }

  console.log('ScholaCite v3.0 loaded');
});
