// ============================================
// Products API
// ============================================

import { fetchWithAuth, handleResponse } from './client';
import { mapProduct, mapCategory } from './mappers';
import type { Product, Category } from '@/types';

export const productsApi = {
  async getProducts(categoryId?: string): Promise<Product[]> {
    const params = categoryId ? `?categoryId=${categoryId}` : '';
    const response = await fetchWithAuth(`/products${params}`);
    const data = await handleResponse<{ data: { products: Record<string, unknown>[] } }>(response);
    return (data.data.products || []).map(mapProduct);
  },

  async getAvailableProducts(): Promise<Product[]> {
    const response = await fetchWithAuth('/products/available');
    const data = await handleResponse<{ data: { products: Record<string, unknown>[] } }>(response);
    return (data.data.products || []).map(mapProduct);
  },

  async getCategories(): Promise<Category[]> {
    const response = await fetchWithAuth('/products/categories');
    const data = await handleResponse<{ data: { categories: Record<string, unknown>[] } }>(response);
    return (data.data.categories || []).map(mapCategory);
  },

  async getProductById(id: string): Promise<Product> {
    const response = await fetchWithAuth(`/products/${id}`);
    const data = await handleResponse<{ data: { product: Record<string, unknown> } }>(response);
    return mapProduct(data.data.product);
  },

  async toggleAvailability(id: string): Promise<Product> {
    const response = await fetchWithAuth(`/products/${id}/availability`, {
      method: 'PATCH',
    });
    const data = await handleResponse<{ data: { product: Record<string, unknown> } }>(response);
    return mapProduct(data.data.product);
  },

  // Category Management
  async createCategory(data: Partial<Category>): Promise<Category> {
    const response = await fetchWithAuth('/products/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await handleResponse<{ data: { category: Record<string, unknown> } }>(response);
    return mapCategory(result.data.category);
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const response = await fetchWithAuth(`/products/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const result = await handleResponse<{ data: { category: Record<string, unknown> } }>(response);
    return mapCategory(result.data.category);
  },

  async deleteCategory(id: string): Promise<void> {
    const response = await fetchWithAuth(`/products/categories/${id}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },

  // Product Management
  async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await fetchWithAuth('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await handleResponse<{ data: { product: Record<string, unknown> } }>(response);
    return mapProduct(result.data.product);
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const response = await fetchWithAuth(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const result = await handleResponse<{ data: { product: Record<string, unknown> } }>(response);
    return mapProduct(result.data.product);
  },

  async deleteProduct(id: string): Promise<void> {
    const response = await fetchWithAuth(`/products/${id}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },
};
