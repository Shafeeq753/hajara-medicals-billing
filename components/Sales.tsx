import React, { useState, useMemo, useEffect } from 'react';
import { Customer, Product, Sale, SaleItem } from '../types';
import Modal from './Modal';
import { PlusIcon, TrashIcon } from './icons/Icons';
import CustomerForm from './CustomerForm';

interface SalesProps {
  customers: Customer[];
  products: Product[];
  onAddSale: (sale: Sale) => void;
  onAddCustomer: (customer: Omit<Customer, 'id'>) => void;
}

const Sales: React.FC<SalesProps> = ({ customers, products, onAddSale, onAddCustomer }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [currentItems, setCurrentItems] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  
  const [productSearch, setProductSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  useEffect(() => {
    if (productSearch.length > 1) {
      setFilteredProducts(
        products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) && p.stock > 0)
      );
    } else {
      setFilteredProducts([]);
    }
  }, [productSearch, products]);

  const subtotal = useMemo(() => currentItems.reduce((sum, item) => sum + item.total, 0), [currentItems]);
  const total = useMemo(() => subtotal - discount, [subtotal, discount]);
  const balance = useMemo(() => total - amountPaid, [total, amountPaid]);

  const addProductToSale = (product: Product) => {
    const existingItem = currentItems.find(item => item.productId === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        updateItemQuantity(product.id, existingItem.quantity + 1);
      } else {
        alert("Cannot add more than available stock.");
      }
    } else {
      if (product.stock > 0) {
        const newItem: SaleItem = {
          productId: product.id,
          productName: product.name,
          batchNo: product.batchNo,
          quantity: 1,
          mrp: product.mrp,
          total: product.mrp,
        };
        setCurrentItems([...currentItems, newItem]);
      } else {
        alert("Product is out of stock.");
      }
    }
    setProductSearch('');
    setFilteredProducts([]);
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (product && quantity > product.stock) {
      alert(`Only ${product.stock} items available in stock.`);
      quantity = product.stock;
    }

    if(quantity <= 0) {
        removeItem(productId);
        return;
    }

    setCurrentItems(currentItems.map(item =>
      item.productId === productId ? { ...item, quantity, total: item.mrp * quantity } : item
    ));
  };
  
  const removeItem = (productId: string) => {
    setCurrentItems(currentItems.filter(item => item.productId !== productId));
  };

  const resetForm = () => {
    setSelectedCustomerId(null);
    setCurrentItems([]);
    setDiscount(0);
    setAmountPaid(0);
    setProductSearch('');
  }

  const handleSaveSale = () => {
    if (!selectedCustomerId) {
      alert('Please select a customer.');
      return;
    }
    if (currentItems.length === 0) {
      alert('Please add at least one product.');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) {
        alert('Invalid customer selected.');
        return;
    }

    const newSale: Sale = {
      id: `SALE-${Date.now()}`,
      customerId: selectedCustomerId,
      customerName: customer.name,
      date: new Date().toISOString(),
      items: currentItems,
      subtotal,
      discount,
      total,
      amountPaid,
      balance,
    };
    onAddSale(newSale);
    resetForm();
  };
  
  const handleSaveCustomer = (customer: Omit<Customer, 'id'>) => {
    onAddCustomer(customer);
    setIsCustomerModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">New Sale / Billing</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Bill Details */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <select 
                  value={selectedCustomerId || ''} 
                  onChange={(e) => setSelectedCustomerId(e.target.value)} 
                  className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" disabled>Select a customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                </select>
              </div>
              <div className="self-end">
                <button 
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center justify-center"
                >
                  <PlusIcon /> <span className="ml-2">New</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Product</label>
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Type to search products..."
                className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              {filteredProducts.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                  {filteredProducts.map(p => (
                    <li 
                      key={p.id} 
                      onClick={() => addProductToSale(p)}
                      className="p-2 hover:bg-blue-100 cursor-pointer"
                    >
                      {p.name} (Stock: {p.stock}) - ₹{p.mrp}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left responsive-table">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-2 font-medium text-gray-600">Product</th>
                    <th className="p-2 font-medium text-gray-600 text-center">Qty</th>
                    <th className="p-2 font-medium text-gray-600 text-right">MRP</th>
                    <th className="p-2 font-medium text-gray-600 text-right">Total</th>
                    <th className="p-2 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map(item => (
                    <tr key={item.productId}>
                      <td data-label="Product" className="font-medium text-gray-800">{item.productName}</td>
                      <td data-label="Qty">
                        <input 
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value))}
                          className="w-20 p-1 bg-white border border-gray-300 rounded-md text-center mx-auto md:ml-auto md:mr-0"
                        />
                      </td>
                      <td data-label="MRP" className="text-right">₹{item.mrp.toFixed(2)}</td>
                      <td data-label="Total" className="text-right font-semibold">₹{item.total.toFixed(2)}</td>
                      <td data-label="Action" className="text-right">
                        <button onClick={() => removeItem(item.productId)} className="text-red-500 hover:text-red-700 ml-auto block">
                          <TrashIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>

        {/* Right Side: Summary & Payment */}
        <div className="bg-white p-6 rounded-xl shadow-lg space-y-4 flex flex-col">
            <h3 className="text-xl font-semibold border-b pb-2">Bill Summary</h3>
            <div className="flex justify-between items-center text-md">
              <span className="font-medium text-gray-600">Subtotal:</span>
              <span className="font-medium text-gray-800">₹{subtotal.toFixed(2)}</span>
            </div>
             <div className="flex items-center justify-between">
                <label className="text-md font-medium text-gray-600">Discount (₹):</label>
                <input 
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-28 p-2 bg-white border border-gray-300 rounded-md font-bold text-right"
                />
            </div>
            <div className="border-t my-2"></div>
            <div className="flex justify-between items-center text-2xl">
              <span className="font-bold text-gray-700">Total:</span>
              <span className="font-extrabold text-blue-600">₹{total.toFixed(2)}</span>
            </div>
             <div className="flex items-center justify-between">
                <label className="text-md font-medium text-gray-600">Paid Amount (₹):</label>
                <input 
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  className="w-28 p-2 bg-white border border-gray-300 rounded-md font-bold text-right"
                />
            </div>
            <div className="flex justify-between items-center text-lg mt-2 p-3 rounded-md bg-yellow-100">
              <span className="font-bold text-yellow-800">Balance:</span>
              <span className="font-bold text-yellow-800">₹{balance.toFixed(2)}</span>
            </div>
            <div className="mt-auto pt-4">
              <button 
                onClick={handleSaveSale}
                className="w-full bg-green-500 text-white py-3 rounded-lg text-lg font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
                disabled={currentItems.length === 0 || !selectedCustomerId}
              >
                Save Bill
              </button>
            </div>
        </div>
      </div>

      {isCustomerModalOpen && (
        <Modal title="Add New Customer" onClose={() => setIsCustomerModalOpen(false)}>
          <CustomerForm onSave={handleSaveCustomer} onCancel={() => setIsCustomerModalOpen(false)} />
        </Modal>
      )}
    </div>
  );
};

export default Sales;