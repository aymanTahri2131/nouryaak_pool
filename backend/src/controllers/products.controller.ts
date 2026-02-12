// ============================================
// Products Controller (read-only, synced from Aronium)
// ============================================

import { Request, Response } from 'express';
import { asyncHandler, ApiError } from '../middleware/error.middleware.js';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';

// GET /api/products
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId, available } = req.query;

  const query: any = {};

  if (categoryId) {
    query.categoryId = categoryId;
  }

  if (available === 'true') {
    query.isAvailable = true;
  }

  const products = await Product.find(query)
    .populate('categoryId', 'name')
    .sort({ name: 1 });

  res.json({
    success: true,
    data: { products },
  });
});

// GET /api/products/available
export const getAvailableProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await Product.findAvailable();

  res.json({
    success: true,
    data: { products },
  });
});

// GET /api/products/:id
export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id).populate('categoryId');

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  res.json({
    success: true,
    data: { product },
  });
});

// GET /api/categories
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await Category.find().sort({ order: 1, name: 1 });

  res.json({
    success: true,
    data: { categories },
  });
});

// GET /api/categories/:id
export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  // Get products in this category
  const products = await Product.find({ categoryId: category._id, isAvailable: true });

  res.json({
    success: true,
    data: { category, products },
  });
});

// PATCH /api/products/:id/availability (toggle availability locally)
export const toggleAvailability = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  product.isAvailable = !product.isAvailable;
  await product.save();

  res.json({
    success: true,
    data: { product },
    message: `Product is now ${product.isAvailable ? 'available' : 'unavailable'}`,
  });
});



// POST /api/products
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const { nameEn, nameFr, price, categoryId, description, hasSugar, options } = req.body;
  const product = new Product({
    name: nameEn || nameFr || 'Untitled Product',
    nameEn,
    nameFr: nameFr || nameEn, // Fallback
    price,
    categoryId,
    description,
    isAvailable: true,
    hasSugar: hasSugar || false,
    options: options || [],
  });
  await product.save();
  res.status(201).json({ success: true, data: { product } });
});

// PUT /api/products/:id
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, data: { product } });
});

// DELETE /api/products/:id
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, message: 'Product deleted' });
});

// POST /api/products/categories
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { nameEn, nameFr, description } = req.body;
  // Simple order logic: put at end
  const count = await Category.countDocuments();
  const category = new Category({
    name: nameEn || nameFr || 'Untitled Category',
    nameEn,
    nameFr: nameFr || nameEn,
    description,
    order: count + 1,
  });
  await category.save();
  res.status(201).json({ success: true, data: { category } });
});

// PUT /api/products/categories/:id
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, data: { category } });
});

// DELETE /api/products/categories/:id
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  // Optional: Checking if products exist in category before delete?
  // For now, let's keep it simple.
  res.json({ success: true, message: 'Category deleted' });
});
