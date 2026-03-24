# WrangleFlow

WrangleFlow is a client-side data transformation dashboard (CSV/JSON) built with React + Vite + Tailwind CSS.

## 🚀 Main Features

- Upload CSV / JSON files.
- Automatic header detection and parsing using [PapaParse](https://www.papaparse.com/).
- Interactive data preview with [@tanstack/react-table](https://tanstack.com/table).
- Data transformation pipeline:
  - Remove Duplicates
  - Trim Whitespace
  - Missing value handling (drop, mean, median)
  - Normalize text column (lowercase/uppercase/titlecase)
  - Convert date strings to ISO format
  - Rename / Delete column
  - Change column type (number/string/date)
- Pipeline step history in-app (operation preview).

## 🛠️ Installation and Run

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## 📁 Project Structure

- `src/main.jsx`: entry point, imports `index.css`, renders `App`.
- `src/App.jsx`: main data wrangling and table logic.
- `src/App.css`: component-local styling.
- `src/index.css`: global styles and Tailwind import.
- `tailwind.config.js`: Tailwind v4 configuration.
- `postcss.config.js`: `@tailwindcss/postcss` plugin configuration.

## 🎨 Tailwind CSS (v4) Setup

`src/index.css` uses:

```css
@import "tailwindcss";
```

`tailwind.config.js` content source:

```js
content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}']
```

## ⭐ Usage

1. Upload a CSV/JSON file.
2. Verify data and detected columns.
3. Choose a transformation in the panel.
4. Click `Apply` / `Convert` / `Rename` / `Delete` as needed.
5. Check the pipeline change log.
6. Download the output if desired (export feature can be added).

## 🧪 Testing and Linting

- `npm run lint`
- `npm run build` (production build)

## 💡 Future Improvements

- Add `Export to CSV/JSON` feature.
- Save pipeline to browser `localStorage`.
- Add table filtering / sorting.
- Add stricter data typing and schema validation.

---

This project is ready for simple user-facing data wrangling use cases and can be deployed to GitHub Pages / Netlify without additional backend services.

