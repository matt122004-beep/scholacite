# ScholaCite — Biblical Studies Citation Formatter

Upload a PDF or Word document and get a properly formatted citation for biblical studies journals.

## Supported Citation Styles
- **SBL/JBL** — SBL Handbook of Style 2nd ed. (footnote)
- **JSOT** — Author-date or footnote
- **JSNT** — SAGE Harvard (author-date)
- **Generic SBL** — Books, articles, essays in collections

## Freemium Model
- 1 free conversion per user per month
- $5/month for unlimited

## Tech Stack
- **Frontend**: Vanilla HTML/CSS/JS (static, deployable to GitHub Pages)
- **Backend**: Python FastAPI + NVIDIA NIM (Qwen3-Coder, free API)
- **Document parsing**: PyMuPDF (PDF), python-docx (Word)

## Running Locally

```bash
# Backend
cd citation-formatter
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
# → http://localhost:8000

# Frontend
open index.html
```

## Deployment
- **Frontend**: Deploy `index.html` + `style.css` to GitHub Pages or Netlify
- **Backend**: Deploy `main.py` to Render (free tier) or Railway
  - Set env var: `NVIDIA_API_KEY`
  - Update `API_URL` in `index.html` to your backend URL

## Files
```
citation-formatter/
├── index.html       # Frontend UI
├── style.css        # Styles
├── main.py          # FastAPI backend
├── requirements.txt # Python deps
└── README.md
```
