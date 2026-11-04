import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true,
});

const renderToken = md.renderer.rules.link_open;
md.renderer.rules.link_open = (tokens, idx, options, env, renderer) => {
  const token = tokens[idx];
  if (token) {
    token.attrSet('target', '_blank');
    token.attrSet('rel', 'noopener noreferrer');
  }
  return renderToken
    ? renderToken(tokens, idx, options, env, renderer)
    : renderer.renderToken(tokens, idx, options);
};

export function renderMarkdown(source: string): string {
  return md.render(source, {});
}

const countWordsInText = (value: string): number => {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/u).length : 0;
};

/**
 * Counts the words a reader actually sees, skipping markdown punctuation such
 * as list markers, hashes and emphasis delimiters.
 */
export function markdownWordCount(source: string): number {
  if (!source.trim()) return 0;

  let count = 0;
  for (const token of md.parse(source, {})) {
    if (token.type === 'inline' && token.children) {
      for (const child of token.children) {
        if (child.type === 'text' || child.type === 'code_inline') {
          count += countWordsInText(child.content);
        } else if (child.type === 'image') {
          count += countWordsInText(child.content);
        }
      }
    } else if (token.type === 'fence' || token.type === 'code_block') {
      count += countWordsInText(token.content);
    }
  }

  return count;
}
