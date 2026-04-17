import { readFileSync } from 'fs';
import Handlebars from 'handlebars';
import { marked } from 'marked';

Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('toFixed2', function (value) {
  if (value === null || value === undefined || value === '') {
    return '0';
  }

  let str = String(value).trim();

  const num = Number(str);

  if (Number.isNaN(num)) {
    return '0';
  }

  if (str.startsWith('.')) {
    str = '0' + str;
  }

  if (!str.includes('.')) {
    return str;
  }

  let [intPart, decPart] = str.split('.');

  if (intPart === '') {
    intPart = '0';
  }

  decPart = (decPart + '00').slice(0, 2);

  return `${intPart}.${decPart}`;
});

Handlebars.registerHelper('default', function (value) {
  if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0) || typeof value === 'object') {
    return '-';
  }
  return value;
});

Handlebars.registerHelper('formatStatus', function (status) {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
});

Handlebars.registerHelper('trackColor', function (score) {
  if (score === null || score === undefined || score === '') {
    return '#DC29552E';
  }

  if (score >= 80) return '#3FA98B33';
  if (score >= 60) return '#FABE1724';
  if (score >= 40) return '#F25D4B69';
  return '#DC29552E';
});

Handlebars.registerHelper('fillColor', function (score) {
  if (score === null || score === undefined || score === '') {
    return '#DC2955';
  }
  if (score >= 80) return '#3FA98B';
  if (score >= 60) return '#FABE17';
  if (score >= 40) return '#F25D4B';
  return '#DC2955';
});

Handlebars.registerHelper('statusDisplay', function (status, showAll) {
  if (status === 'in_progress') {
    return new Handlebars.SafeString(`<span style="color:#f59e1a;">In-progress</span>`);
  }

  if (status === 'completed') {
    return new Handlebars.SafeString(`<span style="color:#10b981;">Completed</span>`);
  }

  if (showAll) {
    return new Handlebars.SafeString(`
    <span style="color:#f59e1a;">In-progress</span>
    <span style="color:#98a2b3;"> / </span>
    <span style="color:#10b981;">Completed</span>
  `);
  }

  return new Handlebars.SafeString(`
    <span style="color:#000000;">All</span>
  `);
});

Handlebars.registerHelper('mdToText', function (text) {
  if (!text) return '';

  return (
    text
      // headers ### Title
      .replace(/^#{1,6}\s+/gm, '')
      // bold **text** or __text__
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      // italic *text* or _text_
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      // inline code `code`
      .replace(/`([^`]+)`/g, '$1')
      // links [text](url)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // images ![alt](url)
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      // blockquotes >
      .replace(/^>\s+/gm, '')
      // lists -, *, +
      .replace(/^[\s]*[-*+]\s+/gm, '')
      // numbered lists 1.
      .replace(/^\d+\.\s+/gm, '')
      // horizontal rules
      .replace(/---|___|\*\*\*/g, '')
      // extra newlines
      .replace(/\n+/g, ' ')
      .trim()
  );
});

Handlebars.registerHelper('parseMd', function (text) {
  if (!text) return '';
  return marked.parse(text);
});

Handlebars.registerHelper('or', (a, b) => a || b);

Handlebars.registerHelper('defaultNumber', function (score) {
  if (score === null || score === undefined || score === '' || isNaN(Number(score))) {
    return '0';
  }
  return score;
});

Handlebars.registerHelper('toPercent', function (score) {
  if (score === null || score === undefined || score === '' || isNaN(Number(score))) {
    return '0%';
  }
  return `${score}%`;
});

export async function compileHbsTemplate(options: { templatePath?: string; context?: Record<string, any> }) {
  try {
    if (!options.templatePath) return undefined;

    const templateSource = readFileSync(options.templatePath, 'utf8');

    const template = Handlebars.compile(templateSource);

    return template(options.context);
  } catch (error) {
    console.log(error);

    return undefined;
  }
}

export function renderTemplateString(template: string, context: Record<string, any> = {}): string {
  try {
    if (!template) return '';

    return Handlebars.compile(template)(context);
  } catch (error) {
    return '';
  }
}
