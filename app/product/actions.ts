"use server";

import connectDB from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import { revalidatePath } from "next/cache";

export async function deleteProduct(productId: string) {
  try {
    console.log("🗑️ Server action: Deleting product:", productId);
    
    await connectDB();
    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      console.error("❌ Product not found for deletion");
      return { success: false, error: "Product not found or already deleted" };
    }

    console.log("✅ Product deleted successfully:", product._id);
    
    revalidatePath("/product", "layout");
    revalidatePath("/", "layout");
    
    return { success: true, id: product._id };
  } catch (error: any) {
    console.error("❌ Error deleting product:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Failed to delete product";
    return { success: false, error: errorMessage };
  }
}
