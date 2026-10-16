import type { ReactNode } from 'react';
import Image from '@/app/components/MediaImage';
import type { RichNode } from '@/app/lib/cms-types';

export function RichContent({ document, privateMedia = false }: { document: RichNode; privateMedia?: boolean }) {
  function render(node: RichNode, key: string, headerRow = false): ReactNode {
    const children = (node.content ?? []).map((child, index) => render(child, `${key}-${index}`, headerRow));
    if (node.type === 'text') {
      let text: ReactNode = node.text ?? '';
      for (const mark of node.marks ?? []) {
        if (mark.type === 'bold') text = <strong key={key}>{text}</strong>;
        else if (mark.type === 'italic') text = <em key={key}>{text}</em>;
        else if (mark.type === 'strike') text = <s key={key}>{text}</s>;
        else if (mark.type === 'underline') text = <u key={key}>{text}</u>;
        else if (mark.type === 'code') text = <code key={key}>{text}</code>;
        else if (
          mark.type === 'link' &&
          typeof mark.attrs?.href === 'string' &&
          /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(mark.attrs.href)
        )
          text = (
            <a key={key} href={mark.attrs.href} rel="noopener noreferrer">
              {text}
            </a>
          );
      }
      return <span key={key}>{text}</span>;
    }
    switch (node.type) {
      case 'doc':
        return (
          <div key={key} className="rich-content">
            {children}
          </div>
        );
      case 'paragraph':
        return <p key={key}>{children}</p>;
      case 'heading':
        return node.attrs?.level === 3 ? (
          <h3 key={key}>{children}</h3>
        ) : node.attrs?.level === 4 ? (
          <h4 key={key}>{children}</h4>
        ) : (
          <h2 key={key}>{children}</h2>
        );
      case 'bulletList':
        return <ul key={key}>{children}</ul>;
      case 'orderedList':
        return (
          <ol
            key={key}
            start={
              typeof node.attrs?.start === 'number' && Number.isSafeInteger(node.attrs.start)
                ? node.attrs.start
                : undefined
            }
          >
            {children}
          </ol>
        );
      case 'listItem':
        return <li key={key}>{children}</li>;
      case 'blockquote':
        return <blockquote key={key}>{children}</blockquote>;
      case 'hardBreak':
        return <br key={key} />;
      case 'horizontalRule':
        return <hr key={key} />;
      case 'image': {
        const id = String(node.attrs?.mediaId ?? '');
        if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
        const width = typeof node.attrs?.width === 'number' ? Math.min(2400, Math.max(1, node.attrs.width)) : 1200;
        return (
          <Image
            key={key}
            src={privateMedia ? `/api/admin/cms/media/${id}/file` : `/media/${id}`}
            alt={String(node.attrs?.alt ?? '')}
            width={width}
            sizes={`(max-width: 760px) 90vw, ${width}px`}
            height={800}
            style={{ width, maxWidth: '100%', height: 'auto', borderRadius: 16 }}
          />
        );
      }
      case 'table': {
        const rows = node.content ?? [];
        // Only promote an unambiguous, non-spanning first header row.
        const first = rows[0];
        const hasHeader =
          first?.type === 'tableRow' &&
          !!first.content?.length &&
          first.content.every(
            (cell) => cell.type === 'tableHeader' && (!cell.attrs?.rowspan || cell.attrs.rowspan === 1),
          );
        return (
          <div key={key} className="rich-table">
            <table>
              {hasHeader && <thead>{render(first, `${key}-head`, true)}</thead>}
              <tbody>{rows.slice(hasHeader ? 1 : 0).map((row, index) => render(row, `${key}-row-${index}`))}</tbody>
            </table>
          </div>
        );
      }
      case 'tableRow':
        return <tr key={key}>{children}</tr>;
      case 'tableCell':
        return (
          <td
            key={key}
            colSpan={typeof node.attrs?.colspan === 'number' ? node.attrs.colspan : undefined}
            rowSpan={typeof node.attrs?.rowspan === 'number' ? node.attrs.rowspan : undefined}
          >
            {children}
          </td>
        );
      case 'tableHeader':
        return (
          <th
            key={key}
            scope={headerRow && (!node.attrs?.colspan || node.attrs.colspan === 1) ? 'col' : undefined}
            colSpan={typeof node.attrs?.colspan === 'number' ? node.attrs.colspan : undefined}
            rowSpan={typeof node.attrs?.rowspan === 'number' ? node.attrs.rowspan : undefined}
          >
            {children}
          </th>
        );
      default:
        return null;
    }
  }
  return render(document, 'document');
}
