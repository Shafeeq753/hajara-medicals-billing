
import React, { useState, useMemo, useEffect } from 'react';
import { Customer, Product, CustomerMedicine } from '../types';
import Modal from './Modal';
import { PlusIcon, EditIcon } from './icons/Icons';
import CustomerForm from './CustomerForm';

interface CustomerDetailsModalProps {
  customer: Customer;
  products: Product[];
  onSaveMedicines: (customerId: string, medicines: CustomerMedicine[]) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onClose: () => void;
}

const CustomerDetailsModal = ({ customer, products, onSaveMedicines, onUpdateCustomer, onClose }: CustomerDetailsModalProps) => {
    // Mode: 'view' or 'edit_details'
    const [mode, setMode] = useState<'view' | 'edit_details'>('view');
    
    // Edit Details State
    const [editName, setEditName] = useState(customer.name);
    const [editPhone, setEditPhone] = useState(customer.phone);
    const [editAddress, setEditAddress] = useState(customer.address);

    // Medicines State
    const [medicines, setMedicines] = useState<CustomerMedicine[]>(customer.medicines || []);
    
    // New Medicine Input State
    const [selectedProductId, setSelectedProductId] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('');
    const [strength, setStrength] = useState('');
    const [instructions, setInstructions] = useState('');

    const availableProducts = useMemo(() => {
        const usedIds = medicines.map(m => m.productId);
        return products.filter(p => !usedIds.includes(p.id));
    }, [products, medicines]);

    const handleAddMedicine = () => {
        if (selectedProductId) {
            const newMedicine: CustomerMedicine = {
                productId: selectedProductId,
                dosage,
                frequency,
                strength,
                instructions
            };
            const updatedMedicines = [...medicines, newMedicine];
            setMedicines(updatedMedicines);
            onSaveMedicines(customer.id, updatedMedicines); // Auto-save medicines for smoother UX
            
            // Reset inputs
            setSelectedProductId('');
            setDosage('');
            setFrequency('');
            setStrength('');
            setInstructions('');
        }
    };

    const handleRemoveMedicine = (productId: string) => {
        const updatedMedicines = medicines.filter(m => m.productId !== productId);
        setMedicines(updatedMedicines);
        onSaveMedicines(customer.id, updatedMedicines);
    };

    const handleUpdateDetails = () => {
        onUpdateCustomer({
            ...customer,
            name: editName,
            phone: editPhone,
            address: editAddress
        });
        setMode('view');
    };

    return (
        <div className="space-y-4">
            {/* Customer Details Section */}
            <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm relative">
                <div className="flex justify-between items-start mb-2 border-b border-gray-100 pb-2">
                    <h3 className="text-md font-bold text-black">Details</h3>
                     {mode === 'view' ? (
                        <button onClick={() => setMode('edit_details')} className="text-black text-xs font-semibold hover:underline">Edit</button>
                    ) : (
                        <div className="space-x-2">
                             <button onClick={() => setMode('view')} className="text-gray-500 text-xs font-medium hover:underline">Cancel</button>
                             <button onClick={handleUpdateDetails} className="text-blue-600 text-xs font-bold hover:underline">Save</button>
                        </div>
                    )}
                </div>
                
                {mode === 'view' ? (
                    <div className="space-y-1 text-sm">
                        <p><span className="font-bold text-black">Name:</span> {customer.name}</p>
                        <p><span className="font-bold text-black">Phone:</span> {customer.phone}</p>
                        <p><span className="font-bold text-black">Address:</span> {customer.address || 'N/A'}</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full p-2 border rounded text-sm" placeholder="Name" />
                        <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full p-2 border rounded text-sm" placeholder="Phone" />
                        <input type="text" value={editAddress} onChange={e => setEditAddress(e.target.value)} className="w-full p-2 border rounded text-sm" placeholder="Address" />
                    </div>
                )}
            </div>

            {/* Medicines Section */}
            <div>
                <h3 className="text-md font-bold text-black mb-2">Medicines</h3>
                
                {/* List of Medicines */}
                <div className="space-y-2 mb-4">
                    {medicines.length > 0 ? (
                        medicines.map((m, idx) => {
                            const product = products.find(p => p.id === m.productId);
                            return (
                                <div key={m.productId} className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm relative">
                                    <button onClick={() => handleRemoveMedicine(m.productId)} className="absolute top-2 right-2 text-black font-bold text-lg hover:text-red-500 leading-none">
                                        &times;
                                    </button>
                                    <p className="font-bold text-black pr-6 mb-1 text-sm">{product?.name || 'Unknown Product'}</p>
                                    <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-xs text-gray-700">
                                        <p><span className="font-semibold text-gray-500">Power:</span> {m.strength || 'N/A'}</p>
                                        <p><span className="font-semibold text-gray-500">Amount:</span> {m.dosage || 'N/A'}</p>
                                        <p><span className="font-semibold text-gray-500">Take:</span> {m.frequency || 'N/A'}</p>
                                        <p><span className="font-semibold text-gray-500">Note:</span> {m.instructions || 'N/A'}</p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-gray-500 italic text-sm">No medicines assigned.</p>
                    )}
                </div>

                {/* Add Medicine Form */}
                <div className="bg-blue-50 p-3 rounded-lg shadow-inner">
                    <h4 className="font-semibold text-sm mb-2 text-black">Add Medicine</h4>
                    <div className="grid grid-cols-2 gap-2">
                         <div className="col-span-2">
                            <select 
                                    value={selectedProductId} 
                                    onChange={e => setSelectedProductId(e.target.value)}
                                    className="w-full p-2 bg-white border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="" disabled>Select Product...</option>
                                    {availableProducts.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                            </select>
                         </div>
                        <input type="text" placeholder="Dosage (e.g. 1 tab)" value={dosage} onChange={e => setDosage(e.target.value)} className="col-span-1 w-full p-2 bg-white border border-gray-300 text-black placeholder-gray-500 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        <input type="text" placeholder="Power (e.g. 500mg)" value={strength} onChange={e => setStrength(e.target.value)} className="col-span-1 w-full p-2 bg-white border border-gray-300 text-black placeholder-gray-500 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        <input type="text" placeholder="When (e.g. Morning, Night)" value={frequency} onChange={e => setFrequency(e.target.value)} className="col-span-2 w-full p-2 bg-white border border-gray-300 text-black placeholder-gray-500 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        <input type="text" placeholder="Notes (e.g. After food)" value={instructions} onChange={e => setInstructions(e.target.value)} className="col-span-2 w-full p-2 bg-white border border-gray-300 text-black placeholder-gray-500 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <button 
                        onClick={handleAddMedicine} 
                        disabled={!selectedProductId}
                        className="mt-3 w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm transition-colors shadow-sm"
                    >
                        Add to List
                    </button>
                </div>
            </div>

            <div className="flex justify-end pt-2 border-t mt-2">
                <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300 font-medium text-sm">Close</button>
            </div>
        </div>
    );
};


interface CustomersProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id'>) => void;
  products: Product[];
  onUpdateCustomerMedicines: (customerId: string, medicines: CustomerMedicine[]) => void;
  onUpdateCustomer: (customer: Customer) => void;
}

const Customers = ({ customers, onAddCustomer, products, onUpdateCustomerMedicines, onUpdateCustomer }: CustomersProps) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  const handleSaveCustomer = (customer: Omit<Customer, 'id'>) => {
    onAddCustomer(customer);
    setIsAddModalOpen(false);
  }
  
  const handleOpenDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-black">Customers</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon /> <span className="hidden sm:inline">Add Customer</span>
        </button>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
        <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full max-w-sm p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 mb-4"
        />

        {/* Mobile List View */}
        <div className="md:hidden space-y-3">
             {filteredCustomers.map(customer => (
                 <div 
                    key={customer.id} 
                    onClick={() => handleOpenDetails(customer)}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm active:bg-blue-50 cursor-pointer flex justify-between items-center"
                 >
                     <div>
                         <p className="font-bold text-lg text-black">{customer.name}</p>
                         <p className="text-sm text-gray-600">{customer.phone}</p>
                     </div>
                     <div className="text-blue-600 font-semibold text-sm">
                         View & Edit &rarr;
                     </div>
                 </div>
             ))}
             {filteredCustomers.length === 0 && <p className="text-center text-gray-500 py-4">No customers found.</p>}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-black uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Name</th>
                <th scope="col" className="px-6 py-3">Phone</th>
                <th scope="col" className="px-6 py-3">Medicines Used</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-black whitespace-nowrap">{customer.name}</td>
                  <td className="px-6 py-4">{customer.phone}</td>
                  <td className="px-6 py-4">
                    <span className="line-clamp-2">
                        {customer.medicines?.length > 0
                          ? customer.medicines.map(m => products.find(p => p.id === m.productId)?.name).filter(Boolean).join(', ')
                          : 'None'}
                    </span>
                  </td>
                   <td className="px-6 py-4 text-right">
                    <button onClick={() => handleOpenDetails(customer)} className="font-medium text-blue-600 hover:underline">
                      View/Edit Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCustomers.length === 0 && <p className="text-center text-black py-4">No customers found.</p>}
        </div>
      </div>

      {isAddModalOpen && (
        <Modal title="Add New Customer" onClose={() => setIsAddModalOpen(false)} size="lg">
          <CustomerForm onSave={handleSaveCustomer} onCancel={() => setIsAddModalOpen(false)} products={products} />
        </Modal>
      )}

      {selectedCustomer && (
        <Modal title={`${selectedCustomer.name}`} onClose={() => setSelectedCustomer(null)} size="lg">
          <CustomerDetailsModal
            customer={selectedCustomer}
            products={products}
            onSaveMedicines={onUpdateCustomerMedicines}
            onUpdateCustomer={onUpdateCustomer}
            onClose={() => setSelectedCustomer(null)}
          />
        </Modal>
      )}
    </div>
  );
};

export default Customers;
