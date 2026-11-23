"use client";
import React from "react";
export default function RichText({ text, boldClassName = "font-extrabold" }: { text: string; boldClassName?: string }) {
  if (!text) return null;
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return (<>{parts.map((part, idx) => { if (part.startsWith("**") && part.endsWith("**") && part.length > 4) { return <strong key={idx} className={boldClassName}>{part.slice(2, -2)}</strong>; } return <React.Fragment key={idx}>{part.replace(/\*\*/g, "")}</React.Fragment>; })}</>);
}
