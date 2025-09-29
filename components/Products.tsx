import React, { useState, useMemo } from 'react';
import { Product, Purchase } from '../types';
import Modal from './Modal';
import { PlusIcon, EditIcon, TrashIcon } from './icons/Icons';
import ProductForm from './ProductForm';

interface ProductsProps {
  products: Product[];
  purchases: Purchase[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

const Products = ({ products, purchases, onAddProduct, onUpdateProduct, onDeleteProduct }: ProductsProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSaveProduct = (product: Omit<Product, 'id'> | Product) => {
    if ('id' in product) {
      onUpdateProduct(product);
    } else {
      onAddProduct(product);
    }
    closeModal();
  }
  
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingProduct(null);
    setIsModalOpen(false);
  };
  
  const handleDeleteClick = (product: Product) => {
    if (window.confirm(`Are you sure you want to delete ${product.name}? This cannot be undone.`)) {
      onDeleteProduct(product.id);
    }
  };
  
  const handleViewHistory = (product: Product) => {
    setHistoryProduct(product);
  };
  
  const closeHistoryModal = () => {
    setHistoryProduct(null);
  };

  const purchaseHistory = useMemo(() => {
    if (!historyProduct) return [];

    const history = purchases.flatMap(purchase => {
      const relevantItem = purchase.items.find(item => item.productId === historyProduct.id);
      if (relevantItem) {
        return [{
          purchaseId: purchase.id,
          date: purchase.date,
          supplierName: purchase.supplierName,
          quantity: relevantItem.quantity,
          cost: relevantItem.cost,
          total: relevantItem.total,
        }];
      }
      return [];
    });
    
    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [historyProduct, purchases]);


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
        <h2 className="text-3xl font-bold text-black">Products</h2>
        <button
          onClick={openAddModal}
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
          <table className="w-full text-sm text-left responsive-table">
            <thead className="text-xs text-black uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Name</th>
                <th scope="col" className="px-6 py-3">Manufacturer</th>
                <th scope="col" className="px-6 py-3">Batch No.</th>
                <th scope="col" className="px-6 py-3">Shelf</th>
                <th scope="col" className="px-6 py-3">Expiry Date</th>
                <th scope="col" className="px-6 py-3 text-right">Stock</th>
                <th scope="col" className="px-6 py-3 text-right">MRP</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                  <td data-label="Name" className="px-6 py-4 font-medium text-black whitespace-nowrap">
                    <button 
                      onClick={() => handleViewHistory(product)}
                      className="font-medium text-black hover:underline text-left"
                    >
                      {product.name}
                    </button>
                  </td>
                  <td data-label="Manufacturer" className="px-6 py-4">{product.manufacturer}</td>
                  <td data-label="Batch No." className="px-6 py-4">{product.batchNo}</td>
                  <td data-label="Shelf" className="px-6 py-4">{product.shelfLocation}</td>
                  <td data-label="Expiry" className="px-6 py-4">{product.expiryDate}</td>
                  <td data-label="Stock" className={`px-6 py-4 font-bold text-right text-black`}>
                    {product.stock}
                  </td>
                  <td data-label="MRP" className="px-6 py-4 font-semibold text-black text-right">₹{product.mrp.toFixed(2)}</td>
                  <td data-label="Actions" className="px-6 py-4">
                    <div className="flex items-center justify-end gap-4">
                      <button onClick={() => openEditModal(product)} className="text-black hover:text-black">
                        <EditIcon />
                      </button>
                      <button onClick={() => handleDeleteClick(product)} className="text-black hover:text-black">
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <Modal title={editingProduct ? "Edit Product" : "Add New Product"} onClose={closeModal}>
          <ProductForm onSave={handleSaveProduct} onCancel={closeModal} productToEdit={editingProduct || undefined} />
        </Modal>
      )}

      {historyProduct && (
        <Modal title={`Purchase History for ${historyProduct.name}`} onClose={closeHistoryModal} size="lg">
           <div className="space-y-4">
            {purchaseHistory.length > 0 ? (
              <div className="overflow-y-auto max-h-[60vh]">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-black uppercase bg-gray-100 sticky top-0">
                    <tr>
                      <th scope="col" className="px-4 py-2">Date</th>
                      <th scope="col" className="px-4 py-2">Supplier</th>
                      <th scope="col" className="px-4 py-2 text-right">Qty</th>
                      <th scope="col" className="px-4 py-2 text-right">Unit Cost</th>
                      <th scope="col" className="px-4 py-2 text-right">Total</th>
                       <th scope="col" className="px-4 py-2">Purchase ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseHistory.map(record => (
                      <tr key={record.purchaseId} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{new Date(record.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2">{record.supplierName}</td>
                        <td className="px-4 py-2 text-right">{record.quantity}</td>
                        <td className="px-4 py-2 text-right">₹{record.cost.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right font-semibold">₹{record.total.toFixed(2)}</td>
                        <td className="px-4 py-2">{record.purchaseId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-black text-center py-4">No purchase history found for this product.</p>
            )}
            <div className="flex justify-end pt-4 border-t">
              <button onClick={closeHistoryModal} className="px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Products;