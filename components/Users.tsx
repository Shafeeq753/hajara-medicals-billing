
import React, { useState, useMemo } from 'react';
import { User } from '../types';
import Modal from './Modal';
import { PlusIcon } from './icons/Icons';
import UserForm from './UserForm';

interface UsersProps {
  users: Omit<User, 'password'>[];
  onAddUser: (user: Omit<User, 'id'>) => void;
}

const Users = ({ users, onAddUser }: UsersProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleSaveUser = (user: Omit<User, 'id'>) => {
    onAddUser(user);
    setIsModalOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-black">Users</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon /> Add User
        </button>
      </div>

      <div className="bg-white p-2 md:p-6 rounded-xl shadow-lg">
        <div>
          <input
            type="text"
            placeholder="Search by Name or ID..."
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
                <th scope="col" className="px-6 py-3">ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                  <td data-label="Name" className="px-6 py-4 font-medium text-black whitespace-nowrap">{user.name}</td>
                  <td data-label="ID" className="px-6 py-4">{user.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && <p className="text-center text-black py-4">No users found.</p>}
        </div>
      </div>

      {isModalOpen && (
        <Modal title="Add New User" onClose={() => setIsModalOpen(false)}>
          <UserForm onSave={handleSaveUser} onCancel={() => setIsModalOpen(false)} />
        </Modal>
      )}
    </div>
  );
};

export default Users;
