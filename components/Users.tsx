import React, { useState } from 'react';
import { User } from '../types';
import Modal from './Modal';
import { PlusIcon } from './icons/Icons';
import UserForm from './UserForm';

interface UsersProps {
  users: Omit<User, 'password'>[];
  onAddUser: (user: Omit<User, 'id'>) => void;
}

const Users: React.FC<UsersProps> = ({ users, onAddUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveUser = (user: Omit<User, 'id'>) => {
    onAddUser(user);
    setIsModalOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Users</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon /> Add User
        </button>
      </div>

      <div className="bg-white p-2 md:p-6 rounded-xl shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left responsive-table">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 font-medium text-gray-800">Name</th>
                <th className="p-3 font-medium text-gray-800">ID</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td data-label="Name" className="font-semibold text-gray-900">{user.name}</td>
                  <td data-label="ID" className="text-gray-700">{user.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
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