"use client";

import { useRouter } from "next/navigation";

interface CategoryCardsProps {
  currentCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryCards({ currentCategory, onCategoryChange }: CategoryCardsProps) {
  const router = useRouter();

  const categories = [
    {
      id: "adults",
      label: "Adults",
      icon: "🧥",
      color: "from-blue-600 to-cyan-600",
      lightBg: "from-blue-50 to-cyan-50",
      borderColor: "border-blue-200"
    },
    {
      id: "all",
      label: "Shop",
      icon: "🛍️",
      color: "from-rose-600 to-pink-600",
      lightBg: "from-rose-50 to-pink-50",
      borderColor: "border-rose-200"
    },
    {
      id: "custom",
      label: "Custom",
      icon: "✨",
      color: "from-purple-600 to-indigo-600",
      lightBg: "from-purple-50 to-indigo-50",
      borderColor: "border-purple-200"
    }
  ];

  const handleCategoryClick = (categoryId: string) => {
    onCategoryChange(categoryId);
    let href = "/";
    if (categoryId === "custom") {
      href = "/custom-costumes";
    } else if (categoryId === "all") {
      href = "/shop";
    } else if (categoryId === "adults") {
      href = "/shop?category=adults";
    }
    router.push(href);
  };

  return (
    <div className="md:hidden w-full px-4 py-0 bg-white -mb-2 mt-2">
      <div className="flex gap-2 justify-between items-stretch">
        {categories.map((category) => {
          const isActive = currentCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`flex-1 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 overflow-visible group cursor-pointer relative border-2 ${isActive
                ? `bg-gradient-to-br ${category.color} text-white shadow-lg border-transparent`
                : `bg-gradient-to-br ${category.lightBg} text-gray-800 hover:shadow-md ${category.borderColor}`
                }`}
            >
              <div className="flex flex-row items-center justify-center gap-2 px-3 py-2" style={{ minHeight: "50px" }}>
                <div
                  style={{
                    fontSize: "24px",
                    lineHeight: "1",
                    filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))"
                  }}
                  className="transition-all duration-300 hover:scale-110 group-hover:drop-shadow-lg flex-shrink-0"
                >
                  {category.icon}
                </div>
                <div className="text-center">
                  <p className={`text-xs font-bold leading-tight tracking-wide ${isActive ? "text-white" : "text-gray-800"}`}>
                    {category.label}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
