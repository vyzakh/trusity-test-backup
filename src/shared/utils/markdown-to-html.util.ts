export function markdownToHtml(content: string): string {
  if (!content) return '';

  const lines = content.split('\n');
  const htmlParts: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      htmlParts.push('<br />');
      i++;
      continue;
    }

    if (line.trim().startsWith('```')) {
      const codeLines: string[] = [];
      i++;

      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(escapeHtml(lines[i]));
        i++;
      }

      htmlParts.push(`<pre><code>${codeLines.join('\n')}</code></pre>`);
      i++;
      continue;
    }

    if (line.startsWith('> ')) {
      htmlParts.push(`<blockquote>${parseInline(line.substring(2))}</blockquote>`);
      i++;
      continue;
    }

    if (line.startsWith('# ')) {
      htmlParts.push(`<h1>${escapeHtml(line.substring(2))}</h1>`);
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      htmlParts.push(`<h2>${escapeHtml(line.substring(3))}</h2>`);
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      htmlParts.push(`<h3>${escapeHtml(line.substring(4))}</h3>`);
      i++;
      continue;
    }
    if (line.startsWith('#### ')) {
      htmlParts.push(`<h4>${escapeHtml(line.substring(5))}</h4>`);
      i++;
      continue;
    }

    if (line.trim() === '---') {
      htmlParts.push('<hr />');
      i++;
      continue;
    }

    // Unordered list
    if (/^(\*|-)\s/.test(line)) {
      const listItems: string[] = [];

      while (i < lines.length && /^(\*|-)\s/.test(lines[i])) {
        listItems.push(`<li>${parseInline(lines[i].substring(2))}</li>`);
        i++;
      }

      htmlParts.push(`<ul>${listItems.join('')}</ul>`);
      continue;
    }

    // Ordered list (FIXED VERSION)
    if (/^\d+\.\s/.test(line)) {
      const listItems: string[] = [];
      let startNumber: number | null = null;

      while (i < lines.length) {
        const currentLine = lines[i];

        // Check if this is a numbered line
        if (/^\d+\.\s/.test(currentLine)) {
          // Extract the actual number from the line
          const match = currentLine.match(/^(\d+)\.\s/);
          const itemNumber = match ? parseInt(match[1], 10) : 1;

          // Store the first number as the start value
          if (startNumber === null) {
            startNumber = itemNumber;
          }

          // Start collecting this list item
          let text = currentLine.replace(/^\d+\.\s/, '');

          // Check if "URL:" appears in the same line and split it
          if (text.includes('URL:')) {
            const urlIndex = text.indexOf('URL:');
            const beforeUrl = text.substring(0, urlIndex).trim();
            const urlPart = text.substring(urlIndex).trim();
            const itemParts: string[] = [parseInline(beforeUrl), '<br /><br />' + parseInline(urlPart)];
            text = itemParts.join('');
          } else {
            text = parseInline(text);
          }

          const itemParts: string[] = [text]; // Store parts separately
          i++;

          // Collect continuation lines (indented or URL lines)
          while (i < lines.length) {
            const nextLine = lines[i].trim();

            // If next line is empty, check what comes after
            if (!nextLine) {
              // Look ahead to see if there's more content
              if (i + 1 < lines.length) {
                const lineAfterBlank = lines[i + 1].trim();
                // If next line after blank is numbered, stop here
                if (/^\d+\.\s/.test(lineAfterBlank)) {
                  break;
                }
                // If it's a continuation (URL, indented text), skip blank and continue
                if (lineAfterBlank.startsWith('URL:') || lineAfterBlank.startsWith('http')) {
                  i++; // Skip the blank line
                  continue;
                }
              }
              break;
            }

            // If it's another numbered item, stop
            if (/^\d+\.\s/.test(lines[i])) {
              break;
            }

            // Add continuation line
            const continuationText = lines[i].trim();

            // Check if this line starts with "URL:" - if so, add with double line break
            if (continuationText.startsWith('URL:') || continuationText.startsWith('http://') || continuationText.startsWith('https://')) {
              itemParts.push('<br /><br />' + parseInline(continuationText));
            } else {
              itemParts.push('<br />' + parseInline(continuationText));
            }
            i++;
          }

          // Join all parts together
          const itemContent = itemParts.join('');

          // Add the list item with explicit value attribute to preserve numbering
          listItems.push(`<li value="${itemNumber}">${itemContent}</li>`);
        } else {
          // Not a numbered line, stop collecting
          break;
        }
      }

      // Create ordered list with start attribute if first number isn't 1
      const startAttr = startNumber && startNumber !== 1 ? ` start="${startNumber}"` : '';
      htmlParts.push(`<ol${startAttr}>${listItems.join('')}</ol>`);
      continue;
    }

    // Regular paragraph
    htmlParts.push(`<p>${parseInline(line)}</p>`);
    i++;
  }

  return `<div class="markdown-content">${htmlParts.join('')}</div>`;
}

function parseInline(text: string): string {
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  text = text.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>');

  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Images
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  return text;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
export const formatMarketingPlanToHtml = (text: string): string => {
  if (!text) return '';

  const lines = text.split('\n');
  const htmlParts: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' | null = null;
  let isFirstLine = true; // ✅ Track first line

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      continue;
    }

    // First non-empty line becomes H1
    if (isFirstLine) {
      htmlParts.push(`<h1>${line}</h1>`);
      isFirstLine = false;
      continue;
    }

    // Section headers (ALL CAPS with colon) become H3
    if (/^[A-Z\s]+:$/.test(line)) {
      if (inList) {
        htmlParts.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      htmlParts.push(`<h3>${line.replace(':', '')}</h3>`);
    }
    // Bullet points (•)
    else if (line.startsWith('•')) {
      if (!inList || listType !== 'ul') {
        if (inList) htmlParts.push(`</${listType}>`);
        htmlParts.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      const text = line.substring(1).trim();
      htmlParts.push(`<li>${text}</li>`);
    }
    // Numbered items (1. 2. 3. etc.)
    else if (/^\d+\.\s/.test(line)) {
      if (!inList || listType !== 'ol') {
        if (inList) htmlParts.push(`</${listType}>`);
        htmlParts.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      const text = line.replace(/^\d+\.\s*/, '');
      htmlParts.push(`<li>${text}</li>`);
    }
    // Regular paragraphs
    else {
      if (inList) {
        htmlParts.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      htmlParts.push(`<p>${line}</p>`);
    }
  }

  // Close any open list at the end
  if (inList) {
    htmlParts.push(`</${listType}>`);
  }

  return `<div class="markdown-content">${htmlParts.join('')}</div>`;
};
