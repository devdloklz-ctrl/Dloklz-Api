// controllers/productController.js
import Product from "../models/Product.js";
import wooClient from "../utils/wooClient.js";

/**
 * @desc Sync all WooCommerce products into MongoDB
 * @route GET /api/products/sync
 */
export const syncProducts = async (req, res) => {
  try {
    console.log("🔄 Syncing products from WooCommerce...");

    // 1️⃣ Fetch all products from WooCommerce
    const { data: wooProducts } = await wooClient.get("/products", {
      params: { per_page: 100 },
    });

    if (!Array.isArray(wooProducts) || wooProducts.length === 0) {
      return res.status(404).json({ message: "No products found in WooCommerce" });
    }

    let createdCount = 0;
    let updatedCount = 0;

    // 2️⃣ Upsert each product into MongoDB
    await Promise.all(
      wooProducts.map(async (p) => {
        if (!p.id) {
          console.warn("⚠️ Skipping product with no WooCommerce ID:", p);
          return;
        }

        const result = await Product.findOneAndUpdate(
          { wooId: p.id }, // match by unique Woo ID
          {
            wooId: p.id,
            name: p.name,
            slug: p.slug,
            permalink: p.permalink,
            description: p.description,
            short_description: p.short_description,
            sku: p.sku,
            price: p.price,
            regular_price: p.regular_price,
            sale_price: p.sale_price,
            on_sale: p.on_sale,
            stock_quantity: p.stock_quantity,
            stock_status: p.stock_status,
            manage_stock: p.manage_stock,
            total_sales: p.total_sales,
            status: p.status,
            type: p.type,
            featured: p.featured,
            purchasable: p.purchasable,
            categories: p.categories,
            tags: p.tags,
            images: p.images,
            store: p.store,
            meta_data: p.meta_data,
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        if (result.isNew) createdCount++;
        else updatedCount++;
      })
    );

    // 3️⃣ Return summary
    res.json({
      message: "✅ Products synced successfully",
      total: wooProducts.length,
      created: createdCount,
      updated: updatedCount,
    });
  } catch (err) {
    console.error("❌ Sync Error:", err.response?.data || err.message);
    res.status(500).json({
      message: "Failed to sync products",
      error: err.response?.data || err.message,
    });
  }
};

/**
 * @desc Get all products from MongoDB
 * @route GET /api/products
 */
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error("❌ Get Products Error:", err.message);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

/**
 * @desc Create new product (Frontend → WooCommerce → MongoDB)
 * @route POST /api/products
 */
export const createProduct = async (req, res) => {
  try {
    const productData = req.body;

    // 1️⃣ Create product in WooCommerce
    const { data } = await wooClient.post("/products", {
      name: productData.name,
      type: "simple",
      regular_price: productData.price,
      description: productData.description,
      short_description: productData.short_description,
      categories: productData.categories || [],
      tags: productData.tags || [],
      images: productData.images || [],
      manage_stock: productData.manage_stock || false,
      stock_quantity: productData.stock_quantity || null,
      status: "publish",
    });

    // 2️⃣ Store in MongoDB
    const product = await Product.create({
      wooId: data.id,
      name: data.name,
      slug: data.slug,
      permalink: data.permalink,
      description: data.description,
      short_description: data.short_description,
      sku: data.sku,
      price: data.price,
      regular_price: data.regular_price,
      sale_price: data.sale_price,
      on_sale: data.on_sale,
      stock_quantity: data.stock_quantity,
      stock_status: data.stock_status,
      manage_stock: data.manage_stock,
      total_sales: data.total_sales,
      status: data.status,
      type: data.type,
      featured: data.featured,
      purchasable: data.purchasable,
      categories: data.categories,
      tags: data.tags,
      images: data.images,
      store: data.store,
      meta_data: data.meta_data,
    });

    res.json({ message: "✅ Product created successfully", product });
  } catch (err) {
    console.error("❌ Product Create Error:", err.response?.data || err.message);
    res.status(500).json({ message: "Failed to create product", error: err.message });
  }
};

/**
 * @desc Update product (Frontend → WooCommerce → MongoDB)
 * @route PUT /api/products/:id
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // 1️⃣ Update in WooCommerce
    const { data } = await wooClient.put(`/products/${product.wooId}`, {
      name: updates.name,
      regular_price: updates.price,
      description: updates.description,
      short_description: updates.short_description,
      categories: updates.categories || product.categories,
      tags: updates.tags || product.tags,
      images: updates.images || product.images,
      stock_quantity: updates.stock_quantity,
      status: updates.status || product.status,
    });

    // 2️⃣ Update in MongoDB
    const updated = await Product.findByIdAndUpdate(
      id,
      {
        name: data.name,
        description: data.description,
        price: data.regular_price,
        stock_quantity: data.stock_quantity,
        images: data.images,
        categories: data.categories,
        tags: data.tags,
        status: data.status,
      },
      { new: true }
    );

    res.json({ message: "✅ Product updated successfully", product: updated });
  } catch (err) {
    console.error("❌ Product Update Error:", err.response?.data || err.message);
    res.status(500).json({ message: "Failed to update product", error: err.message });
  }
};

/**
 * @desc Delete product from WooCommerce and MongoDB
 * @route DELETE /api/products/:id
 */
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // 1️⃣ Delete from WooCommerce
    await wooClient.delete(`/products/${product.wooId}`, { params: { force: true } });

    // 2️⃣ Delete from MongoDB
    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: "🗑️ Product deleted successfully" });
  } catch (err) {
    console.error("❌ Product Delete Error:", err.response?.data || err.message);
    res.status(500).json({ message: "Failed to delete product", error: err.message });
  }
};
