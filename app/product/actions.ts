"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteProduct(productId: string) {
  try {
    console.log("🗑️ Server action: Deleting product:", productId);
    
    const product = await prisma.product.delete({
      where: { id: productId },
    });

    console.log("✅ Product deleted successfully:", product.id);
    
    // Immediately revalidate all affected paths
    revalidatePath("/product", "layout");
    revalidatePath("/", "layout");
    
    return { success: true, id: product.id };
  } catch (error: any) {
    console.error("❌ Error deleting product:", error);
    
    // Handle Prisma-specific errors
    if (error.code === "P2025") {
      console.error("❌ Product not found for deletion");
      return { success: false, error: "Product not found or already deleted" };
    }
    
    const errorMessage = error instanceof Error ? error.message : "Failed to delete product";
    return { success: false, error: errorMessage };
  }
}
