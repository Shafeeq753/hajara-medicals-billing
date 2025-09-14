import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import Modal from './Modal';
import { PlusIcon } from './icons/Icons';
import ProductForm from './ProductForm';

interface ProductsProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
}

const ProductsComponent: React.FC<ProductsProps> = ({ products, onAddProduct }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSaveProduct = (product: Omit<Product, 'id'>) => {
    onAddProduct(product);
    setIsModalOpen(false);
  }

  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      return products;
    }
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-900">Products</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <PlusIcon /> Add Product
        </button>
      </div>

       <div className="bg-white p-2 md:p-6 rounded-xl shadow-lg">
        <div>
          <input
            type="text"
            placeholder="Search by name or manufacturer..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full max-w-sm p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 mb-4"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left responsive-table">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 font-semibold text-gray-800">Name</th>
                <th className="p-3 font-semibold text-gray-800">Manufacturer</th>
                <th className="p-3 font-semibold text-gray-800">Batch No.</th>
                <th className="p-3 font-semibold text-gray-800">Expiry Date</th>
                <th className="p-3 font-semibold text-gray-800 text-right">Stock</th>
                <th className="p-3 font-semibold text-gray-800 text-right">MRP</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id}>
                  <td data-label="Name" className="font-semibold text-gray-900">{product.name}</td>
                  <td data-label="Manufacturer" className="text-gray-900">{product.manufacturer}</td>
                  <td data-label="Batch No." className="text-gray-700">{product.batchNo}</td>
                  <td data-label="Expiry" className="text-gray-700">{product.expiryDate}</td>
                  <td data-label="Stock" className={`font-bold text-right ${product.stock < 50 ? 'text-red-500' : 'text-green-600'}`}>
                    {product.stock}
                  </td>
                  <td data-label="MRP" className="font-semibold text-gray-900 text-right">₹{product.mrp.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <Modal title="Add New Product" onClose={() => setIsModalOpen(false)}>
          <ProductForm onSave={handleSaveProduct} onCancel={() => setIsModalOpen(false)} />
        </Modal>
      )}
    </div>
  );
};

export default ProductsComponent;