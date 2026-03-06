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
  let extractedBodyParagraphs = [];
  let parsedCitations = [];
  let reformattedCitations = [];

  // ── Additional DOM refs for v3.1 ──
  const reformattedList = document.getElementById('reformatted-list');
  const reformatStyleLabel = document.getElementById('reformat-style-label');

  // ══════════════════════════════════════════════════════════
  //  JOURNAL ABBREVIATIONS (SBLHS §8 subset)
  // ══════════════════════════════════════════════════════════
  const JOURNAL_ABBREVS = {
    'Journal of Biblical Literature': 'JBL',
    'Journal for the Study of the New Testament': 'JSNT',
    'Journal for the Study of the Old Testament': 'JSOT',
    'New Testament Studies': 'NTS',
    'Catholic Biblical Quarterly': 'CBQ',
    'Zeitschrift für die neutestamentliche Wissenschaft': 'ZNW',
    'Harvard Theological Review': 'HTR',
    'Novum Testamentum': 'NovT',
    'Biblica': 'Bib',
    'Vetus Testamentum': 'VT',
    'Revue Biblique': 'RB',
    'Theologische Zeitschrift': 'TZ',
    'Journal of Theological Studies': 'JTS',
    'Scottish Journal of Theology': 'SJT',
    'Bulletin of the American Schools of Oriental Research': 'BASOR',
    'Israel Exploration Journal': 'IEJ',
    'Journal of the American Oriental Society': 'JAOS',
    'Journal of Near Eastern Studies': 'JNES',
    'Journal of Semitic Studies': 'JSS',
    'Interpretation': 'Int',
    'Expository Times': 'ExpTim',
    'Tyndale Bulletin': 'TynBul',
    'Westminster Theological Journal': 'WTJ',
    'Biblical Archaeologist': 'BA',
    'Biblical Archaeology Review': 'BAR',
    'Journal of the Evangelical Theological Society': 'JETS',
    'Currents in Biblical Research': 'CBR',
    'Early Christianity': 'EC',
  };

  // ══════════════════════════════════════════════════════════
  //  STYLE RULES
  // ══════════════════════════════════════════════════════════
  const STYLES = {
    JBL: {
      name: 'Journal of Biblical Literature',
      abbrev: 'JBL',
      base: 'SBLHS',
      notes: 'SBL Handbook of Style, 2nd ed. Footnote citation format.',
      abbreviateJournals: true,  // Use SBLHS abbreviations
      rules: {
        // First citation formats
        bookFirst: function (c) {
          return authorFirstLast(c.author) + ', <em>' + c.title + '</em> (' + c.city + ': ' + c.publisher + ', ' + c.year + ')' + (c.pages ? ', ' + c.pages : '') + '.';
        },
        journalFirst: function (c, style) {
          var jName = style.abbreviateJournals ? abbreviateJournal(c.journal) : c.journal;
          return authorFirstLast(c.author) + ', "' + cleanTitle(c.title) + '," <em>' + jName + '</em> ' + c.volume + (c.issue ? ', no. ' + c.issue : '') + ' (' + c.year + '): ' + c.pages + '.';
        },
        chapterFirst: function (c) {
          return authorFirstLast(c.author) + ', "' + cleanTitle(c.title) + '," in <em>' + c.bookTitle + '</em>' + (c.editor ? ', ed. ' + c.editor : '') + ' (' + c.city + ': ' + c.publisher + ', ' + c.year + ')' + (c.pages ? ', ' + c.pages : '') + '.';
        },
        // Subsequent citation formats (short form)
        bookSubsequent: function (c) {
          return authorLastOnly(c.author) + ', <em>' + shortTitle(cleanTitle(c.title)) + '</em>' + (c.pages ? ', ' + c.pages : '') + '.';
        },
        journalSubsequent: function (c) {
          return authorLastOnly(c.author) + ', "' + shortTitle(cleanTitle(c.title)) + '," ' + (c.pages ? c.pages + '.' : '.');
        },
        chapterSubsequent: function (c) {
          return authorLastOnly(c.author) + ', "' + shortTitle(cleanTitle(c.title)) + ',"' + (c.pages ? ' ' + c.pages : '') + '.';
        }
      }
    },
    JSNT: {
      name: 'Journal for the Study of the New Testament',
      abbrev: 'JSNT',
      base: 'SBLHS',
      notes: 'Follows SBLHS with SAGE house style. Full journal titles in bibliography.',
      abbreviateJournals: false,  // JSNT uses full journal titles
      rules: {
        bookFirst: function (c) {
          return authorFirstLast(c.author) + ', <em>' + c.title + '</em> (' + c.city + ': ' + c.publisher + ', ' + c.year + ')' + (c.pages ? ', ' + c.pages : '') + '.';
        },
        journalFirst: function (c, style) {
          var jName = style.abbreviateJournals ? abbreviateJournal(c.journal) : c.journal;
          return authorFirstLast(c.author) + ', "' + cleanTitle(c.title) + '," <em>' + jName + '</em> ' + c.volume + (c.issue ? ', no. ' + c.issue : '') + ' (' + c.year + '): ' + c.pages + '.';
        },
        chapterFirst: function (c) {
          return authorFirstLast(c.author) + ', "' + cleanTitle(c.title) + '," in <em>' + c.bookTitle + '</em>' + (c.editor ? ', ed. ' + c.editor : '') + ' (' + c.city + ': ' + c.publisher + ', ' + c.year + ')' + (c.pages ? ', ' + c.pages : '') + '.';
        },
        bookSubsequent: function (c) {
          return authorLastOnly(c.author) + ', <em>' + shortTitle(cleanTitle(c.title)) + '</em>' + (c.pages ? ', ' + c.pages : '') + '.';
        },
        journalSubsequent: function (c) {
          return authorLastOnly(c.author) + ', "' + shortTitle(cleanTitle(c.title)) + '," ' + (c.pages ? c.pages + '.' : '.');
        },
        chapterSubsequent: function (c) {
          return authorLastOnly(c.author) + ', "' + shortTitle(cleanTitle(c.title)) + ',"' + (c.pages ? ' ' + c.pages : '') + '.';
        }
      }
    },
    JSOT: {
      name: 'Journal for the Study of the Old Testament',
      abbrev: 'JSOT',
      base: 'SBLHS',
      notes: 'Follows SBLHS with SAGE house style. Nearly identical to JSNT rules.',
      abbreviateJournals: false,  // JSOT uses full journal titles
      rules: {
        bookFirst: function (c) {
          return authorFirstLast(c.author) + ', <em>' + c.title + '</em> (' + c.city + ': ' + c.publisher + ', ' + c.year + ')' + (c.pages ? ', ' + c.pages : '') + '.';
        },
        journalFirst: function (c, style) {
          var jName = style.abbreviateJournals ? abbreviateJournal(c.journal) : c.journal;
          return authorFirstLast(c.author) + ', "' + cleanTitle(c.title) + '," <em>' + jName + '</em> ' + c.volume + (c.issue ? ', no. ' + c.issue : '') + ' (' + c.year + '): ' + c.pages + '.';
        },
        chapterFirst: function (c) {
          return authorFirstLast(c.author) + ', "' + cleanTitle(c.title) + '," in <em>' + c.bookTitle + '</em>' + (c.editor ? ', ed. ' + c.editor : '') + ' (' + c.city + ': ' + c.publisher + ', ' + c.year + ')' + (c.pages ? ', ' + c.pages : '') + '.';
        },
        bookSubsequent: function (c) {
          return authorLastOnly(c.author) + ', <em>' + shortTitle(cleanTitle(c.title)) + '</em>' + (c.pages ? ', ' + c.pages : '') + '.';
        },
        journalSubsequent: function (c) {
          return authorLastOnly(c.author) + ', "' + shortTitle(cleanTitle(c.title)) + '," ' + (c.pages ? c.pages + '.' : '.');
        },
        chapterSubsequent: function (c) {
          return authorLastOnly(c.author) + ', "' + shortTitle(cleanTitle(c.title)) + ',"' + (c.pages ? ' ' + c.pages : '') + '.';
        }
      }
    }
  };

  // ══════════════════════════════════════════════════════════
  //  FORMATTING HELPERS
  // ══════════════════════════════════════════════════════════

  // Strip trailing commas/periods from a title
  function cleanTitle(t) {
    return (t || '').replace(/[,.\s]+$/, '').trim();
  }

  // "Last, First M." → "First M. Last"
  function authorFirstLast(author) {
    if (!author) return '';
    var parts = author.split(',');
    if (parts.length >= 2) {
      return parts.slice(1).join(',').trim() + ' ' + parts[0].trim();
    }
    return author; // already in First Last format
  }

  // "Last, First M." → "Last" or "First M. Last" → "Last"
  function authorLastOnly(author) {
    if (!author) return '';
    var parts = author.split(',');
    if (parts.length >= 2) return parts[0].trim();
    // Try "First Last" format
    var words = author.trim().split(/\s+/);
    return words[words.length - 1];
  }

  // Shorten title to first ~4 significant words
  function shortTitle(title) {
    if (!title) return '';
    var clean = title.replace(/^[""\u201c\u201d]+|[""\u201c\u201d]+$/g, '').trim();
    var words = clean.split(/\s+/);
    var stopWords = ['a', 'an', 'the', 'of', 'in', 'on', 'and', 'to', 'for', 'with', 'from'];
    // Take first 4 content words (skip leading articles)
    var significant = [];
    for (var i = 0; i < words.length && significant.length < 4; i++) {
      significant.push(words[i]);
    }
    return significant.join(' ');
  }

  // Look up SBLHS journal abbreviation
  function abbreviateJournal(journalName) {
    if (!journalName) return '';
    // Exact match
    if (JOURNAL_ABBREVS[journalName]) return JOURNAL_ABBREVS[journalName];
    // Case-insensitive match
    var lower = journalName.toLowerCase();
    for (var key in JOURNAL_ABBREVS) {
      if (key.toLowerCase() === lower) return JOURNAL_ABBREVS[key];
    }
    // Partial match
    for (var key in JOURNAL_ABBREVS) {
      if (lower.indexOf(key.toLowerCase()) >= 0 || key.toLowerCase().indexOf(lower) >= 0) {
        return JOURNAL_ABBREVS[key];
      }
    }
    return journalName; // no abbreviation found
  }

  // ══════════════════════════════════════════════════════════
  //  REFORMATTING ENGINE
  // ══════════════════════════════════════════════════════════

  function reformatCitations(parsed, styleName) {
    var style = STYLES[styleName];
    if (!style) return parsed.map(function (c) { return { original: c.raw, formatted: c.raw, type: c.type, isFirst: true }; });

    var rules = style.rules;
    var cited = {}; // track first vs subsequent by author+title key

    return parsed.map(function (c) {
      if (c.type === 'unknown') {
        return { original: c.raw, formatted: c.raw, formattedHtml: escapeHtml(c.raw), type: 'unknown', isFirst: true };
      }

      // Build a citation key to track first vs subsequent
      var citeKey = (c.author || '').toLowerCase() + '::' + (c.title || c.bookTitle || '').toLowerCase();
      var isFirst = !cited[citeKey];
      cited[citeKey] = true;

      var formattedHtml;
      if (c.type === 'journal') {
        formattedHtml = isFirst ? rules.journalFirst(c, style) : rules.journalSubsequent(c);
      } else if (c.type === 'book') {
        formattedHtml = isFirst ? rules.bookFirst(c) : rules.bookSubsequent(c);
      } else if (c.type === 'chapter') {
        formattedHtml = isFirst ? rules.chapterFirst(c) : rules.chapterSubsequent(c);
      } else {
        formattedHtml = escapeHtml(c.raw);
      }

      // Plain text version (strip HTML tags)
      var formatted = formattedHtml.replace(/<[^>]+>/g, '');

      return {
        original: c.raw,
        formatted: formatted,
        formattedHtml: formattedHtml,
        type: c.type,
        isFirst: isFirst
      };
    });
  }

  // ══════════════════════════════════════════════════════════
  //  CITATION PATTERN DETECTION
  // ══════════════════════════════════════════════════════════

  // Regex patterns for common citation formats
  const PATTERNS = {
    // Chapter in edited volume (strict): Author, "Chapter," in *Book*, ed. Editor (City: Publisher, Year), Pages.
    chapterStrict: /^(.+?),\s*[""\u201c](.+?)[""\u201d],?\s*in\s+(?:\*)?(.+?)(?:\*)?,\s*eds?\.\s*(.+?)\s*\(([A-Z][\w\s]+?):\s*(.+?),\s*(\d{4})\)(?:,\s*([\d\-–—,\s]+))?/,

    // Chapter in edited volume (loose): Author, "Chapter," in *Book* (City: Publisher, Year), Pages.
    // Catches chapters without explicit "ed." marker
    chapterLoose: /^(.+?),\s*[""\u201c](.+?)[""\u201d],?\s*in\s+(?:\*)?(.+?)(?:\*)?\s*\(([A-Z][\w\s]+?):\s*(.+?),\s*(\d{4})\)(?:,\s*([\d\-–—,\s]+))?/,

    // Journal article: Author, "Article Title," *Journal* Volume (Year): Pages.
    journal: /^(.+?),\s*[""\u201c](.+?)[""\u201d],?\s*(?:\*)?([A-Z][\w\s&:]+?)(?:\*)?[\s,]*(\d+)(?:[.,]\s*(?:no\.\s*)?(\d+))?\s*\((\d{4})\):\s*([\d\-–—,\s]+)/,

    // Book: Author, *Title* (City: Publisher, Year), Pages.
    book: /^(.+?),\s*(?:\*)?([^*""\u201c]+?)(?:\*)?[\s,]*\(([A-Z][\w\s]+?):\s*(.+?),\s*(\d{4})\)(?:,\s*([\d\-–—,\s]+))?/
  };

  function parseCitation(text) {
    const trimmed = text.trim();

    // Try chapter first (most specific — contains "in" + "ed./eds.")
    let m = trimmed.match(PATTERNS.chapterStrict);
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

    // Try chapter loose (has "in" but no "ed.")
    m = trimmed.match(PATTERNS.chapterLoose);
    if (m) {
      return {
        type: 'chapter',
        author: m[1].trim(),
        title: m[2].trim(),
        bookTitle: m[3].trim(),
        editor: '',
        city: m[4].trim(),
        publisher: m[5].trim(),
        year: m[6],
        pages: (m[7] || '').trim(),
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

    // Extract body paragraphs (text content without footnotes section)
    const bodyParagraphs = [];
    const bodyEls = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
    bodyEls.forEach(function (el) {
      const text = el.textContent.trim();
      if (text) {
        bodyParagraphs.push({
          text: text,
          tag: el.tagName.toLowerCase(),
          // Check for footnote references (superscript links)
          hasFootnoteRefs: el.querySelectorAll('a[href^="#footnote-"]').length > 0
        });
      }
    });

    return { footnotes, bodyParagraphs, html, messages };
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

  function renderReformatted(results, styleName) {
    reformattedList.innerHTML = '';
    var style = STYLES[styleName];
    reformatStyleLabel.textContent = 'Formatted for: ' + style.name + ' (' + style.base + ')';

    results.forEach(function (r, i) {
      var div = document.createElement('div');
      div.className = 'reformat-item';

      var badgeClass = r.type === 'unknown' ? 'unknown' : (r.isFirst ? 'first' : 'subsequent');
      var badgeLabel = r.type === 'unknown' ? 'Unchanged' : (r.isFirst ? 'First citation' : 'Subsequent');

      div.innerHTML =
        '<div class="reformat-num">Footnote ' + (i + 1) +
        ' <span class="cite-type-badge ' + badgeClass + '">' + badgeLabel + '</span></div>' +
        '<div class="reformat-row">' +
          '<div class="reformat-col">' +
            '<div class="reformat-col-label original">Original</div>' +
            '<div class="original-text">' + escapeHtml(r.original) + '</div>' +
          '</div>' +
          '<div class="reformat-col">' +
            '<div class="reformat-col-label formatted">Reformatted</div>' +
            '<div class="formatted-text">' + r.formattedHtml + '</div>' +
          '</div>' +
        '</div>';

      reformattedList.appendChild(div);
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
      const { footnotes, bodyParagraphs } = await extractFootnotes(currentFile);

      extractedFootnotes = footnotes;
      extractedBodyParagraphs = bodyParagraphs;

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

      // Step 3: Reformat
      statusText.textContent = 'Applying style rules…';
      var selectedJournal = document.querySelector('input[name="journal"]:checked').value;
      reformattedCitations = reformatCitations(parsedCitations, selectedJournal);

      // Step 4: Render all tabs
      renderFootnotes(footnotes);
      renderParsed(parsedCitations);
      renderReformatted(reformattedCitations, selectedJournal);

      const detected = parsedCitations.filter(function (c) { return c.type !== 'unknown'; }).length;
      footnoteCount.textContent = footnotes.length + ' footnotes · ' + detected + ' citations detected';

      resultsSection.classList.remove('hidden');
      statusBar.classList.add('hidden');
      reformatBtn.disabled = false;
      downloadBtn.disabled = false;

      // Switch to reformatted tab
      tabs.forEach(function (t) { t.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
      var reformatTab = document.querySelector('.tab[data-tab="reformatted"]');
      if (reformatTab) reformatTab.classList.add('active');
      var reformatPanel = document.getElementById('panel-reformatted');
      if (reformatPanel) reformatPanel.classList.add('active');

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

  downloadBtn.addEventListener('click', async function () {
    if (!reformattedCitations.length) {
      showToast('Please upload a .docx file first.', true);
      return;
    }

    const selectedJournal = document.querySelector('input[name="journal"]:checked').value;

    // Show processing state
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Generating .docx…';

    try {
      const D = docx; // docx.js UMD global

      // Build footnote definitions
      var footnoteMap = {};
      reformattedCitations.forEach(function (r, i) {
        var fnId = i + 1;
        // Parse the formatted HTML into text runs (handle <em> for italics)
        var runs = parseHtmlToRuns(r.formattedHtml || r.formatted, D);
        footnoteMap[fnId] = { children: [new D.Paragraph({ children: runs })] };
      });

      // Build body paragraphs with footnote references
      var docParagraphs = [];
      var fnIdx = 0;

      extractedBodyParagraphs.forEach(function (bp) {
        var heading = null;
        if (bp.tag === 'h1') heading = D.HeadingLevel.HEADING_1;
        else if (bp.tag === 'h2') heading = D.HeadingLevel.HEADING_2;
        else if (bp.tag === 'h3') heading = D.HeadingLevel.HEADING_3;

        var children = [new D.TextRun({ text: bp.text, font: 'Times New Roman', size: 24 })];

        // If this paragraph had footnote refs, add them
        if (bp.hasFootnoteRefs && fnIdx < reformattedCitations.length) {
          fnIdx++;
          children.push(new D.FootnoteReferenceRun(fnIdx));
        }

        var pOpts = { children: children, spacing: { after: 200 } };
        if (heading) pOpts.heading = heading;
        docParagraphs.push(new D.Paragraph(pOpts));
      });

      // If no body paragraphs were extracted, just list the reformatted citations
      if (docParagraphs.length === 0) {
        docParagraphs.push(new D.Paragraph({
          children: [new D.TextRun({ text: 'Reformatted Citations (' + selectedJournal + ')', bold: true, font: 'Times New Roman', size: 28 })],
          heading: D.HeadingLevel.HEADING_1
        }));
        reformattedCitations.forEach(function (r, i) {
          var runs = parseHtmlToRuns(r.formattedHtml || r.formatted, D);
          runs.unshift(new D.TextRun({ text: (i + 1) + '. ', bold: true, font: 'Times New Roman', size: 24 }));
          docParagraphs.push(new D.Paragraph({ children: runs, spacing: { after: 200 } }));
        });
      }

      var doc = new D.Document({
        footnotes: footnoteMap,
        sections: [{
          properties: {
            page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
          },
          children: docParagraphs
        }]
      });

      var blob = await D.Packer.toBlob(doc);
      var baseName = (currentFile.name || 'paper').replace(/\.docx$/i, '');
      saveAs(blob, baseName + '-reformatted-' + selectedJournal + '.docx');

      showToast('Downloaded! Check your reformatted document.');

    } catch (err) {
      console.error('Export error:', err);
      showToast('Export failed: ' + err.message, true);
    }

    downloadBtn.disabled = false;
    downloadBtn.textContent = 'Download Reformatted .docx';
  });

  // Parse simple HTML (with <em> tags) into docx TextRun array
  function parseHtmlToRuns(html, D) {
    if (!html) return [new D.TextRun({ text: '', font: 'Times New Roman', size: 20 })];

    var runs = [];
    // Split on <em>...</em> tags
    var parts = html.split(/(<em>.*?<\/em>)/g);
    parts.forEach(function (part) {
      if (!part) return;
      var emMatch = part.match(/^<em>(.*?)<\/em>$/);
      if (emMatch) {
        runs.push(new D.TextRun({ text: emMatch[1], italics: true, font: 'Times New Roman', size: 20 }));
      } else {
        // Strip any remaining HTML tags
        var clean = part.replace(/<[^>]+>/g, '');
        if (clean) {
          runs.push(new D.TextRun({ text: clean, font: 'Times New Roman', size: 20 }));
        }
      }
    });

    return runs.length ? runs : [new D.TextRun({ text: '', font: 'Times New Roman', size: 20 })];
  }

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

  console.log('ScholaCite v3.2 loaded');
});
