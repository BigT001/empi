import { PrismaClient } from "@prisma/client";
import { ProductGrid } from "@/app/components/ProductGrid";
import { CategorySelector } from "./CategorySelector";

export const revalidate = 60; // ISR: regenerate page every 60 seconds

export default async function ProductListPage({ searchParams }: { searchParams?: { category?: string } }) {
  const prisma = new PrismaClient();
  const category = searchParams?.category;

  // Fetch products - NO category filter on server to show all
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      sellPrice: true,
      rentPrice: true,
      image: true,
      images: true,
      badge: true,
      category: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Serialize dates to ISO strings for client safety
  const serializedProducts = products.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="max-w-7xl mx-auto px-6 py-12">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900">Discover Beautiful Costumes</h1>
            <p className="mt-2 text-gray-600 max-w-xl">Handpicked, high-quality costumes — fast to load, delightful to browse.</p>
          </div>
          {/* Use client component for interactive category selector */}
          <CategorySelector currentCategory={category ?? "all"} />
        </header>

        {/* Pass all products, let client-side handle filtering */}
        <ProductGrid 
          currency="NGN" 
          category={category ?? "all"} 
          initialProducts={serializedProducts} 
        />
      </section>
    </main>
  );
}
