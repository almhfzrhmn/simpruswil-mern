import React, { useEffect, useState, useCallback } from "react";
import { bookingsAPI, downloadFile } from "../../services/api";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import AdminNotesModal from "../../components/ui/AdminNotesModal";
import toast from "react-hot-toast";
import {
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  CheckCircleIcon,
  DocumentIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
} from "@heroicons/react/24/outline";

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatDateRange = (startTime, endTime) => {
    if (!startTime || !endTime) return '-';
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const startDate = start.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    
    const startTimeStr = start.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const endTimeStr = end.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    return `${startDate} - ${startTimeStr} - ${endTimeStr} WIB`;
};

function AdminBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [statsData, setStatsData] = useState(null);

    // Admin notes modal state
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // { id, status, itemName }

    // Search, filter, and sort states
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalBookings, setTotalBookings] = useState(0);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm.length >= 2 ? searchTerm : "");
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchBookings = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const params = {
                page,
                limit: 10,
                search: debouncedSearchTerm || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                sortBy,
                sortOrder
            };

            // Remove undefined values
            Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

            const res = await bookingsAPI.getAllBookings(params);
            setBookings(res.data.data);
            setCurrentPage(res.data.pagination?.page || 1);
            setTotalPages(res.data.pagination?.pages || 1);
            setTotalBookings(res.data.pagination?.total || 0);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchTerm, statusFilter, sortBy, sortOrder]);

    useEffect(() => {
        fetchBookings(1);
        setCurrentPage(1);
    }, [debouncedSearchTerm, statusFilter, sortBy, sortOrder, fetchBookings]);

    useEffect(() => {
        if (currentPage > 1) {
            fetchBookings(currentPage);
        }
    }, [currentPage, fetchBookings]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await bookingsAPI.getBookingStats({ period: 'month' });
                setStatsData(res.data.data);
            } catch (error) {
                console.error('Error fetching booking stats:', error);
                setStatsData(null);
            }
        };
        fetchStats();
    }, []);

    // Keyboard shortcuts for pagination
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Only handle shortcuts when not typing in input fields
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT') {
                return;
            }

            switch (event.key) {
                case 'ArrowLeft':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        setCurrentPage(prev => Math.max(1, prev - 1));
                    }
                    break;
                case 'ArrowRight':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        setCurrentPage(prev => Math.min(totalPages, prev + 1));
                    }
                    break;
                case 'Home':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        setCurrentPage(1);
                    }
                    break;
                case 'End':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        setCurrentPage(totalPages);
                    }
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [totalPages]);

    const handleStatusChange = (id, status) => {
        const booking = bookings.find(b => b._id === id);
        if (!booking) return;

        setPendingAction({
            id,
            status,
            itemName: `${booking.activityName} - ${booking.userId?.name || 'User'}`,
            itemType: 'booking'
        });
        setShowNotesModal(true);
    };

    const handleConfirmStatusChange = async (adminNote) => {
        if (!pendingAction) return;

        setActionLoading(true);
        try {
            await bookingsAPI.updateBookingStatus(pendingAction.id, {
                status: pendingAction.status,
                adminNote
            });
            setBookings(bookings => bookings.map(b =>
                b._id === pendingAction.id ? { ...b, status: pendingAction.status } : b
            ));

            let successMessage = '';
            switch (pendingAction.status) {
                case 'approved':
                    successMessage = 'Booking berhasil disetujui';
                    break;
                case 'rejected':
                    successMessage = 'Booking berhasil ditolak';
                    break;
                case 'completed':
                    successMessage = 'Booking berhasil ditandai selesai';
                    break;
                default:
                    successMessage = 'Status booking berhasil diupdate';
            }
            toast.success(successMessage);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal mengupdate status booking');
        } finally {
            setActionLoading(false);
            setPendingAction(null);
        }
    };

    const handleDeleteBooking = async (id) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus booking ini? Tindakan ini tidak dapat dibatalkan.")) return;

        setActionLoading(true);
        try {
            await bookingsAPI.deleteBookingAdmin(id);
            setBookings(bookings => bookings.filter(b => b._id !== id));
            toast.success("Booking berhasil dihapus");
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal menghapus booking");
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'text-green-600';
            case 'rejected':
                return 'text-red-600';
            case 'pending':
                return 'text-yellow-600';
            case 'completed':
                return 'text-blue-600';
            case 'cancelled':
                return 'text-gray-600';
            default:
                return 'text-gray-600';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'approved':
                return 'Disetujui';
            case 'rejected':
                return 'Ditolak';
            case 'pending':
                return 'Pending';
            case 'completed':
                return 'Selesai';
            case 'cancelled':
                return 'Dibatalkan';
            default:
                return status;
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Manajemen Booking</h1>
            </div>

            {/* Search, Filter, and Sort Controls */}
            <div className="bg-white p-6 rounded-xl shadow-[2px_4px_12px_theme(colors.blue.500,0.5)]">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search Bar */}
                    <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari berdasarkan nama pengguna, kegiatan, atau ruangan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="text-gray-900 w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:text-gray-900"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <FunnelIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="text-gray-900 pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:text-black focus:border-blue-500 appearance-none bg-white"
                        >
                            <option value="all">Semua Status</option>
                            <option value="pending">Menunggu</option>
                            <option value="approved">Disetujui</option>
                            <option value="rejected">Ditolak</option>
                            <option value="completed">Selesai</option>
                            <option value="cancelled">Dibatalkan</option>
                        </select>
                    </div>

                    {/* Sort Options */}
                    <div className="relative">
                        <ArrowsUpDownIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <select
                            value={`${sortBy}_${sortOrder}`}
                            onChange={(e) => {
                                const [field, order] = e.target.value.split('_');
                                setSortBy(field);
                                setSortOrder(order);
                            }}
                            className="text-gray-900 pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white focus:text-gray-900"
                        >
                            <option value="createdAt_desc">Terbaru</option>
                            <option value="createdAt_asc">Terlama</option>
                            <option value="startTime_desc">Tanggal Mulai (Terbaru)</option>
                            <option value="startTime_asc">Tanggal Mulai (Terlama)</option>
                            <option value="activityName_asc">Nama Kegiatan (A-Z)</option>
                            <option value="activityName_desc">Nama Kegiatan (Z-A)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-5">
                {/* Total Permintaan */}
                <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-[2px_4px_12px_theme(colors.blue.500,0.5)]">
                    <div className="text-md font-bold text-gray-900 mb-2">TOTAL PERMINTAAN</div>
                    <div className="text-4xl font-bold text-gray-900 mb-1">
                        {statsData?.summary?.total || bookings.length || 74}
                    </div>
                    <div className="text-sm text-gray-500">
                        Total semua permintaan booking
                    </div>
                </div>

                {/* Pending */}
                <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-[2px_4px_12px_theme(colors.yellow.500,0.5)]">
                    <div className="text-md font-bold text-gray-900 mb-2">MENUNGGU APPROVAL</div>
                    <div className="text-4xl font-bold text-yellow-600 mb-1">
                        {statsData?.summary?.pending || bookings.filter(b => b.status === 'pending').length || 0}
                    </div>
                    <div className="text-sm text-gray-500">
                        Perlu ditinjau admin
                    </div>
                </div>

                {/* Approved */}
                <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-[2px_4px_12px_theme(colors.green.500,0.5)]">
                    <div className="text-md font-bold text-gray-900 mb-2">DISETUJUI</div>
                    <div className="text-4xl font-bold text-green-600 mb-1">
                        {statsData?.summary?.approved || bookings.filter(b => b.status === 'approved').length || 0}
                    </div>
                    <div className="text-sm text-gray-500">
                        Booking yang disetujui
                    </div>
                </div>

                {/* Completed */}
                <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-[2px_4px_12px_theme(colors.blue.500,0.5)]">
                    <div className="text-md font-bold text-gray-900 mb-2">SELESAI</div>
                    <div className="text-4xl font-bold text-blue-600 mb-1">
                        {statsData?.summary?.completed || bookings.filter(b => b.status === 'completed').length || 0}
                    </div>
                    <div className="text-sm text-gray-500">
                        Kegiatan telah selesai
                    </div>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white">
                <div className="px-6 py-4">
                    <h3 className="text-2xl font-bold text-gray-900">Permintaan Penggunaan Ruang</h3>
                    <p className="text-sm text-gray-600 mt-1">Daftar permintaan penggunaan ruangan Pustaka Wilayah Aceh</p>
                </div>
                
                <div className="overflow-x-auto rounded-xl bg-white shadow-[2px_4px_12px_theme(colors.blue.500,0.5)]">
                    <table className="min-w-full border-separate border-spacing-0">
                        <thead>
                            <tr className="border-b border-gray-200 bg-white">
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 rounded-tl-xl">Pengguna</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Kegiatan</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Ruangan</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Tanggal</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 rounded-tr-xl">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {bookings.map((booking, index) => (
                                <tr key={booking._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {booking.userId?.name || 'User Deleted'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {booking.activityName}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {booking.roomId?.roomName || 'Room Deleted'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {formatDateRange(booking.startTime, booking.endTime)}
                                    </td>
                                    <td className={`px-6 py-4 text-sm font-medium ${getStatusColor(booking.status)}`}>
                                        {getStatusText(booking.status)}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="flex items-center space-x-2">
                                            {/* View/Detail Button */}
                                            <button
                                                onClick={() => setSelectedBooking(booking)}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                                                title="Lihat Detail"
                                            >
                                                <EyeIcon className="h-5 w-5" />
                                            </button>

                                            {/* Approve Button */}
                                            <button
                                                onClick={() => handleStatusChange(booking._id, 'approved')}
                                                disabled={actionLoading || booking.status !== 'pending'}
                                                className="p-1.5 text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Setujui"
                                            >
                                                <CheckIcon className="h-5 w-5" />
                                            </button>

                                            {/* Reject Button */}
                                            <button
                                                onClick={() => handleStatusChange(booking._id, 'rejected')}
                                                disabled={actionLoading || booking.status !== 'pending'}
                                                className="p-1.5 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Tolak"
                                            >
                                                <XMarkIcon className="h-5 w-5" />
                                            </button>

                                            {/* Mark as Completed Button */}
                                            <button
                                                onClick={() => handleStatusChange(booking._id, 'completed')}
                                                disabled={actionLoading || booking.status !== 'approved'}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Tandai Selesai"
                                            >
                                                <CheckCircleIcon className="h-5 w-5" />
                                            </button>

                                            {/* Delete Button */}
                                            <button
                                                onClick={() => handleDeleteBooking(booking._id)}
                                                disabled={actionLoading}
                                                className="p-1.5 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Hapus Booking"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {bookings.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        Tidak ada booking yang ditemukan
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer with Info */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Menampilkan {bookings.length > 0 ? ((currentPage - 1) * 10) + 1 : 0} sampai {Math.min(currentPage * 10, ((currentPage - 1) * 10) + bookings.length)} dari total {totalBookings} data
                        </div>
                        <div className="text-sm text-gray-500">
                            10 data per halaman
                        </div>
                    </div>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center">
                    <nav className="flex items-center gap-2">
                        {/* First Button */}
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-sm border-2 border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer text-gray-800"
                            title="Halaman Pertama"
                        >
                            ⟪
                        </button>

                        {/* Previous Button */}
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-sm border-2 border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer text-gray-800"
                        >
                            Sebelumnya
                        </button>

                        {/* Page Numbers */}
                        {(() => {
                            const pages = [];
                            const maxVisiblePages = 5;
                            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                            // Adjust start page if we're near the end
                            if (endPage - startPage + 1 < maxVisiblePages) {
                                startPage = Math.max(1, endPage - maxVisiblePages + 1);
                            }

                            // Add first page if not included
                            if (startPage > 1) {
                                pages.push(
                                    <button
                                        key={1}
                                        onClick={() => setCurrentPage(1)}
                                        className="px-3 py-2 text-sm border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        1
                                    </button>
                                );
                                if (startPage > 2) {
                                    pages.push(
                                        <span key="ellipsis-start" className="px-2 py-2 text-sm text-gray-500">
                                            ...
                                        </span>
                                    );
                                }
                            }

                            // Add visible page numbers
                            for (let i = startPage; i <= endPage; i++) {
                                pages.push(
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i)}
                                        className={`px-3 py-2 text-sm border-2 rounded-xl transition-colors ${
                                            currentPage === i
                                                ? 'bg-blue-500 text-white border-blue-500 cursor-pointer'
                                                : 'border-gray-200 hover:bg-gray-50 cursor-pointer text-gray-800'
                                        }`}
                                    >
                                        {i}
                                    </button>
                                );
                            }

                            // Add last page if not included
                            if (endPage < totalPages) {
                                if (endPage < totalPages - 1) {
                                    pages.push(
                                        <span key="ellipsis-end" className="px-2 py-2 text-sm text-gray-500">
                                            ...
                                        </span>
                                    );
                                }
                                pages.push(
                                    <button
                                        key={totalPages}
                                        onClick={() => setCurrentPage(totalPages)}
                                        className="px-3 py-2 text-sm border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        {totalPages}
                                    </button>
                                );
                            }

                            return pages;
                        })()}

                        {/* Next Button */}
                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 text-sm border-2 text-gray-800 border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            Selanjutnya
                        </button>

                        {/* Last Button */}
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 text-sm border-2 border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer text-gray-800"
                            title="Halaman Terakhir"
                        >
                            ⟫
                        </button>
                    </nav>
                </div>
            )}

            {/* Pagination Info */}
            {totalPages > 1 && (
                <div className="text-center mt-4">
                    <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg inline-block">
                        💡 Tip: Gunakan <kbd className="px-1 py-0.5 bg-white border rounded text-xs">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-white border rounded text-xs">←/→</kbd> untuk navigasi cepat, atau <kbd className="px-1 py-0.5 bg-white border rounded text-xs">Ctrl+Home</kbd>/<kbd className="px-1 py-0.5 bg-white border rounded text-xs">Ctrl+End</kbd> untuk halaman pertama/terakhir
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedBooking && (
                <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Detail Booking</h3>
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            <div>
                                <span className="text-sm font-medium text-gray-500">User:</span>
                                <p className="text-sm text-gray-900">{selectedBooking.userId?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-500">Email:</span>
                                <p className="text-sm text-gray-900">{selectedBooking.userId?.email || 'N/A'}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-500">Kegiatan:</span>
                                <p className="text-sm text-gray-900">{selectedBooking.activityName}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-500">Tujuan:</span>
                                <p className="text-sm text-gray-900">{selectedBooking.purpose}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-500">Ruangan:</span>
                                <p className="text-sm text-gray-900">{selectedBooking.roomId?.roomName || 'N/A'}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-500">Tanggal Mulai:</span>
                                <p className="text-sm text-gray-900">{formatDate(selectedBooking.startTime)}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-500">Tanggal Selesai:</span>
                                <p className="text-sm text-gray-900">{formatDate(selectedBooking.endTime)}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-500">Jumlah Peserta:</span>
                                <p className="text-sm text-gray-900">{selectedBooking.participantsCount} orang</p>
                            </div>
                            {selectedBooking.notes && (
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Deskripsi:</span>
                                    <p className="text-sm text-gray-900">{selectedBooking.notes}</p>
                                </div>
                            )}
                            <div>
                                <span className="text-sm font-medium text-gray-500">Status:</span>
                                <p className={`text-sm font-medium ${getStatusColor(selectedBooking.status)}`}>
                                    {getStatusText(selectedBooking.status)}
                                </p>
                            </div>
                            {selectedBooking.documentUrl && (
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Dokumen Persyaratan:</span>
                                    <div className="mt-2 flex items-center space-x-2">
                                        <DocumentIcon className="h-5 w-5 text-gray-400" />
                                        <button
                                            onClick={() => window.open(selectedBooking.documentUrl, '_blank')}
                                            className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                                        >
                                            Lihat Dokumen
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const filename = selectedBooking.documentPath.split('/').pop();
                                                    await downloadFile(selectedBooking.documentUrl, filename);
                                                    toast.success('Dokumen berhasil diunduh');
                                                } catch {
                                                    toast.error('Gagal mengunduh dokumen');
                                                }
                                            }}
                                            className="p-1 text-gray-400 hover:text-gray-600"
                                            title="Unduh Dokumen"
                                        >
                                            <ArrowDownTrayIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            {selectedBooking.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => {
                                            handleStatusChange(selectedBooking._id, 'approved');
                                            setSelectedBooking(null);
                                        }}
                                        disabled={actionLoading}
                                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-3xl hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer "
                                    >
                                        Setujui
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleStatusChange(selectedBooking._id, 'rejected');
                                            setSelectedBooking(null);
                                        }}
                                        disabled={actionLoading}
                                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-3xl hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                                    >
                                        Tolak
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="px-4 py-2 bg-gray-600 text-white text-sm rounded-3xl hover:bg-gray-700 transition-colors cursor-pointer"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Notes Modal */}
            <AdminNotesModal
                isOpen={showNotesModal}
                onClose={() => setShowNotesModal(false)}
                onConfirm={handleConfirmStatusChange}
                title="Catatan Admin"
                itemType={pendingAction?.itemType}
                itemName={pendingAction?.itemName}
                actionType={pendingAction?.status}
            />
        </div>
    );
}

export default AdminBookings;