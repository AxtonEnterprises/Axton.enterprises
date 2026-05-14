import { useState, useRef, useCallback, useEffect } from "react";

const THEMES = {
  dark: {
    bg: "#0a0a0f",
    surface: "#111118",
    border: "#1e1e2e",
    accent: "#e8ff47",
    accentDim: "#b8cc30",
    text: "#e4e4f0",
    textMuted: "#5a5a7a",
    textDim: "#8888aa",
    editorBg: "#0d0d14",
    lineNum: "#2a2a3e",
    keyword: "#ff79c6",
    string: "#f1fa8c",
    comment: "#6272a4",
    number: "#bd93f9",
    tag: "#50fa7b",
  },
};

const T = THEMES.dark;

// Simple syntax highlighter
function highlight(code, lang) {
  if (!lang || lang === "text") return escapeHtml(code);
  let escaped = escapeHtml(code);

  const rules = [
    // Comments (must come first)
    { re: /(\/\/[^\n]*)/g, cls: "cmt" },
    { re: /(\/\*[\s\S]*?\*\/)/g, cls: "cmt" },
    { re: /(#[^\n]*)/g, cls: "cmt" }, // Python/shell comments
    // Strings
    { re: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, cls: "str" },
    // HTML tags
    ...(lang === "html"
      ? [
          { re: /(&lt;\/?[\w-]+)/g, cls: "tag" },
          { re: /(\s[\w-]+=)/g, cls: "attr" },
        ]
      : []),
    // Keywords
    {
      re: /\b(import|export|from|default|const|let|var|function|return|if|else|for|while|class|extends|new|this|typeof|async|await|try|catch|throw|of|in|true|false|null|undefined|void|delete|break|continue|switch|case|def|print|self|None|True|False|pass|elif|lambda|with|as|yield|int|string|bool|type|interface|struct|pub|fn|use|mod|impl|trait|where)\b/g,
      cls: "kw",
    },
    // Numbers
    { re: /\b(\d+\.?\d*)\b/g, cls: "num" },
    // JSX tags / function names
    { re: /\b([A-Z][a-zA-Z0-9]*)/g, cls: "tag" },
  ];

  rules.forEach(({ re, cls }) => {
    escaped = escaped.replace(re, `<span class="hl-${cls}">$1</span>`);
  });

  return escaped;
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function detectLang(filename) {
  const ext = filename?.split(".").pop()?.toLowerCase();
  const map = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    html: "html",
    htm: "html",
    css: "css",
    py: "python",
    json: "json",
    md: "markdown",
    sh: "shell",
    rs: "rust",
    go: "go",
  };
  return map[ext] || "text";
}

function CodeLine({ num, code, lang }) {
  return (
    <div style={{ display: "flex", lineHeight: "1.7" }}>
      <span
        style={{
          minWidth: 44,
          paddingRight: 16,
          textAlign: "right",
          color: T.lineNum,
          userSelect: "none",
          fontSize: 12,
          paddingTop: 0,
          fontFamily: "inherit",
        }}
      >
        {num}
      </span>
      <span
        style={{ flex: 1, whiteSpace: "pre-wrap", wordBreak: "break-all" }}
        dangerouslySetInnerHTML={{ __html: highlight(code, lang) || " " }}
      />
    </div>
  );
}

// Upload zone
function UploadZone({ onFile }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) onFile(file);
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: 40,
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 11,
            letterSpacing: "0.3em",
            color: T.textMuted,
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Code Forge
        </div>
        <div
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 38,
            fontWeight: 400,
            color: T.text,
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          Edit & Preview
          <span style={{ color: T.accent }}>.</span>
        </div>
        <div
          style={{
            marginTop: 10,
            color: T.textMuted,
            fontSize: 13,
            fontFamily: "'Courier New', monospace",
          }}
        >
          Upload a file to get started
        </div>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragging ? T.accent : T.border}`,
          borderRadius: 12,
          padding: "48px 64px",
          cursor: "pointer",
          textAlign: "center",
          background: dragging ? "rgba(232,255,71,0.04)" : "rgba(255,255,255,0.02)",
          transition: "all 0.2s",
          maxWidth: 420,
          width: "100%",
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.6 }}>⌃</div>
        <div style={{ color: T.text, fontSize: 15, marginBottom: 6 }}>
          Drop a file here
        </div>
        <div style={{ color: T.textMuted, fontSize: 12, fontFamily: "'Courier New', monospace" }}>
          .js .jsx .ts .tsx .html .css .py .json .md .rs .go .sh
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".js,.jsx,.ts,.tsx,.html,.htm,.css,.py,.json,.md,.rs,.go,.sh,.txt"
          onChange={handleFile}
          style={{ display: "none" }}
        />
      </div>

      {/* Or paste */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", maxWidth: 420 }}>
        <div style={{ flex: 1, height: 1, background: T.border }} />
        <span style={{ color: T.textMuted, fontSize: 11, fontFamily: "'Courier New', monospace" }}>
          OR START FROM SCRATCH
        </span>
        <div style={{ flex: 1, height: 1, background: T.border }} />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", maxWidth: 420 }}>
        {[
          { label: "HTML", starter: "<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>", ext: "html" },
          { label: "JavaScript", starter: "// JavaScript\nconst greet = (name) => {\n  return `Hello, ${name}!`;\n};\n\nconsole.log(greet('World'));", ext: "js" },
          { label: "CSS", starter: "/* Styles */\nbody {\n  margin: 0;\n  font-family: sans-serif;\n  background: #f0f0f0;\n}\n\nh1 {\n  color: #333;\n}", ext: "css" },
          { label: "Python", starter: "# Python\ndef greet(name):\n    return f'Hello, {name}!'\n\nprint(greet('World'))", ext: "py" },
        ].map(({ label, starter, ext }) => (
          <button
            key={label}
            onClick={() => {
              const blob = new Blob([starter], { type: "text/plain" });
              const file = new File([blob], `starter.${ext}`);
              onFile(file, starter);
            }}
            style={{
              background: "transparent",
              border: `1px solid ${T.border}`,
              color: T.textDim,
              padding: "8px 16px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "'Courier New', monospace",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = T.accent;
              e.currentTarget.style.color = T.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = T.border;
              e.currentTarget.style.color = T.textDim;
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Editor panel
function Editor({ code, onChange, lang, filename }) {
  const [lineCount, setLineCount] = useState(1);
  const textareaRef = useRef();
  const highlightRef = useRef();

  useEffect(() => {
    setLineCount(code.split("\n").length);
  }, [code]);

  const syncScroll = () => {
    if (highlightRef.current && textareaRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + "  " + code.substring(end);
      onChange(newCode);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const lines = code.split("\n");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Editor header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          borderBottom: `1px solid ${T.border}`,
          background: T.surface,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: T.textMuted, fontSize: 11, fontFamily: "'Courier New', monospace" }}>
            EDITOR
          </span>
          <span
            style={{
              background: "rgba(232,255,71,0.1)",
              color: T.accent,
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 3,
              fontFamily: "'Courier New', monospace",
              letterSpacing: "0.05em",
            }}
          >
            {lang.toUpperCase()}
          </span>
        </div>
        <span style={{ color: T.textMuted, fontSize: 11, fontFamily: "'Courier New', monospace" }}>
          {filename} · {lineCount} {lineCount === 1 ? "line" : "lines"}
        </span>
      </div>

      {/* Editor body */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex" }}>
        {/* Line numbers */}
        <div
          style={{
            width: 44,
            flexShrink: 0,
            background: T.editorBg,
            borderRight: `1px solid ${T.border}`,
            overflow: "hidden",
            paddingTop: 12,
          }}
        >
          {lines.map((_, i) => (
            <div
              key={i}
              style={{
                height: "1.7em",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                paddingRight: 10,
                color: T.lineNum,
                fontSize: 12,
                fontFamily: "'Courier New', monospace",
                lineHeight: "1.7",
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Highlighted layer */}
        <div
          ref={highlightRef}
          style={{
            position: "absolute",
            left: 44,
            top: 0,
            right: 0,
            bottom: 0,
            padding: "12px 16px",
            fontFamily: "'Courier New', monospace",
            fontSize: 13,
            lineHeight: "1.7",
            color: T.text,
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            overflow: "auto",
            pointerEvents: "none",
            background: T.editorBg,
          }}
          dangerouslySetInnerHTML={{
            __html: lines
              .map(
                (line) =>
                  `<div style="min-height:1.7em">${highlight(line, lang) || " "}</div>`
              )
              .join(""),
          }}
        />

        {/* Textarea on top */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={syncScroll}
          spellCheck={false}
          style={{
            position: "absolute",
            left: 44,
            top: 0,
            right: 0,
            bottom: 0,
            padding: "12px 16px",
            fontFamily: "'Courier New', monospace",
            fontSize: 13,
            lineHeight: "1.7",
            color: "transparent",
            caretColor: T.accent,
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            zIndex: 1,
          }}
        />
      </div>
    </div>
  );
}

// Preview panel
function Preview({ code, lang, filename }) {
  const iframeRef = useRef();
  const [previewKey, setPreviewKey] = useState(0);

  const buildPreview = useCallback(() => {
    if (lang === "html") return code;
    if (lang === "css") {
      return `<!DOCTYPE html><html><head><style>${code}</style></head><body><div class="preview-demo"><h1>Heading 1</h1><h2>Heading 2</h2><p>A paragraph of sample text to preview your styles. <strong>Bold</strong> and <em>italic</em>.</p><a href="#">A link</a><ul><li>List item one</li><li>List item two</li><li>List item three</li></ul><button>Button</button></div></body></html>`;
    }
    if (lang === "javascript" || lang === "typescript") {
      return `<!DOCTYPE html><html><head><style>
        body { background: #0a0a0f; color: #e4e4f0; font-family: 'Courier New', monospace; padding: 24px; margin: 0; }
        pre { margin: 0; white-space: pre-wrap; word-break: break-all; font-size: 13px; line-height: 1.7; }
        .log { border-left: 2px solid #e8ff47; padding: 4px 12px; margin: 4px 0; }
        .err { border-left: 2px solid #ff5555; padding: 4px 12px; margin: 4px 0; color: #ff5555; }
        .hdr { color: #5a5a7a; font-size: 11px; letter-spacing: 0.2em; margin-bottom: 16px; }
      </style></head><body>
        <div class="hdr">// CONSOLE OUTPUT</div>
        <div id="out"></div>
        <script>
          const out = document.getElementById('out');
          const origLog = console.log;
          const origErr = console.error;
          console.log = (...args) => {
            origLog(...args);
            const d = document.createElement('div');
            d.className = 'log';
            d.innerHTML = '<pre>' + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') + '</pre>';
            out.appendChild(d);
          };
          console.error = (...args) => {
            origErr(...args);
            const d = document.createElement('div');
            d.className = 'err';
            d.innerHTML = '<pre>' + args.map(a => String(a)).join(' ') + '</pre>';
            out.appendChild(d);
          };
          try { ${code} } catch(e) { console.error(e.message); }
        </script>
      </body></html>`;
    }
    if (lang === "markdown") {
      const html = code
        .replace(/^### (.+)$/gm, "<h3>$1</h3>")
        .replace(/^## (.+)$/gm, "<h2>$1</h2>")
        .replace(/^# (.+)$/gm, "<h1>$1</h1>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/`(.+?)`/g, "<code>$1</code>")
        .replace(/^\- (.+)$/gm, "<li>$1</li>")
        .replace(/\n\n/g, "<br><br>");
      return `<!DOCTYPE html><html><head><style>
        body{background:#fff;color:#222;font-family:Georgia,serif;padding:40px;max-width:680px;margin:0 auto;line-height:1.8;}
        h1,h2,h3{font-weight:600;margin-top:2em;}
        code{background:#f0f0f0;padding:2px 6px;border-radius:3px;font-family:monospace;}
        li{margin:4px 0;}
      </style></head><body>${html}</body></html>`;
    }
    // Default: show raw
    return `<!DOCTYPE html><html><head><style>
      body{background:#0a0a0f;color:#e4e4f0;font-family:'Courier New',monospace;padding:24px;margin:0;}
      pre{white-space:pre-wrap;word-break:break-all;font-size:13px;line-height:1.7;}
      .hdr{color:#5a5a7a;font-size:11px;letter-spacing:0.2em;margin-bottom:16px;}
    </style></head><body><div class="hdr">// ${filename.toUpperCase()}</div><pre>${escapeHtml(code)}</pre></body></html>`;
  }, [code, lang, filename]);

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(buildPreview());
        doc.close();
      }
    }
  }, [buildPreview, previewKey]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Preview header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          borderBottom: `1px solid ${T.border}`,
          background: T.surface,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: T.textMuted, fontSize: 11, fontFamily: "'Courier New', monospace" }}>
            PREVIEW
          </span>
          <div style={{ display: "flex", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5555", opacity: 0.7 }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f1fa8c", opacity: 0.7 }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#50fa7b", opacity: 0.7 }} />
          </div>
        </div>
        <button
          onClick={() => setPreviewKey((k) => k + 1)}
          style={{
            background: "transparent",
            border: `1px solid ${T.border}`,
            color: T.textMuted,
            padding: "4px 12px",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 11,
            fontFamily: "'Courier New', monospace",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = T.accent;
            e.currentTarget.style.color = T.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = T.border;
            e.currentTarget.style.color = T.textMuted;
          }}
        >
          ↺ refresh
        </button>
      </div>

      {/* Preview iframe */}
      <div style={{ flex: 1, background: "#fff", overflow: "hidden" }}>
        <iframe
          ref={iframeRef}
          style={{ width: "100%", height: "100%", border: "none" }}
          title="preview"
          sandbox="allow-scripts"
        />
      </div>
    </div>
  );
}

export default function App() {
  const [file, setFile] = useState(null);
  const [code, setCode] = useState("");
  const [lang, setLang] = useState("text");
  const [filename, setFilename] = useState("untitled");
  const [view, setView] = useState("split"); // split | editor | preview
  const [copied, setCopied] = useState(false);

  const handleFile = useCallback((file, preloadedContent) => {
    setFilename(file.name);
    setLang(detectLang(file.name));
    if (preloadedContent) {
      setCode(preloadedContent);
      setFile(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCode(e.target.result);
        setFile(file);
      };
      reader.readAsText(file);
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNewFile = () => {
    setFile(null);
    setCode("");
    setLang("text");
    setFilename("untitled");
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: T.bg,
        color: T.text,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Courier New', monospace",
        overflow: "hidden",
      }}
    >
      {/* Toolbar */}
      {file && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            height: 44,
            borderBottom: `1px solid ${T.border}`,
            background: T.surface,
            flexShrink: 0,
          }}
        >
          {/* Left: brand + file name */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span
              style={{
                fontSize: 11,
                letterSpacing: "0.25em",
                color: T.accent,
                fontWeight: 700,
              }}
            >
              ⌥ FORGE
            </span>
            <span style={{ color: T.border }}>|</span>
            <span style={{ color: T.textDim, fontSize: 12 }}>{filename}</span>
          </div>

          {/* Center: view toggle */}
          <div
            style={{
              display: "flex",
              gap: 2,
              background: T.bg,
              padding: 3,
              borderRadius: 6,
              border: `1px solid ${T.border}`,
            }}
          >
            {[
              { id: "editor", label: "Editor" },
              { id: "split", label: "Split" },
              { id: "preview", label: "Preview" },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                style={{
                  background: view === id ? T.accent : "transparent",
                  color: view === id ? "#000" : T.textMuted,
                  border: "none",
                  padding: "4px 14px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 11,
                  fontFamily: "'Courier New', monospace",
                  transition: "all 0.15s",
                  fontWeight: view === id ? 700 : 400,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Right: actions */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={handleCopy}
              style={{
                background: "transparent",
                border: `1px solid ${T.border}`,
                color: copied ? T.accent : T.textMuted,
                padding: "5px 12px",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 11,
                fontFamily: "'Courier New', monospace",
                transition: "all 0.15s",
              }}
            >
              {copied ? "✓ copied" : "copy"}
            </button>
            <button
              onClick={handleDownload}
              style={{
                background: "transparent",
                border: `1px solid ${T.border}`,
                color: T.textMuted,
                padding: "5px 12px",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 11,
                fontFamily: "'Courier New', monospace",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = T.accent;
                e.currentTarget.style.color = T.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.color = T.textMuted;
              }}
            >
              ↓ save
            </button>
            <button
              onClick={handleNewFile}
              style={{
                background: "transparent",
                border: `1px solid ${T.border}`,
                color: T.textMuted,
                padding: "5px 12px",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 11,
                fontFamily: "'Courier New', monospace",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#ff5555";
                e.currentTarget.style.color = "#ff5555";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.color = T.textMuted;
              }}
            >
              new file
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        {!file ? (
          <UploadZone onFile={handleFile} />
        ) : (
          <div style={{ display: "flex", width: "100%", height: "100%" }}>
            {/* Editor */}
            {(view === "editor" || view === "split") && (
              <div
                style={{
                  flex: 1,
                  borderRight: view === "split" ? `1px solid ${T.border}` : "none",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Editor code={code} onChange={setCode} lang={lang} filename={filename} />
              </div>
            )}

            {/* Divider handle (decorative) */}
            {view === "split" && (
              <div
                style={{
                  width: 3,
                  background: T.border,
                  flexShrink: 0,
                  cursor: "col-resize",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.accent)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.border)}
              />
            )}

            {/* Preview */}
            {(view === "preview" || view === "split") && (
              <div
                style={{
                  flex: 1,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Preview code={code} lang={lang} filename={filename} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status bar */}
      {file && (
        <div
          style={{
            height: 24,
            background: T.surface,
            borderTop: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            gap: 20,
            flexShrink: 0,
          }}
        >
          <span style={{ color: T.accent, fontSize: 10, letterSpacing: "0.2em" }}>
            ● {lang.toUpperCase()}
          </span>
          <span style={{ color: T.textMuted, fontSize: 10 }}>
            {code.split("\n").length} lines · {code.length} chars
          </span>
          <span style={{ color: T.textMuted, fontSize: 10, marginLeft: "auto" }}>
            Code Forge · Tab = 2 spaces
          </span>
        </div>
      )}
    </div>
  );
}
