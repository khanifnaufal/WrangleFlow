# WrangleFlow

WrangleFlow is a fully functional, client-side data transformation and wrangling dashboard (CSV/JSON) built with **React**, **Vite**, **Tailwind CSS v4**, and **TanStack Table**. Designed to run completely in the browser for maximum privacy and speed without requiring any backend.

## 🚀 Key Features

*   **Drag & Drop Upload:** Seamlessly upload CSV or JSON datasets.
*   **Automatic Parsing & Typing:** Built-in header detection and smart column data typing (Number, String, Date) via [PapaParse](https://www.papaparse.com/).
*   **Interactive Data Preview:** Fast, paginated, and sortable tables driven by [@tanstack/react-table](https://tanstack.com/table).
*   **Comprehensive Transformation Pipeline:**
    *   **Clean:** Remove Duplicates, Trim Whitespace, Handle Missing Values (Drop, Fill Mean/Median/Custom).
    *   **Text:** Normalize text columns (lowercase, uppercase, Title Case), Convert dates to ISO 8601, Find & Replace.
    *   **Columns:** Rename or Delete columns safely (with custom confirmation modals), Change column data types.
    *   **Filter Rows:** Apply strict logical conditions (contains, equals, >, <, etc.) to permanently filter your dataset.
*   **Undo / Redo System:** Safely travel backward or forward through your data history if you make a mistake.
*   **Data Quality Report:** Instantly view statistics per column (missing percentages, uniqueness flags) and comprehensive column summaries (min/max/mean/median).
*   **Pipeline Persistence:** Transformation steps and history are saved efficiently to your browser's `localStorage` to prevent accidental data loss.
*   **Dark Mode Ready:** Beautifully crafted, seamless light/dark mode UI out of the box using generic utility classes.
*   **Export Data:** Download your newly wrangled dataset instantly as a pristine `.csv` or `.json` file.

## 🛠️ Installation and Setup

1. Clone the repository and navigate into the folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser.

## 📁 Project Structure (Componentized Architecture)

WrangleFlow is designed with a clean, modular structure leveraging React Context:

*   `src/context/WrangleContext.jsx`: The "brain" of the app, handling complex state management, data pipelines, and transformation algorithms.
*   `src/utils/helpers.js`: Pure JavaScript utilities for detecting data types and calculating stats, keeping UI logic clean.
*   `src/components/`
    *   `layout/Header.jsx`: Top navigation, theme toggling, and undo/redo controls.
    *   `features/FileUpload.jsx`: The Drag & Drop file intake handler.
    *   `features/TransformPanel.jsx`: Tabbed interface housing all data manipulation commands.
    *   `features/PreviewPanel.jsx`: Dual-mode panel for Data Preview (Table) and Quality Report metrics.
    *   `features/Sidebar.jsx`: Column profiler, export controls, and live pipeline action log.
    *   `ui/index.jsx`: Reusable atomic UI components (Dropdowns, Badges, Modals).
*   `src/index.css`: Design system foundation, typography, and custom plain-CSS variants configured to complement Tailwind v4.

## 🎨 Tailwind CSS (v4) Setup

WrangleFlow utilizes the latest Vite-powered **Tailwind v4**.
Configuration is loaded smoothly from local css constraints containing base styling components and button variants to circumvent `@apply` pseudo-element syntax limitations.

## ⭐ Usage Guide

1. Drag-and-drop a dataset to start.
2. Verify columns and check the **Quality Report** tab to understand what needs cleaning.
3. Apply transformations sequentially using the **🧹 Clean**, **✏️ Text**, and **⚙️ Columns** tabs.
4. Filter out any noise via the **🔍 Filter Rows** capabilities.
5. If you make an error, simply press `Undo` to revert the dataset precisely.
6. Once satisfied, type your preferred project name and hit **Export CSV/JSON** to finalize your data engineering workflow.

## 🧪 Testing and Linting

- Run the linter: `npm run lint`
- Test the production build: `npm run build`

---

*This project provides an efficient user-facing dataset preparation experience entirely clientside and is production-ready for platforms like Vercel, Netlify, or GitHub Pages.*
