import { Descendant, Text } from 'slate';
// Import from the correct path
import { CustomElement, CustomText } from '../types';

/**
 * Serialize a Slate document to a string
 */
export const serialize = (nodes: Descendant[]): string => {
  return nodes.map(n => serializeNode(n)).join('\n');
};

/**
 * Serialize a Slate document to a string with block IDs
 * This helps maintain consistent block indexing between frontend and backend
 */
export const serializeWithBlockIds = (nodes: Descendant[]): string => {
  return nodes.map((node, index) => {
    // Use the existing blockId from CustomElement or fallback to index
    const blockId = (node as CustomElement).blockId ?? index;
    return `[BLOCK:${blockId}]${serializeNode(node)}`;
  }).join('\n');
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
  const lines = content.split('\n');
  
  // If empty document, return single block
  if (lines.length === 0 || (lines.length === 1 && lines[0].trim() === '')) {
    return [{
      type: 'paragraph',
      children: [{ text: '' }],
      blockId: 0
    }];
  }
  
  // Process lines and preserve block structure
  return lines.map((line, index) => {
    const match = line.match(/^\[BLOCK:(\d+)\](.*)/);
    const content = match ? match[2] : line;
    const blockId = match ? parseInt(match[1]) : index;
    
    return {
      type: 'paragraph',
      children: [{ text: content }],
      blockId
    };
  });
};
