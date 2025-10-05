import React, { useState, useEffect, useCallback } from "react";
import { adminAPI } from "../../services/api";
import toast from "react-hot-toast";
import {
  UserIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

// Custom Hook untuk Debouncing
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// Custom Hook untuk manajemen pengguna admin
const useAdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterVerified, setFilterVerified] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const loadUsers = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        search: debouncedSearchTerm,
        role: filterRole !== 'all' ? filterRole : undefined,
        isVerified: filterVerified !== 'all' ? filterVerified : undefined,
        page,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      // Remove undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await adminAPI.getUsers(params);
      setUsers(response.data.data);
      setCurrentPage(response.data.pagination.page);
      setTotalPages(response.data.pagination.pages);
      setTotalUsers(response.data.pagination.total);
    } catch {
      toast.error("Gagal memuat data pengguna");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, filterRole, filterVerified]);

  useEffect(() => {
    loadUsers(1);
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterRole, filterVerified, loadUsers]);

  useEffect(() => {
    if (currentPage > 1) {
      loadUsers(currentPage);
    }
  }, [currentPage, loadUsers]);

  const handleStatusChange = async (userId, updates) => {
    setSubmitting(true);
    try {
      await adminAPI.updateUserStatus(userId, updates);
      setUsers(users => users.map(u => u._id === userId ? { ...u, ...updates } : u));
      toast.success("Status pengguna berhasil diupdate");
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal mengupdate status pengguna");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) return;

    setSubmitting(true);
    try {
      await adminAPI.deleteUser(userId);
      setUsers(users => users.filter(u => u._id !== userId));
      toast.success("Pengguna berhasil dihapus");
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal menghapus pengguna");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    users,
    loading,
    submitting,
    selectedUser,
    searchTerm,
    filterRole,
    filterVerified,
    currentPage,
    totalPages,
    totalUsers,
    setSearchTerm,
    setFilterRole,
    setFilterVerified,
    setSelectedUser,
    setCurrentPage,
    handleStatusChange,
    handleDeleteUser,
  };
};

// Komponen Modal Detail Pengguna
const UserDetailModal = ({ user, onClose, onStatusChange, onDelete, submitting }) => {
  if (!user) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'user': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'user': return 'Pengguna';
      default: return role;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex justify-between items-center p-6 border-b">
            <h3 className="text-lg font-medium text-blue-600">
              Detail Pengguna
            </h3>
            <button type="button" onClick={onClose}>
              <XMarkIcon className="h-6 w-6 text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nama Lengkap</label>
                <p className="text-sm text-gray-900">{user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm text-gray-900">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nomor Telepon</label>
                <p className="text-sm text-gray-900">{user.phoneNumber || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Institusi Asal</label>
                <p className="text-sm text-gray-900">{user.originInstitution || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Role</label>
                <div className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                    {getRoleText(user.role)}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status Verifikasi</label>
                <div className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.isVerified ? 'Terverifikasi' : 'Belum Terverifikasi'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Status Akun</label>
                <div className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Tanggal Registrasi</label>
                <p className="text-sm text-gray-900">{formatDate(user.createdAt)}</p>
              </div>
            </div>

            {user.lastLogin && (
              <div>
                <label className="text-sm font-medium text-gray-500">Login Terakhir</label>
                <p className="text-sm text-gray-900">{formatDate(user.lastLogin)}</p>
              </div>
            )}
          </div>

          <div className="flex justify-between p-6 border-t">
            <div className="flex gap-2">
              {!user.isVerified && (
                <button
                  onClick={() => onStatusChange(user._id, { isVerified: true })}
                  disabled={submitting}
                  className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <CheckIcon className="h-4 w-4" />
                  Verifikasi
                </button>
              )}
              {user.role !== 'admin' && (
                <button
                  onClick={() => onStatusChange(user._id, { role: user.role === 'user' ? 'admin' : 'user' })}
                  disabled={submitting}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <ShieldCheckIcon className="h-4 w-4" />
                  {user.role === 'user' ? 'Jadikan Admin' : 'Jadikan User'}
                </button>
              )}
              <button
                onClick={() => onStatusChange(user._id, { isActive: !user.isActive })}
                disabled={submitting}
                className={`px-3 py-2 text-white text-sm rounded-md disabled:opacity-50 flex items-center gap-1 ${
                  user.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {user.isActive ? <XMarkIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
                {user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
            </div>
            <div className="flex gap-2">
              {user.role !== 'admin' && (
                <button
                  onClick={() => {
                    if (window.confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) {
                      onDelete(user._id);
                    }
                  }}
                  className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 flex items-center gap-1"
                >
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  Hapus
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Komponen Utama
const AdminUsers = () => {
  const {
    users,
    loading,
    submitting,
    selectedUser,
    searchTerm,
    filterRole,
    filterVerified,
    currentPage,
    totalPages,
    totalUsers,
    setSearchTerm,
    setFilterRole,
    setFilterVerified,
    setSelectedUser,
    setCurrentPage,
    handleStatusChange,
    handleDeleteUser,
  } = useAdminUsers();

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'user': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'user': return 'User';
      default: return role;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Pengguna</h1>
          <p className="text-sm text-gray-600">
            Kelola pengguna sistem perpustakaan
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Total: {totalUsers} pengguna
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari pengguna berdasarkan nama atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-black"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full sm:w-48 border border-gray-300 rounded-md text-gray-600"
          >
            <option value="all">Semua Role</option>
            <option value="admin">Administrator</option>
            <option value="user">Pengguna</option>
          </select>
          <select
            value={filterVerified}
            onChange={(e) => setFilterVerified(e.target.value)}
            className="w-full sm:w-48 border border-gray-300 rounded-md text-gray-600"
          >
            <option value="all">Semua Status</option>
            <option value="true">Terverifikasi</option>
            <option value="false">Belum Terverifikasi</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Pengguna
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Kontak
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Terdaftar
                  </th>
                  <th className="p-4 text-right text-xs font-medium text-gray-500 uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.originInstitution}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="text-sm text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500">{user.phoneNumber || '-'}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {getRoleText(user.role)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${
                          user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.isVerified ? '✓ Terverifikasi' : '⏳ Belum'}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? '● Aktif' : '● Nonaktif'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-900">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="p-4 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          Detail
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            disabled={submitting}
                            className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium">Tidak ada data pengguna</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterRole !== 'all' || filterVerified !== 'all'
                ? "Tidak ditemukan pengguna yang cocok dengan filter"
                : "Belum ada pengguna terdaftar"}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <nav className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Sebelumnya
            </button>

            <span className="text-sm text-gray-700">
              Halaman {currentPage} dari {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Selanjutnya
            </button>
          </nav>
        </div>
      )}

      <UserDetailModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteUser}
        submitting={submitting}
      />
    </div>
  );
};

export default AdminUsers;