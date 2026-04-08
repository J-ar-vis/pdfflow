// ============================================================
// PDFFlow — Main Application Component
// Stack : React (single-page, no router refresh)
// Design: Modern + colorful (Canva-style), fully responsive
// PRD   : PDF Editor Web App (April 2026)
// Author: Built with Claude (Anthropic)
//
// HOW NAVIGATION WORKS (no page refresh):
//   - We use a single `page` state variable.
//   - Switching pages just re-renders the right component.
//   - React Router is NOT needed at this stage; add it later
//     if you want proper browser back-button support.
//
// FILE STRUCTURE (single file for now — split later):
//   1. DESIGN TOKENS  — colors, fonts, breakpoints
//   2. GLOBAL STYLES  — CSS injected into <style> tag
//   3. SHARED ATOMS   — tiny reusable UI pieces
//   4. NAVBAR         — top navigation bar
//   5. HOME PAGE      — landing page with hero + tool grid
//   6. TOOLS PAGE     — all utility tools (merge/split/etc.)
//   7. EDITOR PAGE    — PDF inline text editor
//   8. UPGRADE PAGE   — shown when usage limit hit (429)
//   9. ABOUT PAGE     — needed for AdSense approval
//  10. PRIVACY PAGE   — needed for AdSense approval
//  11. TERMS PAGE     — needed for AdSense approval
//  12. FOOTER         — site-wide footer
//  13. APP ROOT       — wires everything together
// ============================================================
import React from "react";
import { useState, useRef, useCallback } from "react";

// ============================================================
// 1. DESIGN TOKENS
// Central place for all colors, sizes, and font choices.
// Change a value here → it updates everywhere in the app.
// ============================================================

const FONT_DISPLAY = "'Syne', sans-serif";   // headings — geometric, bold
const FONT_BODY    = "'DM Sans', sans-serif"; // body text — clean, readable

// Color palette — each tool/feature has its own accent color.
// bg   = light tinted background (used for icon backgrounds, badges)
// text = readable text color on that bg
// border = subtle border / outline
// strong = main accent (buttons, active states)
const PALETTE = {
  purple: { bg: "#EEEDFE", text: "#534AB7", border: "#AFA9EC", strong: "#7F77DD" },
  teal:   { bg: "#E1F5EE", text: "#0F6E56", border: "#5DCAA5", strong: "#1D9E75" },
  blue:   { bg: "#E6F1FB", text: "#185FA5", border: "#85B7EB", strong: "#378ADD" },
  amber:  { bg: "#FAEEDA", text: "#854F0B", border: "#EF9F27", strong: "#BA7517" },
  coral:  { bg: "#FAECE7", text: "#993C1D", border: "#F0997B", strong: "#D85A30" },
  pink:   { bg: "#FBEAF0", text: "#993556", border: "#ED93B1", strong: "#D4537E" },
};

// ============================================================
// 2. TOOLS DATA
// Single source of truth for every tool card.
// To ADD a new tool: just push a new object here.
// id       → used for routing + API endpoint names
// label    → display name
// desc     → short description shown on card
// color    → key from PALETTE above
// icon     → simple text/unicode icon (swap for SVG later)
// day      → PRD build day (useful reference while building)
// apiPath  → backend endpoint this tool will call (Day 2-6)
// ============================================================

const ALL_TOOLS = [
  // ── Core editing tools (P0 — highest priority) ──
  { id: "edit",     label: "Edit PDF",    desc: "Click text to edit inline",  color: "purple", icon: "✏",  day: "4-5", apiPath: "/api/edit/add-text"    },
  { id: "spell",    label: "Spell Check", desc: "Find & fix spelling errors",  color: "purple", icon: "✓",  day: "5",   apiPath: "/api/edit/spell-check" },

  // ── Utility tools (built Day 2-3) ──
  { id: "merge",    label: "Merge PDFs",  desc: "Combine multiple PDFs",      color: "teal",   icon: "⊕",  day: "2",   apiPath: "/api/merge"            },
  { id: "split",    label: "Split PDF",   desc: "Extract specific pages",     color: "blue",   icon: "✂",  day: "2",   apiPath: "/api/split"            },
  { id: "compress", label: "Compress",    desc: "Reduce file size",           color: "amber",  icon: "⊡",  day: "3",   apiPath: "/api/compress"         },
  { id: "to-jpg",   label: "PDF to JPG",  desc: "Convert pages to images",    color: "coral",  icon: "⊞",  day: "3",   apiPath: "/api/to-image"         },
  { id: "to-word",  label: "PDF to Word", desc: "Editable DOCX file",         color: "pink",   icon: "⊟",  day: "3",   apiPath: "/api/to-docx"          },
  { id: "rotate",   label: "Rotate",      desc: "Fix page orientation",       color: "teal",   icon: "↻",  day: "3",   apiPath: "/api/rotate"           },

  // ── FUTURE TOOLS — add here when backend is ready ──
  // { id: "ocr",   label: "OCR / Scan",  desc: "Make scanned PDFs editable", color: "blue",   icon: "⊙",  day: "future", apiPath: "/api/ocr" },
  // { id: "sign",  label: "Sign PDF",    desc: "Add your signature",         color: "teal",   icon: "✍",  day: "future", apiPath: "/api/sign" },
];

// Editor sidebar tools — shown inside the PDF editor panel
const EDITOR_TOOLS = [
  { id: "edit-text",  label: "Edit text",    icon: "T",  color: "purple", tip: "Click on any text in the PDF to edit it" },
  { id: "add-text",   label: "Add text box", icon: "+",  color: "blue",   tip: "Click anywhere on the page to add new text" },
  { id: "highlight",  label: "Highlight",    icon: "H",  color: "amber",  tip: "Select text to highlight it in yellow" },
  { id: "delete",     label: "Delete text",  icon: "✕",  color: "coral",  tip: "Select text and cover it with a white box" },

  // ── FUTURE EDITOR TOOLS — uncomment when ready ──
  // { id: "image",   label: "Add image",    icon: "⊞", color: "teal",   tip: "Insert an image onto the page" },
  // { id: "draw",    label: "Draw",         icon: "✏", color: "pink",   tip: "Freehand drawing on the PDF" },
];

// ============================================================
// 3. GLOBAL STYLES
// Injected as a <style> tag so we stay in one file.
// When you split into separate files, move this to App.css.
//
// WHY NOT TAILWIND?
//   Tailwind is in the PRD but needs a build step to set up.
//   This CSS-in-JS approach works with zero config right now.
//   You can swap to Tailwind later — the class names here
//   are named exactly like Tailwind utilities for easy migration.
// ============================================================

const GLOBAL_STYLES = `
  /* ── Google Fonts ── */
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');

  /* ── Reset & Base ── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    font-family: ${FONT_BODY};
    background: #F4F2FF;
    color: #1A1835;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }
  button, input, select, textarea { font-family: inherit; }
  a { color: inherit; text-decoration: none; }

  /* ── Scrollbar styling ── */
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #AFA9EC; border-radius: 3px; }

  /* ── Animations ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes floatY {
    0%, 100% { transform: translateY(0px);  }
    50%       { transform: translateY(-7px); }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  @keyframes pulseGlow {
    0%   { box-shadow: 0 0 0 0   rgba(29,158,117,0.4); }
    70%  { box-shadow: 0 0 0 10px rgba(29,158,117,0);   }
    100% { box-shadow: 0 0 0 0   rgba(29,158,117,0);    }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ── Animation utility classes ── */
  .fade-up   { animation: fadeUp 0.45s ease both; }
  .fade-in   { animation: fadeIn 0.3s ease both;  }
  .d1 { animation-delay: 0.06s; }
  .d2 { animation-delay: 0.12s; }
  .d3 { animation-delay: 0.18s; }
  .d4 { animation-delay: 0.24s; }
  .d5 { animation-delay: 0.30s; }
  .d6 { animation-delay: 0.36s; }

  /* ── Reusable component classes ── */

  /* Tool cards on home and tools page */
  .tool-card {
    background: white;
    border: 0.5px solid #E0DEFA;
    border-radius: 16px;
    padding: 18px 16px;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .tool-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 28px rgba(83,74,183,0.13);
    border-color: #7F77DD;
  }

  /* Drag-and-drop upload area */
  .upload-zone {
    border: 2px dashed #AFA9EC;
    border-radius: 18px;
    padding: 36px 24px;
    text-align: center;
    background: #F8F7FF;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
    width: 100%;
  }
  .upload-zone:hover, .upload-zone.drag-over {
    background: #EEEDFE;
    border-color: #7F77DD;
  }

  /* Navigation links */
  .nav-link {
    font-size: 14px;
    color: #6B6B8A;
    cursor: pointer;
    padding: 4px 2px;
    border-bottom: 2px solid transparent;
    transition: color 0.15s, border-color 0.15s;
    white-space: nowrap;
  }
  .nav-link:hover { color: #534AB7; }
  .nav-link.active { color: #534AB7; border-bottom-color: #7F77DD; font-weight: 500; }

  /* Sidebar tool buttons inside the editor */
  .sidebar-btn {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 9px 10px;
    border-radius: 10px;
    font-size: 13px;
    color: #6B6B8A;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    border: none;
    background: transparent;
    width: 100%;
    text-align: left;
  }
  .sidebar-btn:hover  { background: #F4F2FF; color: #534AB7; }
  .sidebar-btn.active { background: #EEEDFE; color: #534AB7; font-weight: 500; }

  /* Toolbar pills at top of editor */
  .toolbar-pill {
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 13px;
    border: 0.5px solid #E0DEFA;
    background: white;
    color: #534AB7;
    transition: background 0.15s, border-color 0.15s;
    white-space: nowrap;
  }
  .toolbar-pill:hover  { background: #EEEDFE; }
  .toolbar-pill.active { background: #7F77DD; color: white; border-color: #7F77DD; }

  /* Primary CTA button */
  .btn-primary {
    background: #7F77DD;
    color: white;
    border: none;
    border-radius: 12px;
    padding: 13px 30px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
    white-space: nowrap;
  }
  .btn-primary:hover  { background: #534AB7; }
  .btn-primary:active { transform: scale(0.97); }

  /* Secondary outline button */
  .btn-outline {
    background: white;
    color: #534AB7;
    border: 1.5px solid #AFA9EC;
    border-radius: 12px;
    padding: 12px 28px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
    white-space: nowrap;
  }
  .btn-outline:hover { background: #EEEDFE; border-color: #7F77DD; }

  /* Quick-action pill tags (e.g. "Merge PDFs", "Compress") */
  .pill-tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 14px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
    border: none;
  }
  .pill-tag:hover  { opacity: 0.82; }
  .pill-tag:active { transform: scale(0.96); }

  /* Save button — glowing green to draw attention */
  .save-btn {
    background: #1D9E75;
    color: white;
    border: none;
    border-radius: 10px;
    padding: 9px 22px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
    animation: pulseGlow 2.5s infinite;
    white-space: nowrap;
  }
  .save-btn:hover { background: #0F6E56; }

  /* Spinner for loading states */
  .spinner {
    width: 20px; height: 20px;
    border: 2px solid #E0DEFA;
    border-top-color: #7F77DD;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }

  /* ── Responsive breakpoints ──
     Mobile  : < 480px
     Tablet  : 480px – 768px
     Desktop : > 768px
  */
  @media (max-width: 768px) {
    .hide-tablet  { display: none !important; }
  }
  @media (max-width: 480px) {
    .hide-mobile  { display: none !important; }
    .tools-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
    .tools-grid-3 { grid-template-columns: repeat(2, 1fr) !important; }
    .hero-title   { font-size: 28px !important; line-height: 1.2 !important; }
    .hero-btns    { flex-direction: column !important; }
    .editor-sidebar { display: none !important; }
    .steps-grid   { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 360px) {
    .tools-grid-4 { grid-template-columns: 1fr !important; }
  }
`;

// ============================================================
// 4. SHARED ATOM COMPONENTS
// Tiny pieces used across multiple pages.
// Keep these pure (no state) so they're easy to test/swap.
// ============================================================

/**
 * ToolIcon — colored square icon for each tool card.
 * @param {string} color  — key from PALETTE
 * @param {string} icon   — unicode character / emoji
 * @param {number} size   — icon box size in px (default 40)
 */
function ToolIcon({ color, icon, size = 40 }) {
  const c = PALETTE[color];
  return (
    <div style={{
      width: size, height: size,
      borderRadius: size * 0.3,
      background: c.bg,
      color: c.text,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.44,
      flexShrink: 0,
    }}>
      {icon}
    </div>
  );
}

/**
 * UsagePill — shows "X/5 uses left today" badge.
 * Color shifts from green (plenty left) to amber (almost out).
 * @param {number} used — how many operations used today (0–5)
 */
function UsagePill({ used = 1 }) {
  const left   = 5 - used;
  const isLow  = left <= 1;
  const bg     = isLow ? PALETTE.amber.bg   : PALETTE.teal.bg;
  const color  = isLow ? PALETTE.amber.text : PALETTE.teal.text;
  return (
    <div style={{ background: bg, color, fontSize: 12, fontWeight: 500, padding: "4px 12px", borderRadius: 20 }}>
      {left}/5 uses left today
    </div>
  );
}

/**
 * SectionLabel — small uppercase label above section headings.
 * Consistent typographic pattern used on every page.
 */
function SectionLabel({ children }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 500, color: "#9B8FCC", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 14 }}>
      {children}
    </p>
  );
}

/**
 * Divider — thin horizontal line for visual separation.
 */
function Divider({ margin = "12px 0" }) {
  return <div style={{ borderTop: "0.5px solid #E0DEFA", margin }} />;
}

/**
 * BgBlobs — decorative gradient orbs fixed to viewport.
 * Pure visual — no interaction, no layout impact.
 * Gives the page depth without heavy gradients.
 */
function BgBlobs() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 0, pointerEvents: "none" }} aria-hidden="true">
      <div style={{ position: "absolute", top: -140, left: -100, width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, #EEEDFE 0%, transparent 70%)", opacity: 0.65 }} />
      <div style={{ position: "absolute", top: "40%", right: -120, width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, #E1F5EE 0%, transparent 70%)", opacity: 0.55 }} />
      <div style={{ position: "absolute", bottom: -100, left: "30%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, #E6F1FB 0%, transparent 70%)", opacity: 0.45 }} />
    </div>
  );
}

// ============================================================
// 5. NAVBAR
// Sticky top bar — always visible, no page refresh on nav.
//
// Props:
//   page      — current active page string
//   setPage   — function to switch pages (no refresh)
//   loggedIn  — boolean: is user signed in via Google?
//   setLoggedIn — toggle (simulated — wire to Firebase Auth later)
//   usedCount — how many operations used today (0–5)
// ============================================================

function Navbar({ page, setPage, loggedIn, setLoggedIn, usedCount }) {

  // Mobile menu open/close state
  const [menuOpen, setMenuOpen] = useState(false);

  // Pages that appear in the nav menu
  const NAV_ITEMS = [
    { id: "home",    label: "Home"    },
    { id: "tools",   label: "Tools"   },
    { id: "editor",  label: "Editor"  },
    { id: "about",   label: "About"   },
  ];

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 200,
      background: "rgba(255,255,255,0.88)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      borderBottom: "0.5px solid #E0DEFA",
    }}>
      {/* ── Main nav row ── */}
      <div style={{ display: "flex", alignItems: "center", height: 60, padding: "0 24px", gap: 28, maxWidth: 1100, margin: "0 auto" }}>

        {/* Logo */}
        <div
          onClick={() => { setPage("home"); setMenuOpen(false); }}
          style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, color: "#7F77DD", cursor: "pointer", letterSpacing: "-0.5px", userSelect: "none", flexShrink: 0 }}
          role="button" aria-label="Go to home"
        >
          PDF<span style={{ color: "#1D9E75" }}>Flow</span>
        </div>

        {/* Desktop nav links — hidden on mobile */}
        <div className="hide-mobile" style={{ display: "flex", gap: 24, flex: 1 }}>
          {NAV_ITEMS.map(item => (
            <span
              key={item.id}
              className={`nav-link ${page === item.id ? "active" : ""}`}
              onClick={() => setPage(item.id)}
              role="button"
            >
              {item.label}
            </span>
          ))}
        </div>

        {/* Right side — auth + usage */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>

          {loggedIn ? (
            // Logged-in state: show usage pill + avatar
            <>
              <UsagePill used={usedCount} />
              {/* Avatar — click to "log out" (simulated) */}
              <div
                onClick={() => setLoggedIn(false)}
                title="Sign out"
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "#7F77DD", color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14,
                  cursor: "pointer", flexShrink: 0,
                  border: "2px solid white",
                  boxShadow: "0 0 0 2px #AFA9EC",
                }}
              >
                R
              </div>
            </>
          ) : (
            // Logged-out state: Sign in button
            <button
              className="btn-primary"
              style={{ padding: "8px 16px", fontSize: 13, borderRadius: 10 }}
              onClick={() => setLoggedIn(true)}
              // TODO Day 5: Replace onClick with Firebase signInWithPopup
              // import { signInWithPopup } from "firebase/auth";
              // const result = await signInWithPopup(auth, googleProvider);
            >
              Sign in with Google
            </button>
          )}

          {/* Mobile hamburger button */}
          <button
            className="hide-tablet"  // only show on mobile (< 480px)
            onClick={() => setMenuOpen(m => !m)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#534AB7", fontSize: 20, display: "none" }}
            aria-label="Open menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown menu ── */}
      {menuOpen && (
        <div className="fade-in" style={{ borderTop: "0.5px solid #E0DEFA", background: "white", padding: "12px 24px" }}>
          {NAV_ITEMS.map(item => (
            <div
              key={item.id}
              onClick={() => { setPage(item.id); setMenuOpen(false); }}
              style={{ padding: "12px 0", fontSize: 15, fontWeight: page === item.id ? 500 : 400, color: page === item.id ? "#534AB7" : "#1A1835", borderBottom: "0.5px solid #F4F2FF", cursor: "pointer" }}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </nav>
  );
}

// ============================================================
// 6. HOME PAGE
// Landing page — hero, upload zone, tool grid, how-it-works.
//
// PRD references:
//   - "Simple clean UI — no clutter, mobile friendly"
//   - "5 free uses per Gmail account per day"
//   - Upload zone (drag-and-drop)
//   - All 8 tools visible as cards
// ============================================================

function HomePage({ setPage, loggedIn }) {
  // dragOver = true while user is dragging a file over the upload zone
  const [dragOver, setDragOver] = useState(false);

  // Prevent default to allow drop event to fire
  const handleDragOver = useCallback(e => { e.preventDefault(); setDragOver(true); }, []);
  const handleDragLeave = useCallback(() => setDragOver(false), []);

  // When file is dropped → go straight to editor
  // TODO Day 4: Read the dropped file with FileReader, store in context/state,
  //             pass it to the Editor page to render with PDF.js
  const handleDrop = useCallback(e => {
    e.preventDefault();
    setDragOver(false);
    setPage("editor");
  }, [setPage]);

  return (
    <div style={{ position: "relative", zIndex: 1 }}>

      {/* ── HERO SECTION ── */}
      <section style={{ padding: "68px 24px 48px", textAlign: "center", maxWidth: 720, margin: "0 auto" }}>

        {/* Small badge above headline */}
        <div className="fade-up" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "#EEEDFE", color: "#534AB7",
          fontSize: 13, fontWeight: 500, padding: "5px 16px",
          borderRadius: 20, marginBottom: 22,
          border: "0.5px solid #AFA9EC",
        }}>
          <span style={{ fontSize: 14 }}>✦</span>
          Free · No signup for basic tools
        </div>

        {/* Main headline */}
        <h1 className="fade-up d1 hero-title" style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 50, fontWeight: 700, lineHeight: 1.1,
          color: "#1A1835", marginBottom: 18,
        }}>
          Edit PDFs like a<br />
          <span style={{ color: "#7F77DD" }}>Google Doc</span>
        </h1>

        {/* Sub-headline */}
        <p className="fade-up d2" style={{ fontSize: 17, color: "#6B6B8A", lineHeight: 1.75, marginBottom: 34, maxWidth: 460, margin: "0 auto 34px" }}>
          Click on any text in your PDF and edit it directly.
          Merge, split, compress — all free, right in your browser.
        </p>

        {/* CTA buttons */}
        <div className="fade-up d3 hero-btns" style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 48, flexWrap: "wrap" }}>
          <button
            className="btn-primary"
            onClick={() => setPage("editor")}
            style={{ animation: "floatY 3.2s ease-in-out infinite" }}
          >
            Start editing — it's free
          </button>
          <button className="btn-outline" onClick={() => setPage("tools")}>
            See all tools
          </button>
        </div>

        {/* ── UPLOAD ZONE ── */}
        {/* 
          This is the primary entry point for uploading a PDF.
          On drop → navigate to editor.
          TODO Day 4: Attach actual FileReader logic here.
          The dropped/selected file should be stored in a
          top-level state or React Context so the Editor
          page can access it without another upload.
        */}
        <div
          className={`fade-up d4 upload-zone ${dragOver ? "drag-over" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => setPage("editor")}
          role="button"
          aria-label="Upload a PDF file"
          tabIndex={0}
          onKeyDown={e => e.key === "Enter" && setPage("editor")}
        >
          {/* Upload icon with float animation */}
          <div style={{
            width: 56, height: 56,
            background: "#7F77DD", borderRadius: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
            animation: "floatY 3s ease-in-out infinite",
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v13"/>
              <path d="M7 7l5-5 5 5"/>
              <path d="M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2"/>
            </svg>
          </div>

          <p style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: "#534AB7", marginBottom: 5 }}>
            {dragOver ? "Drop it! 🎉" : "Drop your PDF here"}
          </p>
          <span style={{ fontSize: 13, color: "#9B8FCC" }}>
            or click to browse · max 20MB
          </span>

          {/* Quick-action pills inside upload zone */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
            {[
              { label: "Merge PDFs",  color: "purple" },
              { label: "Compress",    color: "teal"   },
              { label: "PDF to Word", color: "blue"   },
              { label: "Split PDF",   color: "amber"  },
            ].map(q => (
              <span
                key={q.label}
                className="pill-tag"
                style={{ background: PALETTE[q.color].bg, color: PALETTE[q.color].text, border: `0.5px solid ${PALETTE[q.color].border}` }}
                onClick={e => { e.stopPropagation(); setPage("tools"); }}
              >
                {q.label}
              </span>
            ))}
          </div>
        </div>

        {/* Trust line below upload zone */}
        <p style={{ marginTop: 14, fontSize: 12, color: "#B0A8D0" }}>
          🔒 Files are processed instantly and never stored on our servers
        </p>
      </section>

      {/* ── ALL TOOLS GRID ── */}
      <section style={{ padding: "0 24px 64px", maxWidth: 980, margin: "0 auto" }}>
        <SectionLabel>All tools</SectionLabel>

        {/* 4 columns desktop → 2 mobile (via class in GLOBAL_STYLES) */}
        <div
          className="tools-grid-4"
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}
        >
          {ALL_TOOLS.map((tool, i) => (
            <div
              key={tool.id}
              className={`tool-card fade-up d${Math.min(i + 1, 6)}`}
              onClick={() => setPage(tool.id === "edit" ? "editor" : "tools")}
              role="button"
              aria-label={tool.label}
            >
              <ToolIcon color={tool.color} icon={tool.icon} size={42} />
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600, color: "#1A1835", marginBottom: 3 }}>
                  {tool.label}
                </div>
                <div style={{ fontSize: 12, color: "#9B8FCC" }}>
                  {tool.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: "white", borderTop: "0.5px solid #E0DEFA", borderBottom: "0.5px solid #E0DEFA", padding: "60px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <SectionLabel>How it works</SectionLabel>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 700, color: "#1A1835", marginBottom: 48 }}>
            Three steps, zero hassle
          </h2>

          <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 36, textAlign: "left" }}>
            {[
              { num: "01", title: "Upload your PDF",     desc: "Drag and drop or click to browse. We support PDFs up to 20MB — no account needed.",  color: "purple" },
              { num: "02", title: "Edit or process it",  desc: "Click on text to edit inline, or choose a tool — merge, compress, rotate, convert.",  color: "teal"   },
              { num: "03", title: "Download instantly",  desc: "Your processed PDF is ready in seconds. Downloads start automatically.",               color: "blue"   },
            ].map(s => (
              <div key={s.num}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 44, fontWeight: 700, color: PALETTE[s.color].strong, opacity: 0.2, marginBottom: 6, lineHeight: 1 }}>
                  {s.num}
                </div>
                <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, color: "#1A1835", marginBottom: 8 }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: 14, color: "#6B6B8A", lineHeight: 1.7 }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── USAGE LIMIT EXPLAINER ── */}
      {/* 
        PRD: "5 free uses per Gmail account per day — clear and fair limit"
        Show this section to set user expectations before they hit the limit.
      */}
      <section style={{ padding: "56px 24px", maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
        <div style={{
          background: "white", borderRadius: 20,
          border: "0.5px solid #E0DEFA",
          padding: "32px 28px",
        }}>
          <div style={{ fontSize: 32, marginBottom: 14 }}>✦</div>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: "#1A1835", marginBottom: 10 }}>
            5 free operations per day
          </h3>
          <p style={{ fontSize: 14, color: "#6B6B8A", lineHeight: 1.7, marginBottom: 20 }}>
            Sign in with your Gmail account to get 5 free PDF operations every day.
            No credit card. No subscription. Just useful tools, free.
          </p>
          {!loggedIn && (
            <p style={{ fontSize: 13, color: "#9B8FCC" }}>
              Basic tools work without signing in. Sign in to unlock the usage counter and editor features.
            </p>
          )}
        </div>
      </section>

      {/* 
        ── FUTURE SECTION SLOTS ──
        Add a Testimonials section here when you have real users.
        Add a Pricing/Upgrade section here when monetising.
        Add a Blog/SEO section here for Google AdSense traffic.
      */}

    </div>
  );
}

// ============================================================
// 7. TOOLS PAGE
// Shows all utility tools as large cards.
// When a tool is selected, an upload zone appears below.
//
// PRD: Merge, Split, Compress, PDF to JPG, Rotate, PDF to Word
// API: Each tool's endpoint is listed in ALL_TOOLS above.
// ============================================================

function ToolsPage({ setPage }) {
  // Which tool is currently selected (null = none)
  const [activeToolId, setActiveToolId] = useState(null);
  const [dragOver, setDragOver]         = useState(false);

  // The currently selected tool object
  const activeTool = ALL_TOOLS.find(t => t.id === activeToolId);

  const handleToolClick = (tool) => {
    if (tool.id === "edit") { setPage("editor"); return; }
    setActiveToolId(prev => prev === tool.id ? null : tool.id); // toggle
  };

  return (
    <div style={{ position: "relative", zIndex: 1, padding: "48px 24px", maxWidth: 980, margin: "0 auto" }}>

      {/* Page header */}
      <h1 className="fade-up" style={{ fontFamily: FONT_DISPLAY, fontSize: 34, fontWeight: 700, color: "#1A1835", marginBottom: 8 }}>
        All PDF Tools
      </h1>
      <p className="fade-up d1" style={{ fontSize: 15, color: "#6B6B8A", marginBottom: 40 }}>
        Everything you need to work with PDFs — free, fast, and private. No files stored.
      </p>

      {/* Tool cards grid — 4 col desktop, 2 mobile */}
      <div
        className="tools-grid-4"
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}
      >
        {ALL_TOOLS.map((tool, i) => (
          <div
            key={tool.id}
            className={`tool-card fade-up d${Math.min(i + 1, 6)}`}
            style={{ borderColor: activeToolId === tool.id ? PALETTE[tool.color].border : undefined, borderWidth: activeToolId === tool.id ? 1.5 : undefined }}
            onClick={() => handleToolClick(tool)}
            role="button"
            aria-pressed={activeToolId === tool.id}
          >
            <ToolIcon color={tool.color} icon={tool.icon} size={46} />
            <div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 600, color: "#1A1835", marginBottom: 4 }}>
                {tool.label}
              </div>
              <div style={{ fontSize: 12, color: "#9B8FCC" }}>{tool.desc}</div>
            </div>
            {/* Free badge */}
            <span style={{
              alignSelf: "flex-start",
              fontSize: 11, fontWeight: 500,
              background: PALETTE[tool.color].bg,
              color: PALETTE[tool.color].text,
              padding: "3px 10px", borderRadius: 20,
            }}>
              Free
            </span>
          </div>
        ))}
      </div>

      {/* ── INLINE UPLOAD — appears when a tool is selected ── */}
      {activeTool && (
        <div className="fade-up" style={{ background: "white", borderRadius: 20, border: `1.5px solid ${PALETTE[activeTool.color].border}`, padding: "28px 28px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <ToolIcon color={activeTool.color} icon={activeTool.icon} size={44} />
            <div>
              <p style={{ fontSize: 12, color: "#9B8FCC", marginBottom: 2 }}>Selected tool</p>
              <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: "#1A1835" }}>
                {activeTool.label}
              </h2>
            </div>
          </div>

          {/* Upload zone for this specific tool */}
          <div
            className={`upload-zone ${dragOver ? "drag-over" : ""}`}
            style={{ maxWidth: 480 }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); setPage("editor"); }}
            onClick={() => setPage("editor")}
          >
            <p style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 600, color: "#534AB7", marginBottom: 4 }}>
              {dragOver ? "Drop it!" : `Drop PDF here to ${activeTool.label.toLowerCase()}`}
            </p>
            <span style={{ fontSize: 13, color: "#9B8FCC" }}>or click to browse · max 20MB</span>
          </div>

          {/* Special options panel per tool — add tool-specific UI here */}
          {/* Example: Split PDF needs a page range input */}
          {activeTool.id === "split" && (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 13, color: "#6B6B8A", marginBottom: 8 }}>Page range to extract:</p>
              <input
                type="text"
                placeholder="e.g. 1-3, 5, 7-9"
                style={{ border: "0.5px solid #E0DEFA", borderRadius: 8, padding: "8px 14px", fontSize: 14, width: "100%", maxWidth: 240, outline: "none" }}
              />
              {/* TODO Day 2: send this page range to /api/split endpoint */}
            </div>
          )}

          {activeTool.id === "rotate" && (
            <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <p style={{ fontSize: 13, color: "#6B6B8A", width: "100%", marginBottom: 4 }}>Rotation angle:</p>
              {["90°", "180°", "270°"].map(deg => (
                <button
                  key={deg}
                  className="toolbar-pill"
                  style={{ fontSize: 14 }}
                  onClick={() => {/* TODO Day 3: send degrees to /api/rotate */}}
                >
                  {deg}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/*
        ── FUTURE: Ad slot ──
        PRD Chapter 12: Place an ad banner here once AdSense is approved.
        <div id="adsense-tools-page-bottom" style={{ marginTop: 48 }}>
          Google AdSense banner goes here
        </div>
      */}
    </div>
  );
}

// ============================================================
// 8. EDITOR PAGE
// The most important page — inline PDF text editing.
//
// PRD Chapter 7 — The Overlay Technique:
//   Step 1: Render PDF page as canvas with PDF.js
//   Step 2: User clicks text → input box appears at position
//   Step 3: White rectangle overlaid to hide old text
//   Step 4: PDFBox writes new text at same position
//   Step 5: Save → return new PDF
//
// Current state: UI shell with mock PDF preview.
// Day 4 TODO: Wire in real PDF.js rendering + Fabric.js canvas.
// ============================================================

function EditorPage({ loggedIn, usedCount, setPage }) {
  // Which sidebar tool is active
  const [activeTool,    setActiveTool]    = useState("edit-text");
  // Which toolbar pill is active
  const [activeToolbar, setActiveToolbar] = useState("Edit text");
  // Whether a file has been uploaded (false = show upload screen)
  const [hasFile,       setHasFile]       = useState(false);
  // Current page number being viewed/edited
  const [currentPage,   setCurrentPage]   = useState(1);
  // Total pages in the uploaded PDF (hardcoded for now — PDF.js will set this)
  const [totalPages]                      = useState(3);
  // Is the file being processed (loading spinner)
  const [processing,    setProcessing]    = useState(false);
  // Drag state for upload zone
  const [dragOver,      setDragOver]      = useState(false);

  // ── SIMULATED SAVE ──
  // TODO Day 4: Replace with real Axios POST to /api/edit/save
  // The real implementation will:
  //   1. Collect all edit operations (text boxes, deletions)
  //   2. POST to backend as JSON + base64 PDF
  //   3. Backend returns processed PDF bytes
  //   4. Trigger file download in browser
  const handleSave = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      alert("✅ PDF saved! (Connect backend on Day 4 to download for real)");
    }, 1500);
  };

  // ── PRE-UPLOAD SCREEN ──
  // Show this before any file is uploaded.
  if (!hasFile) {
    return (
      <div style={{ position: "relative", zIndex: 1, padding: "64px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h1 className="fade-up" style={{ fontFamily: FONT_DISPLAY, fontSize: 36, fontWeight: 700, color: "#1A1835", marginBottom: 10, textAlign: "center" }}>
          PDF Editor
        </h1>
        <p className="fade-up d1" style={{ fontSize: 16, color: "#6B6B8A", marginBottom: 10, textAlign: "center" }}>
          Click on any text in your PDF to edit it — directly in your browser
        </p>

        {/* Usage limit note for non-logged-in users */}
        {!loggedIn && (
          <p className="fade-up d2" style={{ fontSize: 13, color: "#9B8FCC", marginBottom: 32, textAlign: "center" }}>
            Sign in with Google for 5 free edits per day
          </p>
        )}

        {/* Upload drop zone */}
        <div
          className={`fade-up d3 upload-zone ${dragOver ? "drag-over" : ""}`}
          style={{ maxWidth: 520 }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); setHasFile(true); }}
          onClick={() => setHasFile(true)}
          // TODO Day 4: Open a real <input type="file" accept=".pdf"> on click
        >
          <div style={{
            width: 58, height: 58, background: "#7F77DD", borderRadius: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 18px",
            animation: "floatY 3s ease-in-out infinite",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6"/>
              <path d="M12 12v6"/>
              <path d="M9 15l3-3 3 3"/>
            </svg>
          </div>
          <p style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, color: "#534AB7", marginBottom: 6 }}>
            {dragOver ? "Drop it! 🎉" : "Drop your PDF here"}
          </p>
          <span style={{ fontSize: 14, color: "#9B8FCC" }}>
            or click to browse · PDF files up to 20MB
          </span>
        </div>

        <p style={{ marginTop: 16, fontSize: 12, color: "#B0A8D0" }}>
          🔒 Files are never stored — processed in memory only
        </p>
      </div>
    );
  }

  // ── EDITOR SHELL — shown after file is uploaded ──
  return (
    <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "calc(100vh - 60px)" }}>

      {/* ── TOP TOOLBAR ──
          File name + edit mode pills + save button.
          On mobile: pills scroll horizontally.
      */}
      <div style={{
        background: "white",
        borderBottom: "0.5px solid #E0DEFA",
        padding: "10px 16px",
        display: "flex", alignItems: "center",
        gap: 8, flexWrap: "nowrap",
        overflowX: "auto",
      }}>
        {/* File name */}
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600, color: "#1A1835", marginRight: 6, flexShrink: 0 }}>
          document.pdf
        </div>
        <div style={{ width: "0.5px", height: 20, background: "#E0DEFA", flexShrink: 0 }} className="hide-mobile" />

        {/* Edit mode pills — scroll on mobile */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", flex: 1 }}>
          {["Edit text", "Add text", "Highlight", "Delete"].map(tb => (
            <button
              key={tb}
              className={`toolbar-pill ${activeToolbar === tb ? "active" : ""}`}
              onClick={() => setActiveToolbar(tb)}
            >
              {tb}
            </button>
          ))}
          {/* FUTURE: Add more toolbar modes here — Draw, Sign, etc. */}
        </div>

        {/* Save button — right side */}
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={processing}
          style={{ flexShrink: 0 }}
        >
          {processing ? (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="spinner" /> Saving...
            </span>
          ) : "Save & Download"}
        </button>
      </div>

      {/* ── EDITOR BODY — sidebar + canvas ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── LEFT SIDEBAR — tool picker + page thumbnails ──
            Hidden on mobile (too narrow). On mobile, toolbar pills replace it.
        */}
        <div
          className="editor-sidebar"
          style={{
            width: 176, background: "white",
            borderRight: "0.5px solid #E0DEFA",
            padding: "14px 10px",
            display: "flex", flexDirection: "column", gap: 2,
            overflowY: "auto", flexShrink: 0,
          }}
        >
          <SectionLabel style={{ paddingLeft: 8 }}>Edit tools</SectionLabel>

          {/* Editor tool buttons */}
          {EDITOR_TOOLS.map(et => (
            <button
              key={et.id}
              className={`sidebar-btn ${activeTool === et.id ? "active" : ""}`}
              onClick={() => setActiveTool(et.id)}
              title={et.tip}  // shows tooltip on hover (desktop)
            >
              {/* Small colored icon */}
              <span style={{
                width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                background: activeTool === et.id ? PALETTE[et.color].bg : "#F4F2FF",
                color: activeTool === et.id ? PALETTE[et.color].text : "#9B8FCC",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700,
              }}>
                {et.icon}
              </span>
              {et.label}
            </button>
          ))}

          {/*
            ── FUTURE TOOLS ──
            Uncomment new EDITOR_TOOLS entries above to add
            new buttons here automatically. No code changes needed.
          */}

          <Divider margin="10px 0" />
          <SectionLabel style={{ paddingLeft: 8 }}>Pages</SectionLabel>

          {/* Page thumbnail list — click to jump to page */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              className={`sidebar-btn ${currentPage === p ? "active" : ""}`}
              onClick={() => setCurrentPage(p)}
              aria-label={`Go to page ${p}`}
            >
              <span style={{
                width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                background: currentPage === p ? "#EEEDFE" : "#F4F2FF",
                color: currentPage === p ? "#534AB7" : "#9B8FCC",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 600,
              }}>
                {p}
              </span>
              Page {p}
            </button>
          ))}

          {/* FUTURE: Page thumbnail images from PDF.js will go here on Day 4 */}
        </div>

        {/* ── PDF CANVAS AREA ──
            This grey area will hold the PDF.js rendered canvas.
            Currently shows a mock PDF visual.

            Day 4 plan:
              1. Render PDF page → <canvas id="pdf-canvas"> using PDF.js
              2. Overlay a Fabric.js canvas on top of it
              3. On click → capture x,y coordinates
              4. Show a text <input> positioned at those coordinates
              5. On confirm → call /api/edit/add-text with coords + new text
        */}
        <div style={{
          flex: 1, background: "#EAE8F7",
          display: "flex", alignItems: "flex-start",
          justifyContent: "center",
          padding: "32px 20px",
          overflowY: "auto",
        }}>
          <div>
            {/* Mock PDF page — replace with real PDF.js canvas on Day 4 */}
            <div style={{ position: "relative" }}>
              <div style={{
                width: "min(480px, 90vw)",
                background: "white",
                borderRadius: 4,
                padding: "44px 52px",
                boxShadow: "0 6px 40px rgba(83,74,183,0.14)",
              }}>
                {/* Mock PDF header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
                  <div>
                    <div style={{ height: 9, width: 180, background: "#1A1835", borderRadius: 3, marginBottom: 8 }} />
                    <div style={{ height: 5, width: 110, background: "#CDCCE0", borderRadius: 3 }} />
                  </div>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: "#EEEDFE", display: "flex", alignItems: "center", justifyContent: "center", color: "#7F77DD", fontSize: 22 }}>
                    ⊞
                  </div>
                </div>

                <Divider margin="0 0 20px 0" />

                {/* Mock text lines */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[100, 88, 96, 74].map((w, i) => (
                    <div key={i} style={{ height: 7, width: `${w}%`, background: "#CDCCE0", borderRadius: 3 }} />
                  ))}

                  {/* Blinking cursor line — simulates an active edit */}
                  <div style={{ height: 7, width: "78%", background: "#AFA9EC", borderRadius: 3, position: "relative" }}>
                    <div style={{
                      position: "absolute", right: -2, top: -5,
                      width: 2, height: 17, background: "#534AB7", borderRadius: 1,
                      animation: "blink 1s infinite",
                    }} />
                  </div>

                  {[92, 65, 82, 70, 89].map((w, i) => (
                    <div key={i} style={{ height: 7, width: `${w}%`, background: "#CDCCE0", borderRadius: 3 }} />
                  ))}
                </div>

                {/* Mock two-column footer area in the PDF */}
                <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div style={{ height: 56, background: "#F4F2FF", borderRadius: 8, border: "0.5px solid #E0DEFA" }} />
                  <div style={{ height: 56, background: "#F4F2FF", borderRadius: 8, border: "0.5px solid #E0DEFA" }} />
                </div>
              </div>

              {/* Tooltip bubble — points to cursor on the mock PDF */}
              <div
                className="hide-mobile"
                style={{
                  position: "absolute", top: 140, right: -16, transform: "translateX(100%)",
                  background: "#534AB7", color: "white",
                  fontSize: 12, fontWeight: 500,
                  padding: "7px 14px", borderRadius: 10,
                  whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(83,74,183,0.25)",
                }}
              >
                Click any text to edit
                {/* Arrow pointing left */}
                <div style={{ position: "absolute", left: -6, top: "50%", transform: "translateY(-50%)", width: 0, height: 0, borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderRight: "6px solid #534AB7" }} />
              </div>
            </div>

            {/* Page indicator dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 18 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <div
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  style={{
                    width: currentPage === p ? 22 : 8, height: 8,
                    borderRadius: 4, cursor: "pointer",
                    background: currentPage === p ? "#7F77DD" : "#AFA9EC",
                    transition: "all 0.2s ease",
                  }}
                  aria-label={`Page ${p}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM STATUS BAR ── */}
      <div style={{
        background: "white",
        borderTop: "0.5px solid #E0DEFA",
        padding: "8px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 8,
      }}>
        <span style={{ fontSize: 12, color: "#9B8FCC" }}>
          Editing page {currentPage} of {totalPages}
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <UsagePill used={usedCount} />
          {!loggedIn && (
            <span
              style={{ fontSize: 12, color: "#7F77DD", cursor: "pointer", textDecoration: "underline" }}
              onClick={() => setPage("upgrade")}
            >
              Sign in for more
            </span>
          )}
        </div>
      </div>

      {/*
        ── AdSense slot ──
        PRD Chapter 12: Top banner ad above PDF viewer.
        Place this between the toolbar and editor body
        once AdSense is approved.
        <div id="adsense-editor-banner" style={{ ...adStyle }}>
          Ad unit code here
        </div>
      */}
    </div>
  );
}

// ============================================================
// 9. UPGRADE PAGE
// Shown when user hits the 5-operation daily limit (HTTP 429).
// PRD: "Upgrade page — shown when limit exceeded (for future monetisation)"
//
// For now: explains the limit and encourages sign-in.
// Later: add a real pricing table here with Stripe integration.
// ============================================================

function UpgradePage({ loggedIn, setLoggedIn }) {
  return (
    <div style={{ position: "relative", zIndex: 1, padding: "72px 24px", maxWidth: 640, margin: "0 auto", textAlign: "center" }}>

      {/* Icon */}
      <div className="fade-up" style={{ fontSize: 52, marginBottom: 16 }}>⚡</div>

      <h1 className="fade-up d1" style={{ fontFamily: FONT_DISPLAY, fontSize: 34, fontWeight: 700, color: "#1A1835", marginBottom: 12 }}>
        You've used all 5 free operations today
      </h1>
      <p className="fade-up d2" style={{ fontSize: 16, color: "#6B6B8A", lineHeight: 1.7, marginBottom: 40 }}>
        Your free limit resets at midnight. Come back tomorrow for 5 more free operations.
        Or sign in with Google to track your usage and get the most out of PDFFlow.
      </p>

      {/* Feature comparison — free vs future pro */}
      <div className="fade-up d3" style={{ background: "white", borderRadius: 20, border: "0.5px solid #E0DEFA", padding: "28px 24px", marginBottom: 32, textAlign: "left" }}>
        {[
          { label: "Merge, split, compress PDFs",       free: true  },
          { label: "PDF to JPG / Word conversion",      free: true  },
          { label: "5 operations per day",              free: true  },
          { label: "Inline PDF text editing",           free: true  },
          { label: "Unlimited operations",              free: false },
          { label: "Priority processing",               free: false },
          { label: "No daily limits",                   free: false },
        ].map(f => (
          <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "0.5px solid #F4F2FF" }}>
            <span style={{ fontSize: 14, color: f.free ? "#1D9E75" : "#AFA9EC" }}>
              {f.free ? "✓" : "○"}
            </span>
            <span style={{ fontSize: 14, color: f.free ? "#1A1835" : "#9B8FCC" }}>{f.label}</span>
            {!f.free && (
              <span style={{ marginLeft: "auto", fontSize: 11, background: "#EEEDFE", color: "#534AB7", padding: "2px 8px", borderRadius: 10 }}>
                Coming soon
              </span>
            )}
          </div>
        ))}
      </div>

      {!loggedIn ? (
        <button className="btn-primary fade-up d4" style={{ width: "100%" }} onClick={() => setLoggedIn(true)}>
          Sign in with Google to get started
        </button>
      ) : (
        <p className="fade-up d4" style={{ fontSize: 14, color: "#6B6B8A" }}>
          You're signed in. Your 5 operations will reset at midnight tonight.
        </p>
      )}

      {/* FUTURE: Add Stripe pricing table / payment link here */}
    </div>
  );
}

// ============================================================
// 10. ABOUT PAGE
// Required for Google AdSense approval.
// PRD Chapter 12: "Real content — not just a tool with no text"
// Keep this genuine and updated.
// ============================================================

function AboutPage() {
  return (
    <div style={{ position: "relative", zIndex: 1, padding: "56px 24px", maxWidth: 720, margin: "0 auto" }}>
      <SectionLabel>About</SectionLabel>
      <h1 className="fade-up" style={{ fontFamily: FONT_DISPLAY, fontSize: 34, fontWeight: 700, color: "#1A1835", marginBottom: 24 }}>
        We built the PDF editor we always wanted
      </h1>

      {[
        { heading: "What is PDFFlow?", body: "PDFFlow is a free, browser-based PDF editor. You can edit text directly inside a PDF, merge multiple PDFs, split pages, compress file size, and convert to Word or JPG — all without creating an account or installing anything." },
        { heading: "Why we built it",  body: "Most free PDF tools are cluttered with ads, impose tiny file limits, or charge for the one feature you actually need — like editing text. We built PDFFlow to be genuinely free, clean, and private. Your files are never stored on our servers." },
        { heading: "Who built it",     body: "PDFFlow was built by a small team learning full-stack development. It uses Spring Boot on the backend for PDF processing, and React on the frontend for the UI. The inline editing is powered by PDF.js and Apache PDFBox." },
        { heading: "Privacy first",    body: "We do not store your uploaded files. PDFs are processed in memory and immediately discarded after the operation completes. We only store your Gmail address and a daily usage counter if you choose to sign in." },
      ].map(s => (
        <div key={s.heading} style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: "#1A1835", marginBottom: 10 }}>
            {s.heading}
          </h2>
          <p style={{ fontSize: 15, color: "#6B6B8A", lineHeight: 1.8 }}>{s.body}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 11. PRIVACY PAGE
// Required for Google AdSense approval.
// PRD Chapter 12: "Privacy Policy page on your site"
// ============================================================

function PrivacyPage() {
  return (
    <div style={{ position: "relative", zIndex: 1, padding: "56px 24px", maxWidth: 720, margin: "0 auto" }}>
      <SectionLabel>Legal</SectionLabel>
      <h1 className="fade-up" style={{ fontFamily: FONT_DISPLAY, fontSize: 34, fontWeight: 700, color: "#1A1835", marginBottom: 8 }}>
        Privacy Policy
      </h1>
      <p style={{ fontSize: 13, color: "#9B8FCC", marginBottom: 32 }}>Last updated: April 2026</p>

      {[
        { title: "Information we collect",       text: "If you sign in with Google, we collect your Gmail address and store a daily usage count in our database (Firebase Firestore). We do not collect passwords. We do not collect personal details beyond your email address." },
        { title: "Files you upload",             text: "PDF files uploaded to PDFFlow are processed in server memory only. Files are not written to disk, not stored in a database, and not retained after your download completes. We have no access to the content of your files." },
        { title: "Cookies and analytics",        text: "We use basic analytics to understand traffic (e.g. page views, country). We may use Google AdSense to show ads, which uses cookies. You can opt out of personalised ads via Google's ad settings." },
        { title: "Third-party services",         text: "We use Firebase (Google) for authentication and usage tracking. We use Railway and Vercel for hosting. These services have their own privacy policies." },
        { title: "Your rights",                  text: "You can request deletion of your account data (email + usage count) at any time by emailing us. We will delete it within 7 days." },
        { title: "Contact",                      text: "For privacy questions, contact us at: privacy@pdfflow.app (placeholder — replace with your real email before launch)." },
      ].map(s => (
        <div key={s.title} style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: "#1A1835", marginBottom: 8 }}>
            {s.title}
          </h2>
          <p style={{ fontSize: 14, color: "#6B6B8A", lineHeight: 1.8 }}>{s.text}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 12. TERMS PAGE
// Required for Google AdSense approval.
// PRD Chapter 12: "Terms of Service page on your site"
// ============================================================

function TermsPage() {
  return (
    <div style={{ position: "relative", zIndex: 1, padding: "56px 24px", maxWidth: 720, margin: "0 auto" }}>
      <SectionLabel>Legal</SectionLabel>
      <h1 className="fade-up" style={{ fontFamily: FONT_DISPLAY, fontSize: 34, fontWeight: 700, color: "#1A1835", marginBottom: 8 }}>
        Terms of Service
      </h1>
      <p style={{ fontSize: 13, color: "#9B8FCC", marginBottom: 32 }}>Last updated: April 2026</p>

      {[
        { title: "Usage",         text: "PDFFlow is provided free of charge for personal and commercial use. You may not use the service to process illegal content, infringe copyright, or circumvent usage limits through automated means." },
        { title: "Limits",        text: "Free accounts are limited to 5 PDF operations per day. This limit exists to prevent abuse and keep the service free for everyone. Limits may change in the future with reasonable notice." },
        { title: "No warranty",   text: "PDFFlow is provided 'as is'. We make no guarantees about uptime, accuracy, or fitness for a particular purpose. Always keep backups of important documents." },
        { title: "Your content",  text: "You retain full ownership of all files you upload. We do not claim any rights to your content. Files are deleted immediately after processing." },
        { title: "Changes",       text: "We may update these terms at any time. Continued use of the service after changes constitutes acceptance. We will post updates on this page." },
      ].map(s => (
        <div key={s.title} style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: "#1A1835", marginBottom: 8 }}>
            {s.title}
          </h2>
          <p style={{ fontSize: 14, color: "#6B6B8A", lineHeight: 1.8 }}>{s.text}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 13. FOOTER
// Site-wide footer — links to legal pages, nav, attribution.
// PRD Chapter 12: Required for AdSense approval.
// ============================================================

function Footer({ setPage }) {
  return (
    <footer style={{
      background: "white",
      borderTop: "0.5px solid #E0DEFA",
      padding: "40px 24px 28px",
      marginTop: "auto",
    }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 32, marginBottom: 32 }}>

          {/* Brand column */}
          <div style={{ minWidth: 180 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: "#7F77DD", marginBottom: 10 }}>
              PDF<span style={{ color: "#1D9E75" }}>Flow</span>
            </div>
            <p style={{ fontSize: 13, color: "#9B8FCC", lineHeight: 1.7 }}>
              Free PDF tools for everyone.<br />No signup. No limits on basic tools.
            </p>
          </div>

          {/* Tools column */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 500, color: "#9B8FCC", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Tools</p>
            {["Edit PDF", "Merge PDFs", "Compress", "PDF to Word"].map(l => (
              <p key={l} onClick={() => setPage("tools")} style={{ fontSize: 14, color: "#6B6B8A", marginBottom: 8, cursor: "pointer" }}>
                {l}
              </p>
            ))}
          </div>

          {/* Company column */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 500, color: "#9B8FCC", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Company</p>
            {[
              { label: "About",   page: "about"   },
              { label: "Privacy", page: "privacy" },
              { label: "Terms",   page: "terms"   },
            ].map(l => (
              <p key={l.label} onClick={() => setPage(l.page)} style={{ fontSize: 14, color: "#6B6B8A", marginBottom: 8, cursor: "pointer" }}>
                {l.label}
              </p>
            ))}
          </div>
        </div>

        <Divider />
        <p style={{ fontSize: 12, color: "#B0A8D0", marginTop: 16, textAlign: "center" }}>
          © 2026 PDFFlow · Built with ♥ using React + Spring Boot
        </p>
      </div>
    </footer>
  );
}

// ============================================================
// 14. APP ROOT
// Wires everything together.
// Single `page` state = the entire "router" — no page refresh.
//
// State lifted here so Navbar and pages can share:
//   - page      : which page is visible
//   - loggedIn  : Firebase auth state (simulated for now)
//   - usedCount : operations used today (from Firebase Firestore)
//
// TODO Day 5: Replace loggedIn/usedCount with real Firebase state:
//   import { onAuthStateChanged } from "firebase/auth";
//   useEffect(() => { onAuthStateChanged(auth, user => setLoggedIn(!!user)); }, []);
// ============================================================

export default function App() {
  // ── App-level state ──
  const [page,      setPage]      = useState("home");    // current page
  const [loggedIn,  setLoggedIn]  = useState(false);     // Firebase auth state
  const [usedCount, setUsedCount] = useState(1);         // ops used today (0-5)

  // Pages that don't need the footer (full-screen layouts)
  const FULLSCREEN_PAGES = ["editor"];

  // Scroll to top when page changes (SPA behavior)
  const handleSetPage = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Inject global CSS */}
      <style>{GLOBAL_STYLES}</style>

      {/* Background decoration — fixed, behind everything */}
      <BgBlobs />

      {/* App shell */}
      <div style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* Sticky navbar — always visible */}
        <Navbar
          page={page}
          setPage={handleSetPage}
          loggedIn={loggedIn}
          setLoggedIn={setLoggedIn}
          usedCount={usedCount}
        />

        {/* Main content — switches with no page refresh */}
        <main style={{ flex: 1 }}>
          {page === "home"    && <HomePage    setPage={handleSetPage} loggedIn={loggedIn} />}
          {page === "tools"   && <ToolsPage   setPage={handleSetPage} />}
          {page === "editor"  && <EditorPage  setPage={handleSetPage} loggedIn={loggedIn} usedCount={usedCount} />}
          {page === "upgrade" && <UpgradePage setPage={handleSetPage} loggedIn={loggedIn} setLoggedIn={setLoggedIn} />}
          {page === "about"   && <AboutPage />}
          {page === "privacy" && <PrivacyPage />}
          {page === "terms"   && <TermsPage />}

          {/*
            ── FUTURE PAGES ──
            Add new pages here. Create the component above, then add a line:
            {page === "your-page" && <YourPage setPage={handleSetPage} />}
          */}
        </main>

        {/* Footer — hidden on full-screen editor */}
        {!FULLSCREEN_PAGES.includes(page) && <Footer setPage={handleSetPage} />}

      </div>
    </>
  );
}
