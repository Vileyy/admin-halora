import { ref, set, update, onValue, get, push } from "firebase/database";
import { database } from "@/lib/firebase";
import {
  Product,
  ProductFormData,
  ProductMedia,
  ProductVariant,
} from "@/types/Inventory";

/**
 * Upload media files to Cloudinary via API route
 */
const uploadMediaFiles = async (files: File[]): Promise<ProductMedia[]> => {
  const uploadPromises = files.map(async (file, index) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const uploadResult = await response.json();

      return {
        id: `media_${Date.now()}_${index}`,
        url: uploadResult.secure_url,
        type: file.type.startsWith("video/")
          ? ("video" as const)
          : ("image" as const),
        order: index,
      };
    } catch (error) {
      console.error(`Failed to upload file ${file.name}:`, error);
      throw new Error(`Không thể tải lên file ${file.name}`);
    }
  });

  return Promise.all(uploadPromises);
};

/**
 * Create a new product
 */
export const createProduct = async (
  formData: ProductFormData
): Promise<string> => {
  try {
    // Upload media files
    const mediaList = await uploadMediaFiles(formData.mediaFiles);

    // Generate product ID
    const productRef = push(ref(database, "inventory"));
    const productId = productRef.key!;

    // Generate variant IDs and add timestamps
    const variants: ProductVariant[] = formData.variants.map(
      (variant, index) => ({
        id: `variant_${productId}_${index}`,
        ...variant,
        createdAt: new Date().toISOString(),
      })
    );

    // Create product data
    const productData: Product = {
      id: productId,
      name: formData.name,
      category: formData.category,
      description: formData.description,
      media: mediaList,
      variants,
      supplier: formData.supplier,
      brandId: formData.brandId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to Firebase
    await set(productRef, productData);

    return productId;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
};

/**
 * Update an existing product
 */
export const updateProduct = async (
  productId: string,
  formData: ProductFormData
): Promise<void> => {
  try {
    const productRef = ref(database, `inventory/${productId}`);

    // Get existing product data
    const snapshot = await get(productRef);
    if (!snapshot.exists()) {
      throw new Error("Product not found");
    }

    const existingProduct = snapshot.val() as Product;

    // Handle media updates
    let mediaList: ProductMedia[] = formData.existingMedia || [];

    // Upload new media files if any
    if (formData.mediaFiles.length > 0) {
      const newMedia = await uploadMediaFiles(formData.mediaFiles);
      mediaList = [...mediaList, ...newMedia];
    }

    // Update variant IDs for new variants
    const variants: ProductVariant[] = formData.variants.map(
      (variant, index) => {
        // Keep existing ID if it exists, otherwise generate new one
        const existingVariant = existingProduct.variants.find(
          (v) => v.name === variant.name && v.price === variant.price
        );

        return {
          id:
            existingVariant?.id ||
            `variant_${productId}_${Date.now()}_${index}`,
          ...variant,
          createdAt: existingVariant?.createdAt || new Date().toISOString(),
        };
      }
    );

    // Update product data
    const updateData = {
      name: formData.name,
      category: formData.category,
      description: formData.description,
      media: mediaList,
      variants,
      supplier: formData.supplier,
      brandId: formData.brandId,
      updatedAt: new Date().toISOString(),
    };

    await update(productRef, updateData);
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

/**
 * Listen to products in real-time
 */
export const listenProducts = (callback: (products: Product[]) => void) => {
  const productsRef = ref(database, "inventory");

  return onValue(productsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }

    const productsArray: Product[] = Object.entries(data).map(
      ([id, value]: [string, unknown]) => ({
        id,
        ...(value as Omit<Product, "id">),
      })
    );

    // Sort by creation date (newest first)
    productsArray.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    callback(productsArray);
  });
};

/**
 * Get a single product
 */
export const getProduct = async (
  productId: string
): Promise<Product | null> => {
  try {
    const productRef = ref(database, `inventory/${productId}`);
    const snapshot = await get(productRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: productId,
      ...snapshot.val(),
    } as Product;
  } catch (error) {
    console.error("Error getting product:", error);
    return null;
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    const productRef = ref(database, `inventory/${productId}`);
    await set(productRef, null);
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};

/**
 * Update stock for a specific variant
 */
export const updateVariantStock = async (
  productId: string,
  variantId: string,
  newStock: number
): Promise<void> => {
  try {
    const productRef = ref(database, `inventory/${productId}`);
    const snapshot = await get(productRef);

    if (!snapshot.exists()) {
      throw new Error("Product not found");
    }

    const product = snapshot.val() as Product;
    const updatedVariants = product.variants.map((variant) =>
      variant.id === variantId ? { ...variant, stockQty: newStock } : variant
    );

    await update(productRef, {
      variants: updatedVariants,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating variant stock:", error);
    throw error;
  }
};

/**
 * Get products with low stock (less than 10 items)
 */
export const getProductsWithLowStock = async (): Promise<
  Array<{
    product: Product;
    variant: ProductVariant;
  }>
> => {
  try {
    const productsRef = ref(database, "inventory");
    const snapshot = await get(productsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const lowStockItems: Array<{
      product: Product;
      variant: ProductVariant;
    }> = [];

    const products = snapshot.val();
    Object.entries(products).forEach(([id, productData]: [string, unknown]) => {
      const product: Product = { id, ...(productData as Omit<Product, "id">) };

      product.variants.forEach((variant) => {
        if (variant.stockQty < 10) {
          lowStockItems.push({ product, variant });
        }
      });
    });

    return lowStockItems;
  } catch (error) {
    console.error("Error getting low stock products:", error);
    return [];
  }
};

/**
 * Search products by name or category
 */
export const searchProducts = async (query: string): Promise<Product[]> => {
  try {
    const productsRef = ref(database, "inventory");
    const snapshot = await get(productsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const products = snapshot.val();
    const searchResults: Product[] = [];

    const lowerQuery = query.toLowerCase();

    Object.entries(products).forEach(([id, productData]: [string, unknown]) => {
      const product: Product = { id, ...(productData as Omit<Product, "id">) };

      if (
        product.name.toLowerCase().includes(lowerQuery) ||
        product.category.toLowerCase().includes(lowerQuery) ||
        product.description.toLowerCase().includes(lowerQuery)
      ) {
        searchResults.push(product);
      }
    });

    return searchResults;
  } catch (error) {
    console.error("Error searching products:", error);
    return [];
  }
};
