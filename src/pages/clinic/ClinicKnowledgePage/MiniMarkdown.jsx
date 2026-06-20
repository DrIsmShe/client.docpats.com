// client/src/pages/clinic/ClinicKnowledgePage/MiniMarkdown.jsx
//
// Tiny dependency-free Markdown renderer for knowledge-base articles.
// Supports: # / ## / ### headings, - and * bullet lists, 1. ordered lists,
// **bold**, *italic*, `inline code`, ``` fenced code blocks ```, > blockquote,
// --- horizontal rule, [text](url) links, and blank-line paragraphs.
//
// This is intentionally minimal — enough for protocols / SOPs — and escapes
// all HTML so article bodies can never inject markup.

import React from "react";

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Inline formatting on an already HTML-escaped string.
function renderInline(text) {
  let out = text;
  // links [label](url) — only http/https/mailto for safety
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,
    (m, label, url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`,
  );
  // inline code
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  // bold
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // italic (single * not part of **)
  out = out.replace(/(^|[^*])\*([^*]+)\*($|[^*])/g, "$1<em>$2</em>$3");
  return out;
}

export default function MiniMarkdown({ source = "" }) {
  const html = React.useMemo(() => {
    const lines = escapeHtml(source).split(/\r?\n/);
    const blocks = [];
    let i = 0;
    let listBuf = null; // { type: 'ul'|'ol', items: [] }
    let paraBuf = [];

    const flushPara = () => {
      if (paraBuf.length) {
        blocks.push(`<p>${renderInline(paraBuf.join(" "))}</p>`);
        paraBuf = [];
      }
    };
    const flushList = () => {
      if (listBuf) {
        const inner = listBuf.items
          .map((it) => `<li>${renderInline(it)}</li>`)
          .join("");
        blocks.push(`<${listBuf.type}>${inner}</${listBuf.type}>`);
        listBuf = null;
      }
    };

    while (i < lines.length) {
      const line = lines[i];

      // fenced code block
      if (/^```/.test(line.trim())) {
        flushPara();
        flushList();
        const code = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i].trim())) {
          code.push(lines[i]);
          i++;
        }
        i++; // skip closing ```
        blocks.push(`<pre><code>${code.join("\n")}</code></pre>`);
        continue;
      }

      // horizontal rule
      if (/^---+\s*$/.test(line.trim())) {
        flushPara();
        flushList();
        blocks.push("<hr/>");
        i++;
        continue;
      }

      // headings
      const h = line.match(/^(#{1,3})\s+(.*)$/);
      if (h) {
        flushPara();
        flushList();
        const level = h[1].length;
        blocks.push(`<h${level}>${renderInline(h[2])}</h${level}>`);
        i++;
        continue;
      }

      // blockquote
      const bq = line.match(/^>\s?(.*)$/);
      if (bq) {
        flushPara();
        flushList();
        blocks.push(`<blockquote>${renderInline(bq[1])}</blockquote>`);
        i++;
        continue;
      }

      // unordered list
      const ul = line.match(/^[-*]\s+(.*)$/);
      if (ul) {
        flushPara();
        if (!listBuf || listBuf.type !== "ul") {
          flushList();
          listBuf = { type: "ul", items: [] };
        }
        listBuf.items.push(ul[1]);
        i++;
        continue;
      }

      // ordered list
      const ol = line.match(/^\d+\.\s+(.*)$/);
      if (ol) {
        flushPara();
        if (!listBuf || listBuf.type !== "ol") {
          flushList();
          listBuf = { type: "ol", items: [] };
        }
        listBuf.items.push(ol[1]);
        i++;
        continue;
      }

      // blank line → paragraph break
      if (line.trim() === "") {
        flushPara();
        flushList();
        i++;
        continue;
      }

      // plain text accumulates into a paragraph
      flushList();
      paraBuf.push(line.trim());
      i++;
    }
    flushPara();
    flushList();
    return blocks.join("\n");
  }, [source]);

  return (
    <div
      className="kb-markdown"
      // Content is fully HTML-escaped above; only our own safe tags are added.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
