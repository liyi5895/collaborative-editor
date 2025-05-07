import { Descendant, Text } from 'slate';
import { CustomElement, CustomText } from '../types';

/**
 * Serialize a Slate document to a string
 */
export const serialize = (nodes: Descendant[]): string => {
  return nodes.map(n => serializeNode(n)).join('\n');
};

/**
 * Serialize a single Slate node to a string
 */
export const serializeNode = (node: Descendant): string => {
  if (Text.isText(node)) {
    let string = node.text;
    if (node.bold) {
      string = `**${string}**`;
    }
    if (node.italic) {
      string = `*${string}*`;
    }
    if (node.underline) {
      string = `__${string}__`;
    }
    if (node.code) {
      string = `\`${string}\``;
    }
    return string;
  }

  const children = node.children.map(n => serializeNode(n)).join('');

  switch ((node as CustomElement).type) {
    case 'heading-one':
      return `# ${children}\n`;
    case 'heading-two':
      return `## ${children}\n`;
    case 'heading-three':
      return `### ${children}\n`;
    case 'bulleted-list':
      return children;
    case 'numbered-list':
      return children;
    case 'list-item':
      return `- ${children}\n`;
    default:
      return `${children}\n`;
  }
};

/**
 * Deserialize a string to a Slate document
 */
export const deserialize = (content: string): Descendant[] => {
  // For simplicity, we'll just create paragraphs
  return content.split('\n').map(line => {
    return {
      type: 'paragraph',
      children: [{ text: line }],
    };
  });
};
