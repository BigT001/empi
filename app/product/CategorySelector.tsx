"use client";

import { Suspense, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CategorySelectorContent({ currentCategory }: { currentCategory: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleCategoryChange = (newCategory: string) => {
    startTransition(() => {
      if (newCategory === "all") {
        router.push("/product");
      } else {
        router.push(`/product?category=${newCategory}`);
      }
    });
  };

  return (
    <div className="hidden md:flex items-center gap-3">
      <select
        value={currentCategory}
        onChange={(e) => handleCategoryChange(e.target.value)}
        disabled={isPending}
        className="border rounded-md px-3 py-2 bg-white cursor-pointer disabled:opacity-50"
      >
        <option value="all">All Categories</option>
        <option value="adults">Adults</option>
        <option value="kids">Kids</option>
      </select>
      {isPending && <span className="text-sm text-gray-500">Loading...</span>}
    </div>
  );
}

interface CategorySelectorProps {
  currentCategory?: string;
}

export function CategorySelector({ currentCategory = "all" }: CategorySelectorProps) {
  return (
    <Suspense fallback={<div className="w-24 h-10 bg-gray-200 rounded-md animate-pulse" />}>
      <CategorySelectorContent currentCategory={currentCategory} />
    </Suspense>
  );
}
