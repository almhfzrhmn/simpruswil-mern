import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { bookingsAPI, downloadFile } from "../../services/api";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  PlusIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    activityName: '',
    purpose: '',
    participantsCount: '',
    startTime: null,
    endTime: null,
    notes: '',
    document: null
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);

  const loadBookings = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      const response = await bookingsAPI.getMyBookings(params);
      setBookings(response.data.data);
      setCurrentPage(response.data.pagination.page);
      setTotalPages(response.data.pagination.pages);
      setTotalBookings(response.data.pagination.total);
    } catch (error) {
      console.error("Error loading bookings:", error);
      toast.error("Gagal memuat data booking");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings(currentPage);
  }, [currentPage, loadBookings]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Apakah Anda yakin ingin membatalkan booking ini?")) return;

    setSubmitting(true);
    try {
      await bookingsAPI.cancelBooking(bookingId);
      setBookings(bookings => bookings.map(b =>
        b._id === bookingId ? { ...b, status: 'cancelled' } : b
      ));
      toast.success("Booking berhasil dibatalkan");
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal membatalkan booking");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditBooking = (booking) => {
    setEditForm({
      activityName: booking.activityName,
      purpose: booking.purpose,
      participantsCount: booking.participantsCount,
      startTime: new Date(booking.startTime),
      endTime: new Date(booking.endTime),
      notes: booking.notes || '',
      document: null
    });
    setSelectedBooking(booking);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!editForm.activityName || !editForm.purpose || !editForm.participantsCount ||
        !editForm.startTime || !editForm.endTime) {
      toast.error("Mohon lengkapi semua field yang wajib");
      return;
    }

    if (editForm.startTime >= editForm.endTime) {
      toast.error("Waktu selesai harus setelah waktu mulai");
      return;
    }

    const formData = new FormData();
    formData.append('activityName', editForm.activityName);
    formData.append('purpose', editForm.purpose);
    formData.append('participantsCount', editForm.participantsCount);
    formData.append('startTime', editForm.startTime.toISOString());
    formData.append('endTime', editForm.endTime.toISOString());
    formData.append('notes', editForm.notes || '');

    if (editForm.document) {
      formData.append('document', editForm.document);
    }

    setSubmitting(true);
    try {
      await bookingsAPI.updateBooking(selectedBooking._id, formData);
      setBookings(bookings => bookings.map(b =>
        b._id === selectedBooking._id ? { ...b, ...editForm, startTime: editForm.startTime.toISOString(), endTime: editForm.endTime.toISOString() } : b
      ));
      setShowEditModal(false);
      setSelectedBooking(null);
      toast.success("Booking berhasil diupdate");
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal mengupdate booking");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus riwayat booking ini? Tindakan ini tidak dapat dibatalkan.")) return;

    setSubmitting(true);
    try {
      await bookingsAPI.deleteBooking(bookingId);
      setBookings(bookings => bookings.filter(b => b._id !== bookingId));
      toast.success("Riwayat booking berhasil dihapus");
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal menghapus booking");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadDocument = async (documentUrl, filename) => {
    try {
      await downloadFile(documentUrl, filename);
      toast.success("Dokumen berhasil diunduh");
    } catch {
      toast.error("Gagal mengunduh dokumen");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        icon: ClockIcon,
        class: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        text: 'Menunggu Approval'
      },
      approved: {
        icon: CheckCircleIcon,
        class: 'bg-green-100 text-green-800 border-green-200',
        text: 'Disetujui'
      },
      rejected: {
        icon: XCircleIcon,
        class: 'bg-red-100 text-red-800 border-red-200',
        text: 'Ditolak'
      },
      cancelled: {
        icon: ExclamationTriangleIcon,
        class: 'bg-gray-100 text-gray-800 border-gray-200',
        text: 'Dibatalkan'
      },
      completed: {
        icon: CheckCircleIcon,
        class: 'bg-blue-100 text-blue-800 border-blue-200',
        text: 'Selesai'
      }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.class}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredBookings = bookings.filter((booking) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      booking.activityName?.toLowerCase().includes(search) ||
      booking.roomId?.roomName?.toLowerCase().includes(search) ||
      booking.purpose?.toLowerCase().includes(search);
    const matchesFilter = filterStatus === "all" || booking.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl shadow-2xl overflow-hidden">
          <div className="px-8 py-8 relative">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-md"></div>
            <div className="relative flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">Riwayat Booking</h1>
                <p className="text-blue-100 text-lg drop-shadow-md mt-2">
                  Kelola dan pantau status booking ruangan Anda
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3">
                <div className="text-white text-sm font-semibold drop-shadow-md">
                  Total: {totalBookings} booking
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Filters */}
      <div className="bg-white/70 backdrop-blur-lg shadow-xl rounded-3xl border border-white/30 p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="relative flex-1">
            <div className="bg-gray-100/80 rounded-2xl p-4 backdrop-blur-sm border border-gray-200/50">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 absolute left-6 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama kegiatan, tujuan, atau ruangan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-transparent border-0 focus:outline-none text-gray-900 placeholder-gray-500 text-sm"
              />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-1 border border-gray-200/50">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full sm:w-48 bg-transparent border-0 focus:outline-none text-gray-700 text-sm px-4 py-3 rounded-xl"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu Approval</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
              <option value="cancelled">Dibatalkan</option>
              <option value="completed">Selesai</option>
            </select>
          </div>
          <Link
            to="/rooms"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 shadow-lg transition-all duration-200 font-semibold"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Booking Baru
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/70 backdrop-blur-lg shadow-xl rounded-3xl border border-white/30 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="bg-white/60 rounded-2xl p-6 backdrop-blur-sm">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200/50">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100/80 backdrop-blur-sm">
                <tr>
                  <th className="p-6 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Kegiatan
                  </th>
                  <th className="p-6 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Ruangan & Jadwal
                  </th>
                  <th className="p-6 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="p-6 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Dibuat
                  </th>
                  <th className="p-6 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-200/30">
                {filteredBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-white/80 transition-all duration-200">
                    <td className="p-6">
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{booking.activityName}</div>
                        <div className="text-sm text-gray-600 mt-1">{booking.purpose}</div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                          <div className="bg-blue-100/80 rounded-lg px-2 py-1 backdrop-blur-sm">
                            {booking.participantsCount} peserta
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-purple-100/80 rounded-lg p-2 backdrop-blur-sm">
                            <BuildingOfficeIcon className="h-4 w-4 text-purple-600" />
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {booking.roomId?.roomName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="bg-green-100/80 rounded-lg p-2 backdrop-blur-sm">
                            <CalendarDaysIcon className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="text-sm text-gray-700">
                            {formatDate(booking.startTime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-100/80 rounded-lg p-2 backdrop-blur-sm">
                            <ClockIcon className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="text-sm text-gray-600">
                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="p-6 text-sm text-gray-700">
                      {formatDate(booking.createdAt)}
                    </td>
                    <td className="p-6 text-sm text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="inline-flex items-center px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-all duration-200 font-medium backdrop-blur-sm border border-blue-200/50"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Detail
                        </button>
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleEditBooking(booking)}
                              className="inline-flex items-center px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl transition-all duration-200 font-medium backdrop-blur-sm border border-green-200/50"
                            >
                              <PencilIcon className="h-4 w-4 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleCancelBooking(booking._id)}
                              disabled={submitting}
                              className="inline-flex items-center px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-all duration-200 font-medium disabled:opacity-50 backdrop-blur-sm border border-red-200/50"
                            >
                              <XMarkIcon className="h-4 w-4 mr-1" />
                              Batal
                            </button>
                          </>
                        )}
                        {(booking.status === 'cancelled' || booking.status === 'rejected' || booking.status === 'completed') && (
                          <button
                            onClick={() => handleDeleteBooking(booking._id)}
                            disabled={submitting}
                            className="inline-flex items-center px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-all duration-200 font-medium disabled:opacity-50 backdrop-blur-sm border border-red-200/50"
                          >
                            <XMarkIcon className="h-4 w-4 mr-1" />
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
          <div className="text-center py-16">
            <div className="bg-gray-100/60 rounded-2xl p-6 inline-block backdrop-blur-sm">
              <CalendarDaysIcon className="mx-auto h-16 w-16 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Tidak ada data booking</h3>
            <p className="mt-2 text-sm text-gray-600">
              {searchTerm || filterStatus !== 'all'
                ? "Tidak ditemukan booking yang cocok dengan filter"
                : "Anda belum memiliki booking ruangan"}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <div className="mt-8">
                <Link
                  to="/rooms"
                  className="inline-flex items-center px-8 py-4 border border-transparent shadow-xl text-sm font-bold rounded-2xl text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                >
                  <PlusIcon className="-ml-1 mr-3 h-6 w-6" />
                  Booking Ruangan Sekarang
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <nav className="flex items-center gap-4 bg-white/60 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-white/30">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-6 py-3 text-sm font-semibold border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:shadow-md transition-all duration-200 bg-white/80 backdrop-blur-sm"
            >
              Sebelumnya
            </button>

            <div className="bg-gray-100/80 rounded-xl px-4 py-2 backdrop-blur-sm">
              <span className="text-sm font-semibold text-gray-700">
                Halaman {currentPage} dari {totalPages}
              </span>
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-6 py-3 text-sm font-semibold border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:shadow-md transition-all duration-200 bg-white/80 backdrop-blur-sm"
            >
              Selanjutnya
            </button>
          </nav>
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedBooking(null)}
            ></div>
            <div className="relative bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl max-w-2xl w-full border border-white/30">
              <div className="flex justify-between items-center p-8 border-b border-gray-200/50">
                <h3 className="text-xl font-bold text-blue-600 drop-shadow-sm">
                  Detail Booking
                </h3>
                <button type="button" onClick={() => setSelectedBooking(null)} className="bg-gray-100/80 hover:bg-gray-200/80 rounded-xl p-2 backdrop-blur-sm transition-all duration-200">
                  <XMarkIcon className="h-6 w-6 text-gray-600" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-50/80 rounded-2xl p-4 backdrop-blur-sm border border-gray-200/50">
                    <label className="text-sm font-semibold text-gray-600">Nama Kegiatan</label>
                    <p className="text-sm font-medium text-gray-900 mt-1">{selectedBooking.activityName}</p>
                  </div>
                  <div className="bg-gray-50/80 rounded-2xl p-4 backdrop-blur-sm border border-gray-200/50">
                    <label className="text-sm font-semibold text-gray-600">Tujuan</label>
                    <p className="text-sm font-medium text-gray-900 mt-1">{selectedBooking.purpose}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-purple-50/80 rounded-2xl p-4 backdrop-blur-sm border border-purple-200/50">
                    <label className="text-sm font-semibold text-purple-700">Ruangan</label>
                    <p className="text-sm font-medium text-gray-900 mt-1">{selectedBooking.roomId?.roomName}</p>
                  </div>
                  <div className="bg-blue-50/80 rounded-2xl p-4 backdrop-blur-sm border border-blue-200/50">
                    <label className="text-sm font-semibold text-blue-700">Jumlah Peserta</label>
                    <p className="text-sm font-medium text-gray-900 mt-1">{selectedBooking.participantsCount} orang</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-green-50/80 rounded-2xl p-4 backdrop-blur-sm border border-green-200/50">
                    <label className="text-sm font-semibold text-green-700">Tanggal Mulai</label>
                    <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(selectedBooking.startTime)}</p>
                  </div>
                  <div className="bg-indigo-50/80 rounded-2xl p-4 backdrop-blur-sm border border-indigo-200/50">
                    <label className="text-sm font-semibold text-indigo-700">Waktu</label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {formatTime(selectedBooking.startTime)} - {formatTime(selectedBooking.endTime)}
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 rounded-2xl p-4 backdrop-blur-sm border border-gray-200/50">
                  <label className="text-sm font-semibold text-gray-600">Deskripsi Kegiatan</label>
                  <p className="text-sm text-gray-900 mt-2">{selectedBooking.notes || '-'}</p>
                </div>

                <div className="bg-white/80 rounded-2xl p-4 backdrop-blur-sm border border-gray-200/50">
                  <label className="text-sm font-semibold text-gray-600">Fasilitas Tambahan</label>
                  <p className="text-sm text-gray-900 mt-2">
                    {selectedBooking.equipment?.length > 0
                      ? selectedBooking.equipment.join(', ')
                      : '-'}
                  </p>
                </div>

                <div className="bg-white/80 rounded-2xl p-4 backdrop-blur-sm border border-gray-200/50">
                  <label className="text-sm font-semibold text-gray-600">Status</label>
                  <div className="mt-2">
                    {getStatusBadge(selectedBooking.status)}
                  </div>
                </div>

                {selectedBooking.adminNote && (
                  <div className="bg-yellow-50/80 rounded-2xl p-4 backdrop-blur-sm border border-yellow-200/50">
                    <label className="text-sm font-semibold text-yellow-700">Catatan Admin</label>
                    <p className="text-sm text-gray-900 mt-2">{selectedBooking.adminNote}</p>
                  </div>
                )}

                {selectedBooking.documentUrl && (
                  <div className="bg-white/80 rounded-2xl p-4 backdrop-blur-sm border border-gray-200/50">
                    <label className="text-sm font-semibold text-gray-600">Dokumen</label>
                    <div className="mt-2">
                      <button
                        onClick={() => handleDownloadDocument(selectedBooking.documentUrl, `booking-document-${selectedBooking._id}.pdf`)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
                      >
                        <ArrowDownTrayIcon className="-ml-0.5 mr-2 h-4 w-4" />
                        Unduh Dokumen
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end p-8 border-t border-gray-200/50">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="px-6 py-3 bg-gray-100/80 hover:bg-gray-200/80 border border-gray-300 rounded-2xl text-sm font-semibold text-gray-700 transition-all duration-200 backdrop-blur-sm"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {showEditModal && selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowEditModal(false)}
            ></div>
            <div className="relative bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl max-w-2xl w-full border border-white/30">
              <div className="flex justify-between items-center p-8 border-b border-gray-200/50">
                <h3 className="text-xl font-bold text-blue-600 drop-shadow-sm">
                  Edit Booking
                </h3>
                <button type="button" onClick={() => setShowEditModal(false)} className="bg-gray-100/80 hover:bg-gray-200/80 rounded-xl p-2 backdrop-blur-sm transition-all duration-200">
                  <XMarkIcon className="h-6 w-6 text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nama Kegiatan *
                    </label>
                    <input
                      type="text"
                      value={editForm.activityName}
                      onChange={(e) => setEditForm({...editForm, activityName: e.target.value})}
                      className="block w-full border border-gray-300 rounded-2xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white/80 backdrop-blur-sm transition-all duration-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tujuan Kegiatan *
                    </label>
                    <input
                      type="text"
                      value={editForm.purpose}
                      onChange={(e) => setEditForm({...editForm, purpose: e.target.value})}
                      className="block w-full border border-gray-300 rounded-2xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white/80 backdrop-blur-sm transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Jumlah Peserta *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedBooking.roomId?.capacity}
                    value={editForm.participantsCount}
                    onChange={(e) => setEditForm({...editForm, participantsCount: e.target.value})}
                    className="block w-full border border-gray-300 rounded-2xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white/80 backdrop-blur-sm transition-all duration-200"
                    required
                  />
                  <p className="mt-2 text-sm text-gray-600 bg-blue-50/80 rounded-lg px-3 py-2 backdrop-blur-sm border border-blue-200/50">Maksimal {selectedBooking.roomId?.capacity} orang</p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Waktu Mulai *
                    </label>
                    <DatePicker
                      selected={editForm.startTime}
                      onChange={(date) => setEditForm({...editForm, startTime: date})}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="dd/MM/yyyy HH:mm"
                      minDate={new Date()}
                      className="block w-full border border-gray-300 rounded-2xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white/80 backdrop-blur-sm transition-all duration-200"
                      placeholderText="Pilih tanggal dan waktu mulai"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Waktu Selesai *
                    </label>
                    <DatePicker
                      selected={editForm.endTime}
                      onChange={(date) => setEditForm({...editForm, endTime: date})}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="dd/MM/yyyy HH:mm"
                      minDate={editForm.startTime || new Date()}
                      className="block w-full border border-gray-300 rounded-2xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white/80 backdrop-blur-sm transition-all duration-200"
                      placeholderText="Pilih tanggal dan waktu selesai"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Deskripsi Kegiatan
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                    className="block w-full border border-gray-300 rounded-2xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white/80 backdrop-blur-sm transition-all duration-200 resize-none"
                    placeholder="Jelaskan detail kegiatan yang akan dilakukan..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Dokumen Surat (opsional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setEditForm({...editForm, document: e.target.files[0]})}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:transition-all file:duration-200"
                  />
                  <p className="mt-2 text-sm text-gray-600 bg-gray-50/80 rounded-lg px-3 py-2 backdrop-blur-sm border border-gray-200/50">Format: PDF, DOC, DOCX, JPG, PNG. Maksimal 5MB</p>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200/50">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-3 bg-gray-100/80 hover:bg-gray-200/80 border border-gray-300 rounded-2xl text-sm font-semibold text-gray-700 transition-all duration-200 backdrop-blur-sm"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border border-transparent rounded-2xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 shadow-lg"
                  >
                    {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default MyBookingsPage;
