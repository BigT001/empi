import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";

export const revalidate = 60; // ISR: regenerate page every 60 seconds

const prisma = new PrismaClient();

export default async function ProductPage({ params }: { params: { id: string } }) {
  const id = params.id;

  const productRaw = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      sellPrice: true,
      rentPrice: true,
      category: true,
      badge: true,
      image: true,
      images: true,
      sizes: true,
      color: true,
      material: true,
      condition: true,
      careInstructions: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!productRaw) return notFound();

  const allProductsRaw = await prisma.product.findMany({
    where: { category: productRaw.category },
    orderBy: { createdAt: 'desc' },
    take: 12,
    select: {
      id: true,
      name: true,
      sellPrice: true,
      rentPrice: true,
      image: true,
      images: true,
      badge: true,
      category: true,
    },
  });

  // Serialize dates and ensure arrays are defined for client
  const product = {
    ...productRaw,
    createdAt: productRaw.createdAt?.toISOString(),
    updatedAt: productRaw.updatedAt?.toISOString(),
    images: productRaw.images ?? [],
  };

  const allProducts = allProductsRaw.map((p) => ({ ...p, images: p.images ?? [] }));

  return <ProductDetailClient product={product} allProducts={allProducts} />;
}
