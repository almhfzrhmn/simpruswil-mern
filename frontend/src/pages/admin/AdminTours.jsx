import React, { useState, useEffect, useCallback } from "react";
import { toursAPI, downloadFile } from "../../services/api";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  AcademicCapIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  EyeIcon,
  PencilIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  FunnelIcon,
  ChartBarIcon,
  UsersIcon,
  GlobeAltIcon,
  SparklesIcon,
  BookOpenIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  MapPinIcon,
  DocumentIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import AdminNotesModal from "../../components/ui/AdminNotesModal";

const AdminTours = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTour, setSelectedTour] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAssignGuideModal, setShowAssignGuideModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    completed: 0
  });

  // Assign guide form
  const [assignedGuide, setAssignedGuide] = useState("");

  // Admin notes modal state
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { id, status, itemName }

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.length >= 2 ? searchTerm : "");
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadTours = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        search: debouncedSearchTerm || undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      if (filterDate) {
        params.startDate = filterDate.toISOString().split('T')[0];
        params.endDate = filterDate.toISOString().split('T')[0];
      }

      // Remove undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await toursAPI.getAllTours(params);
      console.log('Tours API Response:', response.data.data);

      // Check if any tour has document data
      const toursWithDocs = response.data.data.filter(t => t.documentUrl);
      console.log('Tours with documents:', toursWithDocs.length);
      if (toursWithDocs.length > 0) {
        console.log('Sample tour with document:', toursWithDocs[0]);
      }

      setTours(response.data.data);
      setCurrentPage(response.data.pagination.page);
      setTotalPages(response.data.pagination.pages);
    } catch {
      toast.error("Gagal memuat data tur");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, filterStatus, filterDate]);

  const loadStats = useCallback(async () => {
    try {
      const response = await toursAPI.getTourStats();
      setStats(response.data.data.summary);
    } catch {
      // Silently fail for stats
    }
  }, []);

  useEffect(() => {
    loadTours(1);
    setCurrentPage(1);
    loadStats();
  }, [debouncedSearchTerm, filterStatus, filterDate, loadTours, loadStats]);

  useEffect(() => {
    if (currentPage > 1) {
      loadTours(currentPage);
    }
  }, [currentPage, loadTours]);

  const handleStatusChange = (tourId, status) => {
    const tour = tours.find(t => t._id === tourId);
    if (!tour) return;

    setPendingAction({
      id: tourId,
      status,
      itemName: `${tour.groupName} - ${tour.userId?.name || 'User'}`,
      itemType: 'tour'
    });
    setShowNotesModal(true);
  };

  const handleConfirmStatusChange = async (adminNote) => {
    if (!pendingAction) return;

    setSubmitting(true);
    try {
      await toursAPI.updateTourStatus(pendingAction.id, {
        status: pendingAction.status,
        adminNote
      });
      setTours(tours => tours.map(t =>
        t._id === pendingAction.id ? { ...t, status: pendingAction.status } : t
      ));
      toast.success(`Tur berhasil ${pendingAction.status === 'approved' ? 'disetujui' : pendingAction.status === 'rejected' ? 'ditolak' : 'ditandai selesai'}`);
      loadStats(); // Refresh stats
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal mengubah status tur");
    } finally {
      setSubmitting(false);
      setPendingAction(null);
    }
  };

  const handleAssignGuide = async (tourId) => {
    if (!assignedGuide.trim()) {
      toast.error("Nama pemandu harus diisi");
      return;
    }

    setSubmitting(true);
    try {
      await toursAPI.updateTour(tourId, { assignedGuide: assignedGuide.trim() });
      setTours(tours => tours.map(t =>
        t._id === tourId ? { ...t, assignedGuide: assignedGuide.trim() } : t
      ));
      setShowAssignGuideModal(false);
      setAssignedGuide("");
      setSelectedTour(null);
      toast.success("Pemandu berhasil ditetapkan");
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal menetapkan pemandu");
    } finally {
      setSubmitting(false);
    }
  };
  const handleDeleteTour = async (tourId) => {
    if(!window.confirm("Apakah Anda yakin ingin menghapus tur ini? Tindakan ini tidak dapat dibatalkan."))
      return;

      setSubmitting(true);
      try{
        await toursAPI.deleteTourAdmin(tourId);
        setTours(tours => tours.filter(t=> t._id !== tourId));
        toast.success("Tur berhasil dihapus");
        loadStats(); // Untuk me refresh stats
      } catch (error) {
        toast.error(error.response?.data?.message || "Gagal menghapus tur");
      } finally {
        setSubmitting(false);
      }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        icon: ClockIcon,
        class: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        text: 'Menunggu'
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
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${badge.class}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    );
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
        return 'Menunggu';
      case 'completed':
        return 'Selesai';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
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

  const getTourTypeIcon = (tourType) => {
    const icons = {
      general: BookOpenIcon,
      academic: AcademicCapIcon,
      research: GlobeAltIcon,
      special: SparklesIcon
    };
    return icons[tourType] || BookOpenIcon;
  };

  const getTourTypeName = (tourType) => {
    const names = {
      general: 'Tur Umum',
      academic: 'Tur Akademik',
      research: 'Tur Riset',
      special: 'Tur Khusus'
    };
    return names[tourType] || 'Tur Umum';
  };

  // Tours are now filtered on the backend
  const filteredTours = tours;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Manajemen Tur Perpustakaan</h1>
      </div>

      {/* Search, Filter, and Sort Controls */}
      <div className="bg-white p-6 rounded-xl shadow-[2px_4px_12px_theme(colors.blue.500,0.5)]">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama grup, pengguna, atau kontak..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-black w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:text-gray-900"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <FunnelIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white focus:text-gray-900"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="relative">
            <input
              type="date"
              value={filterDate ? filterDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setFilterDate(e.target.value ? new Date(e.target.value) : null)}
              className="text-black px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:text-gray-900"
              placeholder="Filter tanggal"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate(null)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-5">
        {/* Total Permintaan */}
        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-[2px_4px_12px_theme(colors.blue.500,0.5)]">
          <div className="text-md font-bold text-gray-900 mb-2">TOTAL PERMINTAAN</div>
          <div className="text-4xl font-bold text-gray-900 mb-1">
            {stats.total || 0}
          </div>
          <div className="text-sm text-gray-500">
            Total semua permintaan tur
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-[2px_4px_12px_theme(colors.yellow.500,0.5)]">
          <div className="text-md font-bold text-gray-900 mb-2">MENUNGGU APPROVAL</div>
          <div className="text-4xl font-bold text-yellow-600 mb-1">
            {stats.pending || 0}
          </div>
          <div className="text-sm text-gray-500">
            Perlu ditinjau admin
          </div>
        </div>

        {/* Approved */}
        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-[2px_4px_12px_theme(colors.green.500,0.5)]">
          <div className="text-md font-bold text-gray-900 mb-2">DISETUJUI</div>
          <div className="text-4xl font-bold text-green-600 mb-1">
            {stats.approved || 0}
          </div>
          <div className="text-sm text-gray-500">
            Tur yang disetujui
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-[2px_4px_12px_theme(colors.blue.500,0.5)]">
          <div className="text-md font-bold text-gray-900 mb-2">SELESAI</div>
          <div className="text-4xl font-bold text-blue-600 mb-1">
            {stats.completed || 0}
          </div>
          <div className="text-sm text-gray-500">
            Kegiatan telah selesai
          </div>
        </div>
      </div>


      {/* Tours Table */}
      <div className="bg-white">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredTours.length > 0 ? (
          <div className="overflow-x-auto rounded-xl bg-white shadow-[2px_4px_12px_theme(colors.blue.500,0.5)]">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="border-b border-gray-200 bg-white">
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 rounded-tl-xl">Grup & Pengguna</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Jadwal</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Detail</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 rounded-tr-xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTours.map((tour) => {
                  const TourIcon = getTourTypeIcon(tour.tourType);
                  return (
                    <tr key={tour._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-gray-500" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{tour.groupName}</div>
                            <div className="text-sm text-gray-500">{tour.userId?.name}</div>
                            <div className="text-xs text-gray-400">{tour.contactPerson?.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center mb-1">
                            <CalendarDaysIcon className="h-4 w-4 text-gray-400 mr-2" />
                            {formatDate(tour.tourDate)}
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                            {formatTime(tour.startTime)} ({tour.duration}min)
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center mb-1">
                            <TourIcon className="h-4 w-4 text-gray-400 mr-2" />
                            {getTourTypeName(tour.tourType)}
                          </div>
                          <div className="flex items-center">
                            <UserGroupIcon className="h-4 w-4 text-gray-400 mr-2" />
                            {tour.numberOfParticipants} orang
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(tour.status)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              console.log('Selected tour:', tour);
                              console.log('Tour documentUrl:', tour.documentUrl);
                              console.log('Tour documentPath:', tour.documentPath);
                              setSelectedTour(tour);
                              setShowDetailModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Detail"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>

                          {tour.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(tour._id, 'approved')}
                                disabled={submitting}
                                className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
                                title="Setujui"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleStatusChange(tour._id, 'rejected')}
                                disabled={submitting}
                                className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                title="Tolak"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}

                          {tour.status === 'approved' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedTour(tour);
                                  setAssignedGuide(tour.assignedGuide || '');
                                  setShowAssignGuideModal(true);
                                }}
                                disabled={submitting}
                                className="text-purple-600 hover:text-purple-900 p-2 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50"
                                title="Tetapkan Pemandu"
                              >
                                <UserIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleStatusChange(tour._id, 'completed')}
                                disabled={submitting}
                                className="text-blue-500 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                                title="Tandai Selesai"
                              >
                                <CheckCircleIcon className="h-4 w-4"/>
                              </button>
                            </>
                          )}
                          <button
                           onClick={() => handleDeleteTour(tour._id,)}
                           disabled={submitting} 
                           className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                           title="Hapus Tur"
                          >
                            <XMarkIcon className="h-4 w-4"/>
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak Ada Data Tur</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {searchTerm || filterStatus !== 'all' || filterDate
                ? "Tidak ditemukan tur yang cocok dengan filter pencarian"
                : "Belum ada permintaan tur perpustakaan"}
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
              className="text-gray-900 cursor-pointer px-4 py-2 text-sm border-2 border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Sebelumnya
            </button>

            <span className="px-4 py-2 text-sm text-gray-700 font-medium">
              Halaman {currentPage} dari {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="text-gray-900 cursor-pointer px-4 py-2 text-sm border-2 border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Selanjutnya
            </button>
          </nav>
        </div>
      )}

      {/* Tour Detail Modal */}
      {showDetailModal && selectedTour && (
        <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Detail Tur</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Grup:</span>
                <p className="text-sm text-gray-900">{selectedTour.groupName}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Pengguna:</span>
                <p className="text-sm text-gray-900">{selectedTour.userId?.name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Tanggal:</span>
                <p className="text-sm text-gray-900">{formatDate(selectedTour.tourDate)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Waktu:</span>
                <p className="text-sm text-gray-900">{formatTime(selectedTour.startTime)} ({selectedTour.duration}min)</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Peserta:</span>
                <p className="text-sm text-gray-900">{selectedTour.numberOfParticipants} orang</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Tipe Tur:</span>
                <p className="text-sm text-gray-900">{getTourTypeName(selectedTour.tourType)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Status:</span>
                <p className={`text-sm font-medium ${getStatusColor(selectedTour.status)}`}>
                  {getStatusText(selectedTour.status)}
                </p>
              </div>
              {(() => {
                console.log('In modal, selectedTour:', selectedTour);
                console.log('documentUrl:', selectedTour?.documentUrl);
                console.log('documentPath:', selectedTour?.documentPath);
                return null;
              })()}
              {selectedTour.documentUrl && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Dokumen Persyaratan:</span>
                  <div className="mt-2 flex items-center space-x-2">
                    <DocumentIcon className="h-5 w-5 text-gray-400" />
                    <button
                      onClick={() => window.open(selectedTour.documentUrl, '_blank')}
                      className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      Lihat Dokumen
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const filename = selectedTour.documentPath.split('/').pop();
                          await downloadFile(selectedTour.documentUrl, filename);
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
              {selectedTour.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleStatusChange(selectedTour._id, 'approved');
                      setShowDetailModal(false);
                    }}
                    disabled={submitting}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-3xl hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer "
                  >
                    Setujui
                  </button>
                  <button
                    onClick={() => {
                      handleStatusChange(selectedTour._id, 'rejected');
                      setShowDetailModal(false);
                    }}
                    disabled={submitting}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-3xl hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Tolak
                  </button>
                </>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-600 text-white text-sm rounded-3xl hover:bg-gray-700 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Guide Modal */}
      {showAssignGuideModal && selectedTour && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm"
              onClick={() => setShowAssignGuideModal(false)}
            ></div>
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white rounded-t-3xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">Tetapkan Pemandu</h3>
                    <p className="text-purple-100 mt-1">{selectedTour.groupName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAssignGuideModal(false)}
                    className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Nama Pemandu
                  </label>
                  <input
                    type="text"
                    value={assignedGuide}
                    onChange={(e) => setAssignedGuide(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all focus:text-black"
                    placeholder="Masukkan nama pemandu"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowAssignGuideModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleAssignGuide(selectedTour._id)}
                    disabled={submitting || !assignedGuide.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {submitting ? 'Menyimpan...' : 'Tetapkan'}
                  </button>
                </div>
              </div>
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
};

export default AdminTours;