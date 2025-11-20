import connectDB from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";
import { serializeDoc, serializeDocs } from "@/lib/serializer";

export const revalidate = 3600; // Cache for 1 hour for better performance

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await connectDB();
    
    const productRaw = await Product.findById(id).lean<any>();

    if (!productRaw) return notFound();

    const allProductsRaw = await Product.find({ category: productRaw.category })
      .sort({ createdAt: -1 })
      .limit(12)
      .lean<any[]>();

    // Serialize MongoDB documents to plain objects
    const product = serializeDoc(productRaw);
    const allProducts = serializeDocs(allProductsRaw);

    return <ProductDetailClient product={product} allProducts={allProducts} />;
  } catch (error) {
    console.error("Error loading product:", error);
    return notFound();
  }
}
