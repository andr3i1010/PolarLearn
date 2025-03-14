import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";

interface MarkdownRendererProps {
  content: string;
}

import type { Components } from 'react-markdown';

interface CodeComponentProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

const components: Components = {
  code: ({ node, inline, className, children, ...props }: CodeComponentProps) => {
    const match = /language-(\w+)/.exec(className || "");
    return !inline && match ? (
      <pre className={className ? `mb-4 language-${match[1]}` : "mb-4"}>
        <code {...props} className={className}>
          {children}
        </code>
      </pre>
    ) : (
      <code {...props} className={className}>
        {children}
      </code>
    );
  },
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 {...props} className="text-4xl font-bold my-4" />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 {...props} className="text-3xl font-bold my-3" />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 {...props} className="text-2xl font-semibold my-2" />
  ),
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <table {...props} className="table-auto w-full my-4" />
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th {...props} className="border px-4 py-2" />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td {...props} className="border px-4 py-2" />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul {...props} className="list-disc ml-5 my-2" />
  ),
  ol: (props: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol {...props} className="list-decimal ml-5 my-2" />
  ),
  li: (props: React.LiHTMLAttributes<HTMLLIElement>) => (
    <li {...props} className="my-1" />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props} target="_blank" className="text-blue-500 hover:underline" />
  ),
  img: ({ src, alt, ...props }) => (
    <img
      src={src}
      alt={alt || ""}
      style={{ maxWidth: "100%", maxHeight: "400px", height: "auto" }}
      {...props}
    />
  ),
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        components={components}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize, rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
