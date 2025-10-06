import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { toursAPI } from "../../services/api";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  AcademicCapIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  TrashIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  SparklesIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

const MyToursPage = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTour, setSelectedTour] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTours, setTotalTours] = useState(0);

  // Edit form state
  const [editForm, setEditForm] = useState({
    groupName: '',
    numberOfParticipants: '',
    tourDate: null,
    startTime: '',
    tourType: 'general',
    duration: 60,
    contactPerson: {
      name: '',
      phone: '',
      email: ''
    },
    specialRequests: '',
    ageGroup: 'mixed',
    language: 'indonesia'
  });

  const loadTours = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      const response = await toursAPI.getMyTours(params);
      setTours(response.data.data);
      setCurrentPage(response.data.pagination.page);
      setTotalPages(response.data.pagination.pages);
      setTotalTours(response.data.pagination.total);
    } catch {
      toast.error("Gagal memuat data tur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTours(currentPage);
  }, [currentPage, loadTours]);

  const handleCancelTour = async (tourId) => {
    if (!window.confirm("Apakah Anda yakin ingin membatalkan tur ini?")) return;

    setSubmitting(true);
    try {
      await toursAPI.cancelTour(tourId);
      setTours(tours => tours.map(t => t._id === tourId ? { ...t, status: 'cancelled' } : t));
      toast.success("Tur berhasil dibatalkan");
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal membatalkan tur");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTour = (tour) => {
    const startTimeDate = new Date(tour.startTime);
    const hours = startTimeDate.getHours().toString().padStart(2, '0');
    const minutes = startTimeDate.getMinutes().toString().padStart(2, '0');
    const startTimeString = `${hours}:${minutes}`;

    setEditForm({
      groupName: tour.groupName,
      numberOfParticipants: tour.numberOfParticipants,
      tourDate: new Date(tour.tourDate),
      startTime: startTimeString,
      tourType: tour.tourType,
      duration: tour.duration,
      contactPerson: {
        name: tour.contactPerson?.name || '',
        phone: tour.contactPerson?.phone || '',
        email: tour.contactPerson?.email || ''
      },
      specialRequests: tour.specialRequests || '',
      ageGroup: tour.ageGroup,
      language: tour.language
    });
    setSelectedTour(tour);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!editForm.groupName || !editForm.numberOfParticipants ||
        !editForm.tourDate || !editForm.startTime ||
        !editForm.contactPerson.name || !editForm.contactPerson.phone) {
      toast.error("Mohon lengkapi semua field yang wajib");
      return;
    }

    if (parseInt(editForm.numberOfParticipants) < 1 || parseInt(editForm.numberOfParticipants) > 100) {
      toast.error("Jumlah peserta harus antara 1-100 orang");
      return;
    }

    // Combine date and time properly
    const [hours, minutes] = editForm.startTime.split(':').map(Number);
    const startDateTime = new Date(editForm.tourDate);
    startDateTime.setHours(hours, minutes, 0, 0);

    // Check if the combined datetime is in the past
    if (startDateTime < new Date()) {
      toast.error("Tidak dapat mengatur waktu untuk masa lalu");
      return;
    }

    const formData = {
      ...editForm,
      tourDate: editForm.tourDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      startTime: editForm.startTime,
      contactPerson: editForm.contactPerson
    };

    setSubmitting(true);
    try {
      await toursAPI.updateTour(selectedTour._id, formData);
      setTours(tours => tours.map(t =>
        t._id === selectedTour._id ? {
          ...t,
          ...editForm,
          tourDate: editForm.tourDate.toISOString().split('T')[0],
          startTime: startDateTime.toISOString()
        } : t
      ));
      setShowEditModal(false);
      setSelectedTour(null);
      toast.success("Tur berhasil diupdate");
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal mengupdate tur");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTour = async (tourId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus riwayat tur ini? Tindakan ini tidak dapat dibatalkan.")) return;

    setSubmitting(true);
    try {
      await toursAPI.deleteTour(tourId);
      setTours(tours => tours.filter(t => t._id !== tourId));
      toast.success("Riwayat tur berhasil dihapus");
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
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${badge.class}`}>
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

  const filteredTours = tours.filter((tour) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      tour.groupName?.toLowerCase().includes(search) ||
      tour.contactPerson?.name?.toLowerCase().includes(search);
    const matchesFilter = filterStatus === "all" || tour.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Riwayat Tur Saya</h1>
              <p className="text-gray-600 mt-1">
                Kelola dan pantau status permintaan tur perpustakaan Anda
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{totalTours}</div>
              <div className="text-sm text-gray-500">Total Tur</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white shadow-lg rounded-2xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama grup atau penanggung jawab..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-gray-900"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full lg:w-48 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all bg-white text-gray-900"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu Approval</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
              <option value="cancelled">Dibatalkan</option>
              <option value="completed">Selesai</option>
            </select>
            <Link
              to="/tours"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Tur Baru
            </Link>
          </div>
        </div>

        {/* Tours Grid */}
        <div className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTours.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredTours.map((tour) => {
                const TourIcon = getTourTypeIcon(tour.tourType);
                return (
                  <div key={tour._id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 rounded-lg mr-3">
                            <TourIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{tour.groupName}</h3>
                            <p className="text-sm text-gray-600">{getTourTypeName(tour.tourType)}</p>
                          </div>
                        </div>
                        {getStatusBadge(tour.status)}
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarDaysIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{formatDate(tour.tourDate)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{formatTime(tour.startTime)} ({tour.duration} menit)</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{tour.numberOfParticipants} peserta</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{tour.contactPerson?.name}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedTour(tour)}
                          className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          Detail
                        </button>

                        {tour.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleEditTour(tour)}
                              className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                            >
                              <PencilIcon className="h-4 w-4 mr-2" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleCancelTour(tour._id)}
                              disabled={submitting}
                              className="inline-flex items-center px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              <XMarkIcon className="h-4 w-4 mr-2" />
                              Batal
                            </button>
                          </>
                        )}

                        {(tour.status === 'cancelled' || tour.status === 'rejected' || tour.status === 'completed') && (
                          <button
                            onClick={() => handleDeleteTour(tour._id)}
                            disabled={submitting}
                            className="inline-flex items-center px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
              <div className="p-6">
                <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Tur</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchTerm || filterStatus !== 'all'
                    ? "Tidak ditemukan tur yang cocok dengan filter"
                    : "Anda belum memiliki jadwal tur perpustakaan"}
                </p>
                {!searchTerm && filterStatus === 'all' && (
                  <Link
                    to="/tours"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Jadwal Tur Sekarang
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <nav className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm border-2 border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Sebelumnya
              </button>

              <span className="px-4 py-2 text-sm text-gray-700 font-medium">
                Halaman {currentPage} dari {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm border-2 border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Selanjutnya
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Tour Detail Modal */}
      {selectedTour && !showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm"
              onClick={() => setSelectedTour(null)}
            ></div>
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white rounded-t-3xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold">Detail Tur</h3>
                    <p className="text-blue-100 mt-1">{selectedTour.groupName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTour(null)}
                    className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nama Grup</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1 focus:text-gray-800">{selectedTour.groupName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Jumlah Peserta</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{selectedTour.numberOfParticipants} orang</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tanggal Tur</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{formatDate(selectedTour.tourDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Waktu Mulai</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{formatTime(selectedTour.startTime)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Durasi</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{selectedTour.duration} menit</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tipe Tur</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{getTourTypeName(selectedTour.tourType)}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Penanggung Jawab</label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                      <UserGroupIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-900">{selectedTour.contactPerson?.name}</span>
                    </div>
                    <div className="flex items-center">
                      <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-900">{selectedTour.contactPerson?.phone}</span>
                    </div>
                    {selectedTour.contactPerson?.email && (
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">{selectedTour.contactPerson.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Kelompok Usia</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1 capitalize">
                      {selectedTour.ageGroup === 'children' ? 'Anak-anak' :
                       selectedTour.ageGroup === 'teenagers' ? 'Remaja' :
                       selectedTour.ageGroup === 'adults' ? 'Dewasa' :
                       selectedTour.ageGroup === 'seniors' ? 'Lansia' : 'Campuran'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Bahasa</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1 capitalize">
                      {selectedTour.language === 'indonesia' ? 'Indonesia' :
                       selectedTour.language === 'english' ? 'Inggris' : 'Aceh'}
                    </p>
                  </div>
                </div>

                {selectedTour.specialRequests && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Permintaan Khusus</label>
                    <p className="text-gray-900 mt-2 p-4 bg-gray-50 rounded-xl">{selectedTour.specialRequests}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-2">
                    {getStatusBadge(selectedTour.status)}
                  </div>
                </div>

                {selectedTour.adminNote && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Catatan Admin</label>
                    <p className="text-gray-900 mt-2 p-4 bg-blue-50 rounded-xl border border-blue-200">{selectedTour.adminNote}</p>
                  </div>
                )}

                {selectedTour.assignedGuide && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Pemandu yang Ditetapkan</label>
                    <p className="text-gray-900 mt-2 p-4 bg-green-50 rounded-xl border border-green-200">{selectedTour.assignedGuide}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end p-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedTour(null)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tour Modal */}
      {showEditModal && selectedTour && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm"
              onClick={() => setShowEditModal(false)}
            ></div>
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white rounded-t-3xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold">Edit Tur</h3>
                    <p className="text-blue-100 mt-1">{selectedTour.groupName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Nama Grup/Kelompok *
                    </label>
                    <input
                      type="text"
                      value={editForm.groupName}
                      onChange={(e) => setEditForm({...editForm, groupName: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all focus:text-gray-800 text-gray-800"
                      placeholder="Masukkan nama grup Anda"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Jumlah Peserta *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={editForm.numberOfParticipants}
                      onChange={(e) => setEditForm({...editForm, numberOfParticipants: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all focus:text-gray-800 text-gray-800"
                      placeholder="1-100"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Tanggal Tur *
                    </label>
                    <DatePicker
                      selected={editForm.tourDate}
                      onChange={(date) => setEditForm({...editForm, tourDate: date})}
                      minDate={new Date()}
                      maxDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)}
                      dateFormat="dd/MM/yyyy"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-gray-900"
                      placeholderText="Pilih tanggal tur"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Waktu Mulai *
                    </label>
                    <input
                      type="time"
                      value={editForm.startTime}
                      onChange={(e) => setEditForm({...editForm, startTime: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all focus:text-gray-800 text-gray-800"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Tipe Tur
                    </label>
                    <select
                      value={editForm.tourType}
                      onChange={(e) => setEditForm({...editForm, tourType: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all bg-white text-gray-800 focus:text-gray-800"
                    >
                      <option value="general">Tur Umum</option>
                      <option value="academic">Tur Akademik</option>
                      <option value="research">Tur Riset</option>
                      <option value="special">Tur Khusus</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Durasi (menit)
                    </label>
                    <select
                      value={editForm.duration}
                      onChange={(e) => setEditForm({...editForm, duration: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all bg-white text-gray-800 focus:text-gray-800"
                    >
                      <option value={30}>30 menit</option>
                      <option value={60}>60 menit</option>
                      <option value={90}>90 menit</option>
                      <option value={120}>120 menit</option>
                      <option value={180}>180 menit</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Informasi Penanggung Jawab</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Nama Lengkap *
                      </label>
                      <input
                        type="text"
                        value={editForm.contactPerson.name}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          contactPerson: {...editForm.contactPerson, name: e.target.value}
                        })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-gray-800 focus:text-gray-800"
                        placeholder="Nama penanggung jawab"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Nomor Telepon *
                      </label>
                      <input
                        type="tel"
                        value={editForm.contactPerson.phone}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          contactPerson: {...editForm.contactPerson, phone: e.target.value}
                        })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-gray-800 focus:text-gray-800"
                        placeholder="08xxxxxxxxxx"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Email (Opsional)
                    </label>
                    <input
                      type="email"
                      value={editForm.contactPerson.email}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        contactPerson: {...editForm.contactPerson, email: e.target.value}
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-gray-800 focus:text-gray-800"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Preferensi Tur</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Kelompok Usia
                      </label>
                      <select
                        value={editForm.ageGroup}
                        onChange={(e) => setEditForm({...editForm, ageGroup: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all bg-white text-gray-800 focus:text-gray-800"
                      >
                        <option value="children">Anak-anak</option>
                        <option value="teenagers">Remaja</option>
                        <option value="adults">Dewasa</option>
                        <option value="seniors">Lansia</option>
                        <option value="mixed">Campuran</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Bahasa
                      </label>
                      <select
                        value={editForm.language}
                        onChange={(e) => setEditForm({...editForm, language: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all bg-white text-gray-800 focus:text-gray-800"
                      >
                        <option value="indonesia">Bahasa Indonesia</option>
                        <option value="english">Bahasa Inggris</option>
                        <option value="acehnese">Bahasa Aceh</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Permintaan Khusus (Opsional)
                    </label>
                    <textarea
                      rows={4}
                      value={editForm.specialRequests}
                      onChange={(e) => setEditForm({...editForm, specialRequests: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all resize-none focus:text-gray-800 text-gray-800"
                      placeholder="Jelaskan kebutuhan khusus atau fokus tur yang diinginkan..."
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 cursor-pointer"
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
  );
};

export default MyToursPage;