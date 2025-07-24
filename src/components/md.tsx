import React, { ReactElement } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";

const ALERT_LABELS: Record<string, string> = {
  NOTE: 'Notitie', // Translate here
  TIP: 'Tip',
  IMPORTANT: 'Belangrijk',
  WARNING: 'Waarschuwing',
  CAUTION: 'Wees voorzichtig!',
};

const ALERT_MAP: Record<string, { color: string; icon: string }> = {
  NOTE: { color: '#3b82f6', icon: 'ℹ️' },
  TIP: { color: '#22c55e', icon: '💡' },
  IMPORTANT: { color: '#a21caf', icon: '💬' },
  WARNING: { color: '#f59e42', icon: '⚠️' },
  CAUTION: { color: '#ef4444', icon: '⛔' },
};

interface GfmAlertProps {
  type: string;
  children: React.ReactNode;
}

function GfmAlert({ type, children }: GfmAlertProps) {
  const alert = ALERT_MAP[type] || ALERT_MAP.NOTE;
  const label = ALERT_LABELS[type] || ALERT_LABELS.NOTE;
  return (
    <div
      className="my-4 flex flex-col rounded-lg border-l-4 px-4 py-2"
      style={{ borderColor: alert.color, background: 'rgba(24,26,32,0.7)' }}
    >
      <div className="flex items-center gap-2 font-semibold" style={{ color: alert.color }}>
        <span>{alert.icon}</span>
        <span>{label}</span>
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize, rehypeHighlight]}
        components={{
          blockquote({ children }) {
            // Recursively extract text from children
            function extractText(child: any): string {
              if (typeof child === 'string') return child;
              if (Array.isArray(child)) return child.map(extractText).join(' ');
              if (child && child.props && child.props.children) return extractText(child.props.children);
              return '';
            }
            const arr = React.Children.toArray(children);
            const fullText = arr.map(extractText).join(' ').trim();
            const alertMatch = fullText.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](.*)$/s);
            if (alertMatch) {
              const type = alertMatch[1].toUpperCase();
              const content = fullText.replace(/^\[!.*?\]/, '').trim();
              return <GfmAlert type={type}>{content}</GfmAlert>;
            }
            return <blockquote>{children}</blockquote>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;