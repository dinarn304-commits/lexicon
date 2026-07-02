export default function ThemeStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=DM+Mono:wght@400;500&family=Amiri:wght@400;700&display=swap');

      /* Vollkorn covers Cyrillic range under the Fraunces family name so
         Latin text uses Fraunces and Cyrillic text uses Vollkorn's
         better-matched stroke weight, with no per-element font choices. */
      @font-face {
        font-family: 'Fraunces';
        src: url('https://fonts.gstatic.com/s/vollkorn/v30/0ybuGDoxxrvAnPhYGxksckM2WMCpRjDj-DJGWmmZ.ttf') format('truetype');
        font-weight: 300 500;
        font-style: normal;
        font-display: swap;
        unicode-range: U+0400-04FF, U+0500-052F;
      }
      @font-face {
        font-family: 'Fraunces';
        src: url('https://fonts.gstatic.com/s/vollkorn/v30/0ybgGDoxxrvAnPhYGzMlQLzuMasz6Df2MHGuGQ.ttf') format('truetype');
        font-weight: 600;
        font-style: normal;
        font-display: swap;
        unicode-range: U+0400-04FF, U+0500-052F;
      }
      @font-face {
        font-family: 'Fraunces';
        src: url('https://fonts.gstatic.com/s/vollkorn/v30/0ybgGDoxxrvAnPhYGzMlQLzuMasz6Df27nauGQ.ttf') format('truetype');
        font-weight: 700 800;
        font-style: normal;
        font-display: swap;
        unicode-range: U+0400-04FF, U+0500-052F;
      }

      :root {
        --paper: #f1ead9;
        --paper-2: #fbf6ea;
        --ink: #2a1f15;
        --ink-soft: #6b5a47;
        --ink-faint: #a89880;
        --rule: #d8c6a8;
        --rule-soft: #e7d9bd;
        --terracotta: #a44726;
        --terracotta-soft: #ecd2c1;
        --moss: #5b6e3d;
        --gold: #a37510;
        --shadow: 0 1px 0 rgba(42,31,21,0.06), 0 12px 28px -16px rgba(42,31,21,0.18);
      }

      .srs-root {
        background: var(--paper);
        color: var(--ink);
        font-family: 'Fraunces', Georgia, serif;
        font-feature-settings: 'ss01', 'ss02';
        min-height: 100vh;
        position: relative;
      }

      .srs-root::before {
        content: '';
        position: fixed;
        inset: 0;
        pointer-events: none;
        background-image:
          radial-gradient(rgba(42,31,21,0.04) 1px, transparent 1px),
          radial-gradient(rgba(42,31,21,0.025) 1px, transparent 1px);
        background-size: 3px 3px, 7px 7px;
        background-position: 0 0, 1px 2px;
        opacity: 0.5;
        z-index: 0;
      }

      .srs-content { position: relative; z-index: 1; display: flex; flex-direction: column; min-height: 100vh; }
      .srs-main { flex: 1; }

      .display { font-family: 'Fraunces', Georgia, serif; font-weight: 600; letter-spacing: -0.02em; }
      .mono { font-family: 'DM Mono', ui-monospace, monospace; }

      .ornament {
        font-family: 'Fraunces', serif;
        color: var(--terracotta);
        letter-spacing: 0.4em;
      }

      .paper-card {
        background: var(--paper-2);
        border: 1px solid var(--rule);
        border-radius: 4px;
        box-shadow: var(--shadow);
        position: relative;
      }

      .paper-card::after {
        content: '';
        position: absolute;
        inset: 6px;
        border: 1px solid var(--rule-soft);
        border-radius: 2px;
        pointer-events: none;
      }

      .btn {
        font-family: 'Fraunces', serif;
        font-weight: 500;
        letter-spacing: 0.01em;
        transition: all 0.18s ease;
        cursor: pointer;
        border: 1px solid transparent;
      }

      .btn-primary {
        background: var(--ink);
        color: var(--paper-2);
        border-color: var(--ink);
      }
      .btn-primary:hover { background: var(--terracotta); border-color: var(--terracotta); }

      .btn-ghost {
        background: transparent;
        color: var(--ink);
        border-color: var(--rule);
      }
      .btn-ghost:hover { background: var(--paper-2); border-color: var(--ink-soft); }

      .btn-quiet {
        background: transparent;
        color: var(--ink-soft);
        border-color: transparent;
      }
      .btn-quiet:hover { color: var(--ink); }

      .input {
        font-family: 'Fraunces', serif;
        background: var(--paper-2);
        border: 1px solid var(--rule);
        color: var(--ink);
        border-radius: 3px;
        padding: 10px 12px;
        outline: none;
        transition: border-color 0.18s ease;
        width: 100%;
      }
      .input:focus { border-color: var(--terracotta); }
      .input::placeholder { color: var(--ink-faint); font-style: italic; }

      .deck-tile {
        background: var(--paper-2);
        border: 1px solid var(--rule);
        border-radius: 4px;
        padding: 24px 26px;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
      }
      .deck-tile:hover {
        border-color: var(--ink-soft);
        transform: translateY(-1px);
        box-shadow: var(--shadow);
      }
      .deck-tile::before {
        content: '';
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 3px;
        background: var(--terracotta);
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      .deck-tile:hover::before { opacity: 1; }

      .due-pill {
        background: var(--terracotta);
        color: var(--paper-2);
        font-family: 'DM Mono', monospace;
        font-size: 11px;
        padding: 3px 8px;
        border-radius: 999px;
        letter-spacing: 0.04em;
      }
      .due-pill.muted {
        background: var(--rule-soft);
        color: var(--ink-soft);
      }

      .flashcard {
        background: var(--paper-2);
        border: 1px solid var(--rule);
        border-radius: 6px;
        box-shadow: var(--shadow);
        position: relative;
        min-height: 320px;
        cursor: pointer;
        transition: transform 0.2s ease;
      }
      .flashcard:hover { transform: translateY(-2px); }
      .flashcard::before {
        content: '';
        position: absolute;
        top: 18px; bottom: 18px;
        left: 56px;
        width: 1px;
        background: var(--terracotta-soft);
      }
      .flashcard::after {
        content: '';
        position: absolute;
        inset: 12px;
        border: 1px solid var(--rule-soft);
        border-radius: 3px;
        pointer-events: none;
      }

      .card-speaker-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        color: var(--terracotta);
        padding: 0.375rem;
        display: inline-flex;
        align-items: center;
        line-height: 1;
        transition: color 0.12s;
      }
      .card-speaker-btn:hover { color: var(--ink); }
      .review-card-speaker {
        position: absolute;
        top: 13px;
        left: 16px;
        color: var(--terracotta-soft);
      }
      .review-card-speaker:hover { color: var(--terracotta); }
      .list-card-speaker { color: var(--ink-soft); }
      .list-card-speaker:hover { color: var(--ink); }

      .rate-btn {
        font-family: 'Fraunces', serif;
        background: var(--paper-2);
        border: 1px solid var(--rule);
        border-radius: 3px;
        padding: 14px 8px;
        cursor: pointer;
        transition: all 0.15s ease;
        text-align: center;
      }
      .rate-btn:hover {
        background: var(--ink);
        color: var(--paper-2);
        border-color: var(--ink);
        transform: translateY(-1px);
      }
      .rate-btn .label { font-size: 14px; font-weight: 500; }
      .rate-btn .interval { font-family: 'DM Mono', monospace; font-size: 10px; opacity: 0.6; margin-top: 2px; }

      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .fade-up { animation: fadeUp 0.4s ease both; }

      .divider-flourish {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        color: var(--terracotta);
      }
      .divider-flourish hr {
        flex: 1;
        border: none;
        border-top: 1px solid var(--rule);
      }

      .image-frame {
        display: inline-block;
        padding: 8px;
        background: var(--paper-2);
        border: 1px solid var(--rule);
        box-shadow: var(--shadow);
      }
      .image-frame img {
        display: block;
        max-width: 100%;
        max-height: 240px;
        filter: sepia(0.08) saturate(0.95);
      }
      .image-frame.review img {
        max-height: 200px;
      }

      .image-upload-label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background: var(--paper-2);
        border: 1px dashed var(--rule);
        border-radius: 3px;
        color: var(--ink-soft);
        font-family: 'Fraunces', serif;
        cursor: pointer;
        transition: all 0.18s ease;
      }
      .image-upload-label:hover {
        border-color: var(--terracotta);
        color: var(--terracotta);
        background: var(--paper);
      }
      .image-upload-label input[type="file"] { display: none; }

      .image-card-thumb {
        width: 32px;
        height: 32px;
        object-fit: cover;
        border: 1px solid var(--rule);
        border-radius: 2px;
        flex-shrink: 0;
        filter: sepia(0.08) saturate(0.95);
      }

      .mode-opt {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 13px;
        letter-spacing: 0.05em;
        color: var(--ink-faint);
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px 8px;
        line-height: 1;
        transition: color 0.18s ease;
        position: relative;
        z-index: 1;
      }
      .mode-opt:hover:not(:disabled) { color: var(--ink-soft); }
      .mode-opt.active {
        color: var(--ink);
        text-decoration: underline;
        text-decoration-color: var(--terracotta);
        text-underline-offset: 3px;
        text-decoration-thickness: 1px;
      }
      .mode-opt:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }

      /* Mode switcher band */
      .mode-switcher-band {
        display: flex;
        align-items: center;
        padding: 20px 24px 14px;
        gap: 16px;
      }
      .mode-hairline-l {
        flex: 1;
        height: 1px;
        background: linear-gradient(to right, transparent, var(--rule) 50%);
      }
      .mode-hairline-r {
        flex: 1;
        height: 1px;
        background: linear-gradient(to left, transparent, var(--rule) 50%);
      }
      .mode-switcher-track {
        position: relative;
        display: flex;
        align-items: center;
      }
      .mode-switcher-highlight {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        height: 26px;
        border-radius: 4px;
        background: rgba(164, 71, 38, 0.09);
        transition: left 200ms ease, width 200ms ease;
        pointer-events: none;
      }
      .mode-dot {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 13px;
        color: var(--terracotta);
        margin: 0 4px;
        user-select: none;
        position: relative;
        z-index: 1;
      }

      .speaking-timer {
        font-family: 'Fraunces', Georgia, serif;
        font-weight: 600;
        font-size: 52px;
        letter-spacing: -0.02em;
        color: var(--ink);
        line-height: 1;
        font-variant-numeric: tabular-nums;
        display: inline-block;
      }

      @keyframes speaking-pulse {
        0%   { opacity: 1; }
        4%   { opacity: 0.85; }
        8%   { opacity: 1; }
        100% { opacity: 1; }
      }
      .speaking-timer.pulsing {
        animation: speaking-pulse 1s linear infinite;
      }

      @keyframes shuffleIn {
        from { opacity: 0.4; transform: translateY(8px); }
        to   { opacity: 1;   transform: translateY(0); }
      }
      .shuffle-in {
        animation: shuffleIn 0.12s ease both;
      }

      .logo-unit {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 13px;
        margin-bottom: 28px;
      }
      .logo-wordmark {
        font-family: 'Fraunces', Georgia, serif;
        font-weight: 500;
        font-size: 30px;
        letter-spacing: 0.16em;
        color: var(--terracotta);
        text-transform: uppercase;
      }
      .logo-link {
        text-decoration: none;
        cursor: pointer;
        transition: opacity 0.2s ease;
      }
      .logo-link:hover { opacity: 0.82; }

      .page-footer {
        border-top: 1px solid var(--rule);
        padding: 28px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        max-width: 680px;
        margin: 0 auto;
        width: 100%;
        box-sizing: border-box;
      }
      .page-footer-btn {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 14px;
        color: var(--terracotta);
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        transition: color 0.18s ease;
      }
      .page-footer-btn:hover { color: var(--ink); }

      .feedback-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
      }
      .feedback-modal {
        background: var(--paper);
        border: 1px solid var(--rule);
        border-radius: 6px;
        box-shadow: 0 8px 40px -8px rgba(42, 31, 21, 0.35), 0 2px 8px -4px rgba(42, 31, 21, 0.15);
        padding: 36px 40px;
        max-width: 420px;
        width: 100%;
        position: relative;
        box-sizing: border-box;
      }
      .feedback-modal-close {
        position: absolute;
        top: 16px;
        right: 16px;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--ink-soft);
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 18px;
        padding: 4px 8px;
        line-height: 1;
        transition: color 0.18s ease;
      }
      .feedback-modal-close:hover { color: var(--ink); }
      .feedback-modal-heading {
        font-family: 'Fraunces', Georgia, serif;
        font-weight: 500;
        font-size: 26px;
        letter-spacing: -0.01em;
        color: var(--ink);
        margin-bottom: 12px;
        line-height: 1.2;
      }
      .feedback-modal-body {
        font-size: 16px;
        line-height: 1.65;
        color: var(--ink-soft);
        margin-bottom: 28px;
        font-style: italic;
      }
      .feedback-modal-email-row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .feedback-modal-email {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 15px;
        color: var(--ink);
      }
      .feedback-modal-copy-btn {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 13px;
        color: var(--paper-2);
        background: var(--terracotta);
        border: none;
        border-radius: 3px;
        padding: 6px 12px;
        cursor: pointer;
        transition: background 0.18s ease;
      }
      .feedback-modal-copy-btn:hover { background: var(--ink); }

      .support-modal-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 4px;
      }
      .support-modal-link {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 14px;
        color: var(--terracotta);
        background: transparent;
        border: 1px solid var(--terracotta);
        border-radius: 4px;
        padding: 10px 16px;
        text-align: center;
        text-decoration: none;
        transition: color 0.18s ease, border-color 0.18s ease;
      }
      .support-modal-link:hover {
        color: var(--ink);
        border-color: var(--ink);
      }

      .import-text-modal {
        background: var(--paper);
        border: 1px solid var(--rule);
        border-radius: 6px;
        box-shadow: 0 8px 40px -8px rgba(42, 31, 21, 0.35), 0 2px 8px -4px rgba(42, 31, 21, 0.15);
        padding: 36px 40px 0;
        max-width: 560px;
        width: 100%;
        position: relative;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        max-height: min(640px, 90vh);
        overflow: hidden;
      }
      .import-text-modal-body {
        flex: 1;
        min-height: 0;
        padding-bottom: 24px;
      }
      .source-lang-picker {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        flex-wrap: wrap;
      }
      .source-lang-btn {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 11px;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 2px;
        color: var(--ink-soft);
        transition: color 0.12s;
        line-height: 1;
        letter-spacing: 0.03em;
        text-decoration: none;
      }
      .source-lang-btn.active {
        color: var(--ink);
        text-decoration: underline;
        text-underline-offset: 2px;
      }
      .source-lang-btn:not(.active):hover { color: var(--ink); }
      .import-text-modal-footer {
        flex-shrink: 0;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding-bottom: 36px;
      }
      .import-text-area {
        font-family: 'Fraunces', serif;
        background: var(--paper-2);
        border: 1px solid var(--rule);
        color: var(--ink);
        border-radius: 3px;
        padding: 10px 12px;
        outline: none;
        transition: border-color 0.18s ease;
        width: 100%;
        min-height: 12rem;
        resize: vertical;
        line-height: 1.7;
        box-sizing: border-box;
      }
      .import-text-area:focus { border-color: var(--terracotta); }
      .import-text-area::placeholder { color: var(--ink-faint); font-style: italic; }

      .tiptap-import-editor {
        font-family: 'Fraunces', serif;
        background: var(--paper-2);
        border: 1px solid var(--rule);
        color: var(--ink);
        border-radius: 3px;
        transition: border-color 0.18s ease;
        width: 100%;
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        line-height: 1.7;
        box-sizing: border-box;
        cursor: text;
      }
      .tiptap-import-editor:focus-within { border-color: var(--terracotta); }
      .tiptap-import-editor .ProseMirror {
        padding: 10px 12px;
        min-height: 12rem;
        outline: none;
        box-sizing: border-box;
      }
      .tiptap-import-editor .ProseMirror p {
        margin: 0;
        line-height: 1.7;
      }
      .tiptap-import-editor .ProseMirror > * + * { margin-top: 0.4em; }
      .tiptap-import-editor .ProseMirror.is-editor-empty > p:first-child::before {
        content: attr(data-placeholder);
        color: var(--ink-faint);
        font-style: italic;
        float: left;
        height: 0;
        pointer-events: none;
      }
      .tiptap-import-editor [data-node-view-wrapper] { margin: 6px 0; }
      .tiptap-import-editor [data-node-view-wrapper] img {
        max-width: 100%;
        filter: sepia(0.08) saturate(0.95);
      }

      /* Guide page */
      .guide-view {
        min-height: 100vh;
        padding: 48px 24px 80px;
      }
      .guide-body {
        max-width: 680px;
        margin: 0 auto;
      }
      .guide-back-row {
        margin-bottom: 40px;
      }
      .guide-back-btn {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 14px;
        color: var(--terracotta);
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        transition: color 0.18s ease;
        white-space: nowrap;
      }
      .guide-back-btn:hover { color: var(--ink); }
      .guide-title {
        font-family: 'Fraunces', Georgia, serif;
        font-weight: 500;
        font-size: 42px;
        letter-spacing: -0.02em;
        color: var(--ink);
        text-align: center;
        margin-bottom: 16px;
        line-height: 1.1;
      }
      .guide-intro {
        font-style: italic;
        color: var(--ink-soft);
        text-align: center;
        font-size: 17px;
        line-height: 1.7;
        margin-bottom: 44px;
      }
      .guide-section {
        margin-bottom: 56px;
      }
      .guide-section:last-of-type {
        margin-bottom: 0;
      }
      .guide-heading {
        font-family: 'Fraunces', Georgia, serif;
        font-weight: 500;
        font-size: 23px;
        letter-spacing: -0.01em;
        color: var(--ink);
        margin-bottom: 18px;
      }
      .guide-section p {
        font-size: 17px;
        line-height: 1.75;
        color: var(--ink);
        margin-bottom: 16px;
      }
      .guide-section p:last-child { margin-bottom: 0; }
      .guide-section strong { font-weight: 600; color: var(--ink); }
      .guide-shortcuts {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
      }
      .guide-shortcuts tr {
        border-bottom: 1px solid var(--rule-soft);
      }
      .guide-shortcuts tr:last-child { border-bottom: none; }
      .guide-shortcuts td {
        padding: 11px 0;
        font-size: 16px;
        line-height: 1.5;
        color: var(--ink);
        vertical-align: top;
      }
      .guide-shortcuts td:first-child {
        width: 80px;
        padding-right: 24px;
        white-space: nowrap;
      }
      .guide-shortcuts kbd {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 13px;
        background: var(--paper-2);
        border: 1px solid var(--rule);
        border-radius: 3px;
        padding: 2px 7px;
        color: var(--ink-soft);
      }
      .guide-closing {
        margin-top: 64px;
        text-align: center;
        font-style: italic;
        color: var(--terracotta);
        font-size: 16px;
        letter-spacing: 0.02em;
      }
      .guide-bottom-back {
        margin-top: 48px;
        text-align: center;
      }

      /* Text library */
      .text-library { padding-top: 8px; }
      .text-library-header {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 20px;
      }
      .text-library-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      /* Text card */
      .text-card {
        background: var(--paper-2);
        border: 1px solid var(--rule);
        border-radius: 4px;
        box-shadow: var(--shadow);
        padding: 18px 20px 14px;
        cursor: pointer;
        position: relative;
        transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        box-sizing: border-box;
      }
      .text-card:hover {
        transform: translateY(-1px);
        border-color: var(--ink-soft);
        box-shadow: 0 2px 0 rgba(42,31,21,0.07), 0 16px 32px -14px rgba(42,31,21,0.24);
      }
      .text-card-header {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 8px;
      }
      .text-card-header-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
        flex-shrink: 0;
      }
      .text-card-delete {
        background: none;
        border: none;
        color: var(--ink-faint);
        cursor: pointer;
        padding: 4px;
        line-height: 1;
        border-radius: 2px;
        transition: color 0.18s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .text-card-delete:hover { color: var(--terracotta); }
      .text-card-title-row {
        display: flex;
        align-items: baseline;
        gap: 8px;
        flex: 1;
        min-width: 0;
        flex-wrap: wrap;
      }
      .text-card-title {
        font-family: 'Fraunces', serif;
        font-weight: 500;
        font-size: 17px;
        letter-spacing: -0.01em;
        color: var(--ink);
        margin: 0;
        line-height: 1.3;
      }
      .text-card-lang-tag {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 10px;
        background: var(--terracotta-soft);
        color: var(--terracotta);
        padding: 2px 6px;
        border-radius: 999px;
        letter-spacing: 0.04em;
        white-space: nowrap;
        flex-shrink: 0;
        line-height: 1;
        align-self: center;
      }
      .text-card-excerpt {
        position: relative;
        max-height: 2.85em;
        overflow: hidden;
        margin-bottom: 12px;
      }
      .text-card-excerpt::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 1.5em;
        background: linear-gradient(to bottom, transparent, var(--paper-2));
        pointer-events: none;
      }
      .text-card-excerpt-text {
        font-style: italic;
        font-size: 14px;
        color: var(--ink-soft);
        margin: 0;
        line-height: 1.65;
      }
      .text-card-progress {
        display: flex;
        align-items: center;
        gap: 6px;
        width: 140px;
      }
      .text-card-progress-track {
        flex: 1;
        height: 3px;
        background: var(--rule-soft);
        border-radius: 999px;
        overflow: hidden;
      }
      .text-card-progress-fill {
        height: 100%;
        background: var(--terracotta);
        border-radius: 999px;
        transition: width 0.3s ease;
      }
      .text-card-progress-label {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 10px;
        color: var(--ink-faint);
        letter-spacing: 0.04em;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .text-card-meta {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 11px;
        letter-spacing: 0.04em;
        color: var(--ink-faint);
        display: flex;
        align-items: center;
        gap: 4px;
        justify-content: flex-end;
      }
      .text-card-meta-dot { color: var(--terracotta); }

      /* Individual reading pane */
      .reading-pane {
        max-width: 760px;
        margin: 0 auto;
        padding: 48px 24px 96px;
      }
      .reading-pane-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 56px;
        flex-wrap: wrap;
        gap: 12px;
      }
      .reading-pane-header-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
      }
      .reading-controls-row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .reading-control {
        display: inline-flex;
        align-items: center;
        background: var(--paper);
        border: 1px solid var(--terracotta-soft);
        border-radius: 5px;
      }
      .reading-control-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px 9px;
        font-size: 14px;
        line-height: 1;
        color: var(--ink-soft);
        transition: color 0.12s, background 0.12s;
      }
      .reading-control-btn:not(:disabled):hover {
        color: var(--ink);
        background: var(--terracotta-soft);
      }
      .reading-control-btn:disabled {
        opacity: 0.28;
        cursor: default;
      }
      .reading-control-value {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 11px;
        letter-spacing: 0.04em;
        color: var(--ink);
        padding: 4px 6px;
        user-select: none;
        white-space: nowrap;
        min-width: 3.5em;
        text-align: center;
      }
      .reading-pane-body {
        margin: 0 auto;
      }
      .reading-pane-title {
        font-family: 'Fraunces', serif;
        font-weight: 500;
        font-size: 1.75rem;
        letter-spacing: -0.02em;
        color: var(--ink);
        line-height: 1.25;
        margin: 0 0 2.5rem;
      }
      .reading-para {
        font-family: 'Fraunces', serif;
        font-size: var(--reading-font-size, 17px);
        line-height: var(--reading-line-height, 1.75);
        color: var(--ink);
        margin: 0 0 1em;
      }
      .reading-para:last-child { margin-bottom: 0; }
      .reading-heading {
        font-family: 'Fraunces', serif;
        font-weight: 600;
        font-size: 1.15rem;
        letter-spacing: -0.01em;
        color: var(--ink);
        margin: 1.75em 0 0.6em;
        line-height: 1.3;
      }
      .reading-list {
        font-family: 'Fraunces', serif;
        font-size: var(--reading-font-size, 17px);
        line-height: var(--reading-line-height, 1.75);
        color: var(--ink);
        margin: 0 0 1em;
        padding-inline-start: 1.5em;
      }
      .reading-list li { margin-bottom: 0.25em; }
      .reading-blockquote {
        border-inline-start: 2px solid var(--terracotta-soft);
        margin: 0 0 1em;
        padding-inline-start: 1.25em;
        font-style: italic;
        color: var(--ink-soft);
      }

      /* Arabic-script serif for RTL source texts. Amiri leads the stack so the
         script renders in its intended face; embedded Latin/numbers fall through
         to Fraunces per-glyph. No line-height override — Arabic's taller metrics
         are honoured, per the established May decision. */
      .reading-pane-title[dir="rtl"] {
        font-family: 'Amiri', 'Fraunces', serif;
      }
      .reading-pane-text[dir="rtl"] .reading-para,
      .reading-pane-text[dir="rtl"] .reading-heading,
      .reading-pane-text[dir="rtl"] .reading-list,
      .reading-pane-text[dir="rtl"] .reading-blockquote {
        font-family: 'Amiri', 'Fraunces', serif;
      }
      .reading-code {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 13px;
        background: var(--paper-2);
        border: 1px solid var(--rule);
        border-radius: 3px;
        padding: 12px 14px;
        overflow-x: auto;
        margin: 0 0 1em;
        white-space: pre-wrap;
      }
      .reading-rule {
        border: none;
        border-top: 1px solid var(--rule);
        margin: 2em 0;
      }
      .reading-image {
        max-width: 100%;
        display: block;
        margin: 1em 0;
        filter: sepia(0.08) saturate(0.95);
      }

      /* ─── Word spans (click-to-translate) ──────────────────────── */
      .reading-word {
        cursor: pointer;
        border-radius: 2px;
        transition: background-color 0.12s ease;
        -webkit-touch-callout: none;
      }
      .reading-word:hover {
        background-color: rgba(164, 71, 38, 0.12);
      }

      /* ─── Translation panel ─────────────────────────────────────── */
      .translation-panel {
        position: fixed;
        top: 6rem;
        right: 2rem;
        width: 22rem;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        background: var(--paper);
        border: 1px solid var(--terracotta-soft);
        border-radius: 6px;
        box-shadow: 0 2px 12px rgba(42, 31, 21, 0.10), 0 1px 3px rgba(42, 31, 21, 0.08);
        z-index: 100;
      }
      .translation-panel-close {
        position: absolute;
        top: 0.7rem;
        right: 0.7rem;
        background: transparent;
        border: none;
        cursor: pointer;
        color: var(--ink-faint);
        font-size: 1.15rem;
        line-height: 1;
        padding: 2px 5px;
        border-radius: 3px;
        transition: color 0.12s, background 0.12s;
      }
      .translation-panel-close:hover {
        color: var(--ink);
        background: var(--terracotta-soft);
      }
      .translation-panel-header {
        flex-shrink: 0;
        padding: 1.25rem 1.25rem 0;
      }
      .translation-panel-body {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 0.35rem 1.25rem 0;
        scrollbar-width: thin;
        scrollbar-color: var(--rule) transparent;
      }
      .translation-panel-body::-webkit-scrollbar { width: 4px; }
      .translation-panel-body::-webkit-scrollbar-track { background: transparent; }
      .translation-panel-body::-webkit-scrollbar-thumb {
        background: var(--rule);
        border-radius: 2px;
      }
      .translation-panel-footer {
        flex-shrink: 0;
        border-top: 1px solid var(--rule-soft);
        padding: 0.75rem 1.25rem 1.1rem;
      }
      .translation-panel-word {
        font-family: 'Fraunces', 'Amiri', serif;
        font-size: 1.25rem;
        font-weight: 500;
        color: var(--ink);
        margin: 0 0 0.5rem;
        padding-right: 1.6rem;
        line-height: 1.3;
      }
      /* Gutter-clipping separators: every code (including each row's first) has a
         ::before dot living in a left gutter. The flex row is pulled left by one
         gutter width and the wrapper clips the overflow, so each row's leading dot
         falls outside the clip and disappears — dots render only BETWEEN codes on
         the same row, never dangling at a wrap boundary. Works for any number of
         rows and any wrap point. */
      .translation-lang-toggle-clip {
        overflow: hidden;
        margin-bottom: 0.85rem;
      }
      .translation-lang-toggle {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        row-gap: 0.35rem;
        margin-left: -0.9rem;
      }
      .translation-lang-btn {
        position: relative;
        margin-left: 0.9rem;
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 11px;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 2px;
        color: var(--ink-faint);
        transition: color 0.12s;
        line-height: 1;
        letter-spacing: 0.03em;
      }
      .translation-lang-btn::before {
        content: "·";
        position: absolute;
        left: -0.9rem;
        top: 50%;
        transform: translateY(-50%);
        width: 0.9rem;
        text-align: center;
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 11px;
        line-height: 1;
        color: var(--rule);
        pointer-events: none;
      }
      .translation-lang-btn.active {
        color: var(--terracotta);
        text-decoration: underline;
        text-decoration-color: var(--terracotta);
        text-underline-offset: 3px;
        text-decoration-thickness: 1px;
      }
      .translation-lang-btn:not(.active):hover { color: var(--ink-soft); }
      .translation-lang-divider {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 11px;
        color: var(--rule);
        line-height: 1;
      }
      .translation-loading {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 12px;
        color: var(--ink-faint);
        padding: 0.4rem 0 0.6rem;
        margin: 0;
      }
      .translation-list {
        list-style: none;
        margin: 0 0 0.4rem;
        padding: 0;
      }
      .translation-item {
        font-family: 'Fraunces', 'Amiri', serif;
        font-size: 1rem;
        color: var(--ink);
        line-height: 1.55;
        padding: 0.05rem 0;
      }
      .translation-empty {
        font-family: 'Fraunces', serif;
        font-size: 0.95rem;
        font-style: italic;
        color: var(--ink-faint);
        margin: 0 0 0.4rem;
      }
      .translation-examples {
        margin-top: 0.55rem;
      }
      .translation-example {
        font-family: 'Fraunces', serif;
        font-size: 0.875rem;
        font-style: italic;
        color: var(--ink-soft);
        line-height: 1.45;
        margin: 0 0 0.35rem;
      }
      .translation-divider {
        border: none;
        border-top: 1px solid var(--rule-soft);
        margin: 0.85rem 0 0.75rem;
      }
      .translation-add-btn {
        font-family: 'Fraunces', serif;
        font-size: 0.9rem;
        background: transparent;
        border: none;
        cursor: pointer;
        color: var(--ink-soft);
        padding: 0;
        transition: color 0.12s;
      }
      .translation-add-btn:hover { color: var(--ink); }
      .translation-add-form {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
      }
      .translation-add-form-label {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 10px;
        color: var(--ink-faint);
        margin: 0 0 3px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
      .translation-add-form input,
      .translation-add-form textarea {
        width: 100%;
        box-sizing: border-box;
        font-family: 'Fraunces', serif;
        font-size: 0.9rem;
        background: var(--paper-2);
        border: 1px solid var(--rule);
        border-radius: 4px;
        padding: 0.4rem 0.6rem;
        color: var(--ink);
        resize: none;
        outline: none;
        transition: border-color 0.12s;
      }
      .translation-add-form input:focus,
      .translation-add-form textarea:focus {
        border-color: var(--terracotta-soft);
      }
      .translation-add-form-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.2rem;
      }
      .translation-confirmed {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 12px;
        color: var(--moss);
        margin: 0;
        padding: 0.15rem 0;
      }

      /* ─── DeepL sentence section ────────────────────────────────── */
      .deepl-section {
        margin-top: 0.5rem;
      }
      .deepl-divider {
        border: none;
        border-top: 1px solid var(--rule);
        margin: 0.75rem 0 0.65rem;
      }
      .deepl-label {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 0.63rem;
        color: var(--ink-soft);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin: 0 0 0.3rem;
      }
      .deepl-source {
        font-family: 'Fraunces', Georgia, serif;
        font-style: italic;
        font-size: 0.8rem;
        color: var(--ink-soft);
        margin: 0 0 0.45rem;
        line-height: 1.5;
      }
      .deepl-translation {
        font-family: 'Fraunces', 'Amiri', Georgia, serif;
        font-size: 0.95rem;
        color: var(--ink);
        margin: 0;
        line-height: 1.5;
      }
      @keyframes deepl-pulse {
        0%, 100% { opacity: 0.35; }
        50%       { opacity: 1; }
      }
      .deepl-loading {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 0.85rem;
        letter-spacing: 0.35em;
        color: var(--terracotta);
        margin: 0;
        animation: deepl-pulse 1.4s ease-in-out infinite;
      }
      .deepl-fallback {
        font-family: 'Fraunces', Georgia, serif;
        font-style: italic;
        font-size: 0.8rem;
        color: var(--ink-soft);
        margin: 0;
      }
      .translation-translate-sentence {
        display: block;
        background: none;
        border: none;
        padding: 0;
        margin-top: 0.65rem;
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 0.68rem;
        color: var(--ink-soft);
        cursor: pointer;
        letter-spacing: 0.01em;
        text-decoration: underline;
        text-underline-offset: 2px;
        text-decoration-color: transparent;
        transition: color 0.12s ease, text-decoration-color 0.12s ease;
      }
      .translation-translate-sentence:hover {
        color: var(--ink);
        text-decoration-color: var(--rule);
      }

      /* ─── Dictionary section ────────────────────────────────── */
      .dictionary-section {
        margin-top: 0.15rem;
      }
      .dictionary-divider {
        border: none;
        border-top: 1px solid var(--rule);
        margin: 0.75rem 0 0.65rem;
      }
      .dictionary-label-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        margin: 0 0 0.3rem;
      }
      .dictionary-label {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 0.63rem;
        color: var(--ink-soft);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin: 0;
      }
      .dictionary-toggle {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 0.63rem;
        color: var(--ink-soft);
        line-height: 1;
        user-select: none;
      }
      .dictionary-phonetic-row {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        margin: 0 0 0.5rem;
      }
      .dictionary-phonetic {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 0.78rem;
        color: var(--ink-soft);
      }
      .dictionary-audio-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        color: var(--terracotta);
        padding: 0;
        display: flex;
        align-items: center;
        line-height: 1;
        transition: color 0.12s;
      }
      .dictionary-audio-btn:hover { color: var(--ink); }
      .dictionary-meaning {
        margin-bottom: 0.45rem;
      }
      .dictionary-pos {
        font-family: 'Fraunces', Georgia, serif;
        font-style: italic;
        font-size: 0.78rem;
        color: var(--ink-soft);
        margin: 0 0 0.2rem;
      }
      .dictionary-def-item {
        margin-bottom: 0.3rem;
      }
      .dictionary-definition {
        font-family: 'Fraunces', Georgia, serif;
        font-size: 0.875rem;
        color: var(--ink);
        margin: 0;
        line-height: 1.5;
      }
      .dictionary-example {
        font-family: 'Fraunces', Georgia, serif;
        font-style: italic;
        font-size: 0.81rem;
        color: var(--ink-soft);
        margin: 0.1rem 0 0;
        padding-left: 0.6rem;
        line-height: 1.45;
      }
      .dictionary-unavailable {
        font-family: 'Fraunces', Georgia, serif;
        font-style: italic;
        font-size: 0.8rem;
        color: var(--ink-soft);
        margin: 0;
      }

      /* ─── AI define section ─────────────────────────────────── */
      .define-section { margin-bottom: 0; }
      .define-label {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 0.61rem;
        color: var(--ink-faint);
        letter-spacing: 0.1em;
        margin: 0 0 0.45rem;
      }
      .define-form-line {
        display: flex;
        align-items: baseline;
        gap: 0.35rem;
        margin: 0 0 0.3rem;
        flex-wrap: wrap;
      }
      .define-input-word {
        font-family: 'Fraunces', Georgia, serif;
        font-size: 0.95rem;
        color: var(--ink-soft);
      }
      .define-arrow {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 0.75rem;
        color: var(--ink-faint);
      }
      .define-base {
        font-family: 'Fraunces', 'Amiri', Georgia, serif;
        font-size: 0.95rem;
        color: var(--terracotta);
        font-weight: 500;
      }
      .define-meaning {
        font-family: 'Fraunces', 'Amiri', Georgia, serif;
        font-size: 1rem;
        color: var(--ink);
        margin: 0 0 0.3rem;
        line-height: 1.45;
      }
      .define-note {
        font-family: 'Fraunces', Georgia, serif;
        font-style: italic;
        font-size: 0.82rem;
        color: var(--ink-soft);
        margin: 0 0 0.25rem;
        line-height: 1.45;
      }
      .define-loading {
        display: inline-block;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--terracotta);
        animation: deepl-pulse 1.4s ease-in-out infinite;
        margin: 0.45rem 0 0.5rem;
      }
      @keyframes define-scan {
        0%   { transform: translateX(-100%); }
        50%  { transform: translateX(333%); }
        100% { transform: translateX(-100%); }
      }
      .define-progress-bar {
        position: relative;
        width: 100%;
        height: 3px;
        background: rgba(164, 71, 38, 0.10);
        border-radius: 999px;
        overflow: hidden;
        margin: 0.45rem 0 0.5rem;
      }
      .define-progress-bar::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 30%;
        height: 100%;
        background: var(--terracotta);
        border-radius: 999px;
        animation: define-scan 2s ease-in-out infinite;
      }
      .define-divider {
        border: none;
        border-top: 1px solid var(--rule);
        margin: 0.6rem 0 0.65rem;
      }

      /* ─── Glosbe toggle divider ─────────────────────────────────── */
      .define-glosbe-toggle {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0.65rem 0 0.7rem;
        cursor: pointer;
        user-select: none;
        outline: none;
      }
      .define-glosbe-line {
        flex: 1;
        height: 1px;
        background: var(--rule);
      }
      .define-glosbe-chevron {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 0.62rem;
        color: var(--ink-faint);
        line-height: 1;
        transition: color 0.12s;
      }
      .define-glosbe-toggle:hover .define-glosbe-chevron {
        color: var(--terracotta);
      }

      /* ─── DeepL pill button (1–2 word path) ────────────────────── */
      .deepl-pill-wrapper {
        margin-top: 0.55rem;
        margin-bottom: 0.15rem;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .deepl-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.32rem 1.1rem;
        border: 1px solid var(--terracotta);
        border-radius: 999px;
        background: transparent;
        color: var(--terracotta);
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 0.73rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        cursor: pointer;
        transition: background 0.15s ease;
        line-height: 1;
      }
      .deepl-pill:hover {
        background: rgba(164, 71, 38, 0.07);
      }
      .deepl-pill:active {
        background: rgba(164, 71, 38, 0.14);
      }
      .deepl-pill.deepl-pill-open {
        background: rgba(164, 71, 38, 0.05);
      }
      .deepl-pill-chevron {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 0.65rem;
        line-height: 1;
        flex-shrink: 0;
      }
      .deepl-pill-result {
        padding: 0.35rem 0 0.45rem;
        width: 100%;
      }
      .deepl-pill-caption {
        font-family: 'Fraunces', serif;
        font-size: 0.9rem;
        font-style: italic;
        color: var(--ink-soft);
        text-align: center;
        margin: 0.35rem 0 0;
        padding: 0;
        line-height: 1.4;
      }

      /* ─── DeepL primary result (3+ word selections) ─────────────── */
      .deepl-primary {
        padding: 0.15rem 0 0.1rem;
      }
      /* Quiet caption shown in place of DeepL when target == source language */
      .deepl-same-pair-note {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 0.7rem;
        color: var(--ink-faint);
        line-height: 1.5;
        letter-spacing: 0.01em;
        margin: 0;
        padding: 0.2rem 0;
      }

      /* ─── Translation backdrop + drag handle (mobile only) ────── */
      .translation-backdrop { display: none; }
      .translation-panel-handle { display: none; }
      .translation-panel-handle-bar {
        width: 32px;
        height: 3px;
        background: var(--rule);
        border-radius: 2px;
      }

      @media (max-width: 900px) {
        .translation-panel {
          top: auto;
          right: 0;
          bottom: 0;
          left: 0;
          width: 100%;
          max-width: none;
          max-height: 75vh;
          border-radius: 12px 12px 0 0;
          border: none;
          border-top: 2px solid var(--terracotta-soft);
          animation: sheetUp 0.22s ease both;
        }
        @keyframes sheetUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        .translation-backdrop {
          display: block;
          position: fixed;
          inset: 0;
          background: rgba(42, 31, 21, 0.30);
          z-index: 99;
        }
        .translation-panel-handle {
          display: flex;
          justify-content: center;
          padding: 8px 0 2px;
          flex-shrink: 0;
        }
      }

      /* ─── URL import ────────────────────────────────────────────── */
      .url-import-link-row {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        margin-top: 0.1rem;
        margin-bottom: 0.1rem;
      }
      .url-import-link {
        font-family: 'Fraunces', serif;
        font-style: italic;
        font-size: 0.88rem;
        color: var(--ink-soft);
        background: transparent;
        border: none;
        padding: 0;
        cursor: pointer;
        transition: color 0.15s ease;
        line-height: 1;
      }
      .url-import-link:hover:not(:disabled) { color: var(--terracotta); }
      .url-import-link:disabled { cursor: default; }
      .url-import-link.url-import-link-soft {
        font-size: 0.78rem;
        opacity: 0.55;
        cursor: default;
      }
      .url-import-dismiss {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 0.82rem;
        color: var(--ink-faint);
        background: transparent;
        border: none;
        padding: 0 2px;
        cursor: pointer;
        line-height: 1;
        transition: color 0.15s ease;
      }
      .url-import-dismiss:hover { color: var(--terracotta); }
      .url-import-input-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.4rem;
      }
      .url-import-input {
        font-family: 'Fraunces', serif;
        font-style: italic;
        font-size: 0.9rem;
        background: var(--paper-2);
        border: 1px solid var(--rule);
        color: var(--ink);
        border-radius: 3px;
        padding: 7px 10px;
        outline: none;
        transition: border-color 0.18s ease;
        flex: 1;
        min-width: 0;
        box-sizing: border-box;
      }
      .url-import-input:focus { border-color: var(--terracotta); }
      .url-import-input::placeholder { color: var(--ink-faint); font-style: italic; }
      .url-import-fetch-button {
        font-family: 'Fraunces', serif;
        font-size: 0.85rem;
        color: var(--ink-soft);
        background: transparent;
        border: 1px solid var(--rule);
        border-radius: 3px;
        padding: 6px 12px;
        cursor: pointer;
        white-space: nowrap;
        transition: color 0.15s ease, border-color 0.15s ease;
        flex-shrink: 0;
      }
      .url-import-fetch-button:hover { color: var(--ink); border-color: var(--ink-soft); }
      .url-import-progress {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }
      .url-import-progress-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--terracotta);
        flex-shrink: 0;
        animation: deepl-pulse 1.4s ease-in-out infinite;
      }
      .url-import-progress-text {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 0.82rem;
        color: var(--ink-soft);
      }
      .url-import-warning {
        font-family: 'Fraunces', serif;
        font-style: italic;
        font-size: 0.88rem;
        color: var(--ink-soft);
        line-height: 1.45;
        margin: 0.35rem 0 0;
        padding: 0;
      }
      .url-import-source-line {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 0.72rem;
        color: var(--ink-faint);
        margin: -8px 0 0;
        letter-spacing: 0.02em;
      }

      /* ─── Share button ──────────────────────────────────────────── */
      .share-btn {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 14px;
        color: var(--ink-soft);
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        transition: color 0.18s ease;
        white-space: nowrap;
      }
      .share-btn:hover { color: var(--terracotta); }

      .share-inline-pulse {
        display: inline-block;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--terracotta);
        animation: deepl-pulse 1.4s ease-in-out infinite;
        vertical-align: middle;
      }

      /* ─── Share modal ───────────────────────────────────────────── */
      .share-modal {
        background: var(--paper);
        border: 1px solid var(--rule);
        border-top: 2px solid var(--terracotta);
        border-radius: 6px;
        box-shadow: 0 8px 40px -8px rgba(42, 31, 21, 0.35), 0 2px 8px -4px rgba(42, 31, 21, 0.15);
        padding: 32px;
        max-width: 480px;
        width: calc(100% - 40px);
        position: relative;
        box-sizing: border-box;
      }
      .share-modal-title {
        font-family: 'Fraunces', Georgia, serif;
        font-style: italic;
        font-weight: 400;
        font-size: 20px;
        color: var(--ink);
        margin: 0 0 18px;
        line-height: 1.2;
      }
      .share-modal-url-input {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 13px;
        color: var(--ink-soft);
        background: var(--paper-2);
        border: 1px solid var(--rule);
        border-radius: 3px;
        padding: 9px 11px;
        width: 100%;
        box-sizing: border-box;
        outline: none;
        cursor: text;
        margin-bottom: 12px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .share-modal-url-input:focus { border-color: var(--terracotta-soft); }
      .share-modal-copy-btn {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 13px;
        color: var(--paper);
        background: var(--terracotta);
        border: none;
        border-radius: 3px;
        padding: 8px 18px;
        cursor: pointer;
        transition: background 0.18s ease;
        display: block;
        margin-bottom: 14px;
      }
      .share-modal-copy-btn:hover { background: var(--ink); }
      .share-modal-hint {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 12px;
        color: var(--ink-soft);
        margin: 0 0 10px;
        line-height: 1.5;
      }
      .share-modal-coda {
        font-family: 'Fraunces', Georgia, serif;
        font-style: italic;
        font-size: 14px;
        color: var(--terracotta);
        margin: 0;
        text-align: center;
      }
      .share-modal-error {
        font-family: 'Fraunces', Georgia, serif;
        font-style: italic;
        font-size: 16px;
        color: var(--ink-soft);
        margin: 8px 0 0;
        line-height: 1.65;
      }

      /* ─── Shared text view ──────────────────────────────────────── */
      .shared-view-loading,
      .shared-view-error {
        max-width: 560px;
        margin: 0 auto;
        padding: 80px 24px 96px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 20px;
      }
      .shared-view-loading-text {
        font-family: 'Fraunces', Georgia, serif;
        font-style: italic;
        font-size: 18px;
        color: var(--ink-soft);
        margin: 0;
      }
      .shared-view-error-text {
        font-family: 'Fraunces', Georgia, serif;
        font-style: italic;
        font-size: 18px;
        color: var(--ink-soft);
        margin: 0;
        line-height: 1.55;
      }
      .shared-view-home-link {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 13px;
        color: var(--terracotta);
        text-decoration: none;
        transition: color 0.18s ease;
      }
      .shared-view-home-link:hover { color: var(--ink); }
      .shared-view-save-section {
        margin-top: 48px;
        display: flex;
        justify-content: center;
        padding-bottom: 32px;
      }
      .shared-view-save-btn {
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 13px;
        color: var(--paper);
        background: var(--terracotta);
        border: none;
        border-radius: 3px;
        padding: 10px 22px;
        cursor: pointer;
        transition: background 0.18s ease;
        letter-spacing: 0.02em;
      }
      .shared-view-save-btn:hover { background: var(--ink); }
      .shared-view-save-btn.saved {
        background: var(--terracotta-soft);
        color: var(--terracotta);
        cursor: default;
      }
      .shared-view-save-btn.saved:hover { background: var(--terracotta-soft); }

      @keyframes toast-fade {
        0%   { opacity: 0; transform: translateX(-50%) translateY(8px); }
        12%  { opacity: 1; transform: translateX(-50%) translateY(0); }
        75%  { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-4px); }
      }
      .save-toast {
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background: var(--terracotta);
        color: var(--paper);
        font-family: 'DM Mono', ui-monospace, monospace;
        font-size: 13px;
        padding: 10px 20px;
        border-radius: 4px;
        z-index: 200;
        white-space: nowrap;
        animation: toast-fade 2.5s ease forwards;
        pointer-events: none;
      }

    `}</style>
  );
}
