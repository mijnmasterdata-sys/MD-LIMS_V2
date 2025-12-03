import React from 'react';
import Button from './Button';
import { Product } from '../types';

interface ProductListViewProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
  onCreateProduct: () => void;
  onDeleteProduct: (id: string) => void;
}

const ProductListView: React.FC<ProductListViewProps> = ({ products, onEditProduct, onCreateProduct, onDeleteProduct }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Products</h2>
          <p className="text-gray-400 text-sm">Manage product specifications and versions.</p>
        </div>
        <Button onClick={onCreateProduct} variant="primary">+ Create Product</Button>
      </div>

      <div className="overflow-hidden border border-gray-700 rounded-lg shadow-lg bg-gray-800">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Product Code</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Product Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Version</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Material Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Effective Date</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 bg-gray-800">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-750 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-400">{product.productCode}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{product.productName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300"><span className="bg-gray-700 px-2 py-0.5 rounded text-xs">v{product.version}</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{product.materialType}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{product.effectiveDate || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button 
                    onClick={() => onEditProduct(product)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => onDeleteProduct(product.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No products found. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductListView;