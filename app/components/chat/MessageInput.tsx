"use client";

import React from "react";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  placeholder?: string;
  inputRef: React.RefObject<HTMLInputElement>;
}

export function MessageInput({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  placeholder = "Type a message...",
  inputRef,
}: MessageInputProps) {
  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={isSubmitting}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-lime-500 disabled:bg-gray-100"
      />
      <button
        type="submit"
        disabled={isSubmitting || !value.trim()}
        className="p-2 bg-lime-600 text-white rounded-full hover:bg-lime-700 disabled:bg-gray-400 transition"
      >
        📤
      </button>
    </form>
  );
}
