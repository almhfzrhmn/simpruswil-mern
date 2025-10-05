import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { roomsAPI, bookingsAPI } from "../../services/api";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  EyeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarData, setCalendarData] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterCapacity, setFilterCapacity] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.length >= 2 ? searchTerm : "");
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    activityName: '',
    purpose: '',
    participantsCount: '',
    startTime: null,
    endTime: null,
    notes: '',
    equipment: [],
    document: null
  });

  const loadRooms = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        search: debouncedSearchTerm,
        capacity: filterCapacity !== 'all' ? filterCapacity : undefined
      };

      // Remove undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await roomsAPI.getRooms(params);
      setRooms(response.data.data);
      setCurrentPage(response.data.pagination?.page || 1);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch {
      toast.error("Gagal memuat data ruangan");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, filterCapacity]);

  useEffect(() => {
    loadRooms(1);
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterCapacity, loadRooms]);

  useEffect(() => {
    if (currentPage > 1) {
      loadRooms(currentPage);
    }
  }, [currentPage, loadRooms]);

  const handleBookingSubmit = async (e) => {
    console.log("data yang dikirim", bookingForm)
    e.preventDefault();

    if (!bookingForm.activityName || !bookingForm.purpose || !bookingForm.participantsCount ||
        !bookingForm.startTime || !bookingForm.endTime) {
      toast.error("Mohon lengkapi semua field yang wajib");
      return;
    }

    if (bookingForm.startTime >= bookingForm.endTime) {
      toast.error("Waktu selesai harus setelah waktu mulai");
      return;
    }

    if (parseInt(bookingForm.participantsCount) > selectedRoom.capacity) {
      toast.error(`Jumlah peserta melebihi kapasitas ruangan (${selectedRoom.capacity} orang)`);
      return;
    }

    const formData = new FormData();
    formData.append('roomId', selectedRoom._id);
    formData.append('activityName', bookingForm.activityName);
    formData.append('purpose', bookingForm.purpose);
    formData.append('participantsCount', bookingForm.participantsCount);
    formData.append('startTime', bookingForm.startTime.toISOString());
    formData.append('endTime', bookingForm.endTime.toISOString());
    formData.append('notes', bookingForm.notes || '');
    formData.append('equipment', JSON.stringify(bookingForm.equipment));

    if (bookingForm.document) {
      formData.append('document', bookingForm.document);
    }

    try {
      await bookingsAPI.createBooking(formData);

      toast.success("Booking berhasil diajukan! Menunggu approval admin.");
      setShowBookingModal(false);
      setSelectedRoom(null);
      setBookingForm({
        activityName: '',
        purpose: '',
        participantsCount: '',
        startTime: null,
        endTime: null,
        notes: '',
        equipment: [],
        document: null
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal membuat booking");
    }
  };

  const checkRoomAvailability = async (roomId, startTime, endTime) => {
    try {
      const response = await roomsAPI.checkAvailability(roomId, {
        startTime,
        endTime
      });
      return response.data.available;
    } catch {
      return false;
    }
  };

  const loadCalendar = async (roomId, month = calendarMonth, year = calendarYear) => {
    try {
      const response = await roomsAPI.getCalendar(roomId, { month, year });
      setCalendarData(response.data.data);
    } catch {
      toast.error("Gagal memuat data kalender");
    }
  };

  const handleCalendarNavigation = (direction) => {
    let newMonth = calendarMonth;
    let newYear = calendarYear;

    if (direction === 'prev') {
      newMonth--;
      if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
    } else if (direction === 'next') {
      newMonth++;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      }
    }

    setCalendarMonth(newMonth);
    setCalendarYear(newYear);
    if (selectedRoom) {
      loadCalendar(selectedRoom._id, newMonth, newYear);
    }
  };

  const handleTimeChange = async (field, value) => {
    setBookingForm(prev => ({ ...prev, [field]: value }));

    // Auto-check availability when both times are set
    if (field === 'startTime' && bookingForm.endTime && selectedRoom) {
      const available = await checkRoomAvailability(selectedRoom._id, value.toISOString(), bookingForm.endTime.toISOString());
      if (!available) {
        toast.error("Ruangan tidak tersedia pada waktu tersebut");
      }
    } else if (field === 'endTime' && bookingForm.startTime && selectedRoom) {
      const available = await checkRoomAvailability(selectedRoom._id, bookingForm.startTime.toISOString(), value.toISOString());
      if (!available) {
        toast.error("Ruangan tidak tersedia pada waktu tersebut");
      }
    }
  };

  const filteredRooms = rooms.filter((room) => {
    const search = debouncedSearchTerm.toLowerCase();
    const matchesSearch =
      room.roomName?.toLowerCase().includes(search) ||
      room.description?.toLowerCase().includes(search) ||
      room.location?.toLowerCase().includes(search);

    const matchesCapacity = filterCapacity === "all" ||
      (filterCapacity === "small" && room.capacity <= 20) ||
      (filterCapacity === "medium" && room.capacity > 20 && room.capacity <= 50) ||
      (filterCapacity === "large" && room.capacity > 50);

    return matchesSearch && matchesCapacity;
  });


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ruangan Tersedia</h1>
          <p className="text-sm text-gray-600">
            Pilih dan booking ruangan untuk kegiatan Anda
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari ruangan berdasarkan nama atau lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-black"
            />
          </div>
          <select
            value={filterCapacity}
            onChange={(e) => setFilterCapacity(e.target.value)}
            className="w-full sm:w-48 border border-gray-300 rounded-md text-gray-600"
          >
            <option value="all">Semua Kapasitas</option>
            <option value="small">Kecil (≤20 orang)</option>
            <option value="medium">Sedang (21-50 orang)</option>
            <option value="large">Besar (51+ orang)</option>
          </select>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white shadow rounded-lg p-6 animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))
        ) : filteredRooms.length > 0 ? (
          filteredRooms.map((room) => (
            <div key={room._id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              {/* Room Image */}
              <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                {room.imageUrl ? (
                  <img
                    src={room.imageUrl}
                    alt={room.roomName}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center bg-gray-100">
                    <BuildingOfficeIcon className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Room Info */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{room.roomName}</h3>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircleIcon className="w-3 h-3 mr-1" />
                    Tersedia
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{room.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <UserGroupIcon className="h-4 w-4 mr-2" />
                    Kapasitas: {room.capacity} orang
                  </div>
                  {room.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      {room.location}
                    </div>
                  )}
                  {room.facilities && room.facilities.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Fasilitas:</span> {room.facilities.join(', ')}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedRoom(room)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    <EyeIcon className="h-4 w-4 mr-2" />
                    Detail
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRoom(room);
                      setShowBookingModal(true);
                    }}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Booking
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada ruangan ditemukan</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterCapacity !== 'all'
                ? "Coba ubah kriteria pencarian"
                : "Belum ada ruangan yang tersedia"}
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

      {/* Room Detail Modal */}
      {selectedRoom && !showBookingModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75"
              onClick={() => setSelectedRoom(null)}
            ></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-medium text-blue-600">
                  Detail Ruangan
                </h3>
                <button type="button" onClick={() => setSelectedRoom(null)}>
                  <XMarkIcon className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <div className="p-6">
                {/* Room Image */}
                <div className="mb-6">
                  {selectedRoom.imageUrl ? (
                    <img
                      src={selectedRoom.imageUrl}
                      alt={selectedRoom.roomName}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <BuildingOfficeIcon className="h-24 w-24 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Room Details */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{selectedRoom.roomName}</h4>
                    <p className="text-gray-600 mt-1">{selectedRoom.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Kapasitas: {selectedRoom.capacity} orang</span>
                    </div>
                    {selectedRoom.location && (
                      <div className="flex items-center">
                        <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">{selectedRoom.location}</span>
                      </div>
                    )}
                  </div>

                  {selectedRoom.facilities && selectedRoom.facilities.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Fasilitas</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedRoom.facilities.map((facility, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {facility}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedRoom.operatingHours && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Jam Operasional</h5>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">
                          {selectedRoom.operatingHours.start} - {selectedRoom.operatingHours.end}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end p-6 border-t gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRoom(null)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    const now = new Date();
                    setCalendarMonth(now.getMonth() + 1);
                    setCalendarYear(now.getFullYear());
                    setShowCalendarModal(true);
                    loadCalendar(selectedRoom._id, now.getMonth() + 1, now.getFullYear());
                  }}
                  className="px-4 py-2 bg-gray-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-gray-700"
                >
                  Lihat Kalender
                </button>
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                >
                  Booking Ruangan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedRoom && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75"
              onClick={() => setShowBookingModal(false)}
            ></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-medium text-blue-600">
                  Booking Ruangan: {selectedRoom.roomName}
                </h3>
                <button type="button" onClick={() => setShowBookingModal(false)}>
                  <XMarkIcon className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nama Kegiatan *
                    </label>
                    <input
                      type="text"
                      value={bookingForm.activityName}
                      onChange={(e) => setBookingForm({...bookingForm, activityName: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tujuan Kegiatan *
                    </label>
                    <input
                      type="text"
                      value={bookingForm.purpose}
                      onChange={(e) => setBookingForm({...bookingForm, purpose: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Jumlah Peserta *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedRoom.capacity}
                    value={bookingForm.participantsCount}
                    onChange={(e) => setBookingForm({...bookingForm, participantsCount: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">Maksimal {selectedRoom.capacity} orang</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Waktu Mulai *
                    </label>
                    <DatePicker
                      selected={bookingForm.startTime}
                      onChange={(date) => handleTimeChange('startTime', date)}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="dd/MM/yyyy HH:mm"
                      minDate={new Date()}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                      placeholderText="Pilih tanggal dan waktu mulai"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Waktu Selesai *
                    </label>
                    <DatePicker
                      selected={bookingForm.endTime}
                      onChange={(date) => handleTimeChange('endTime', date)}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="dd/MM/yyyy HH:mm"
                      minDate={bookingForm.startTime || new Date()}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                      placeholderText="Pilih tanggal dan waktu selesai"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Deskripsi Kegiatan
                  </label>
                  <textarea
                    rows={3}
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm({...bookingForm, notes: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                    placeholder="Jelaskan detail kegiatan yang akan dilakukan..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dokumen Surat (opsional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setBookingForm({...bookingForm, document: e.target.files[0]})}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-1 text-sm text-gray-500">Format: PDF, DOC, DOCX, JPG, PNG. Maksimal 5MB</p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-4xl text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                  >
                    Ajukan Booking
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendarModal && selectedRoom && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75"
              onClick={() => setShowCalendarModal(false)}
            ></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-medium text-blue-600">
                  Kalender Booking - {selectedRoom.roomName}
                </h3>
                <button type="button" onClick={() => {
                  setShowCalendarModal(false);
                  setCalendarData(null);
                }}>
                  <XMarkIcon className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <div className="p-6">
                {/* Calendar Navigation */}
                <div className="flex justify-between items-center mb-6">
                  <button
                    onClick={() => handleCalendarNavigation('prev')}
                    className="bg-gray-700 p-2 hover:bg-gray-100 hover:text-black rounded-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h4 className="text-xl font-semibold text-gray-900">
                    {new Date(calendarYear, calendarMonth - 1).toLocaleDateString('id-ID', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </h4>
                  <button
                    onClick={() => handleCalendarNavigation('next')}
                    className="bg-gray-700 p-2 hover:bg-gray-100 hover:text-gray-900 rounded-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Calendar Grid */}
                {calendarData ? (
                  <div className="grid grid-cols-7 gap-1">
                    {/* Day headers */}
                    {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                      <div key={day} className="p-2 text-center font-medium text-gray-500 text-sm">
                        {day}
                      </div>
                    ))}

                    {/* Empty cells for days before first day of month */}
                    {Array.from({ length: new Date(calendarYear, calendarMonth - 1, 1).getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} className="p-2"></div>
                    ))}

                    {/* Calendar days */}
                    {calendarData.calendar.map((dayData, index) => (
                      <div
                        key={index}
                        className={`p-2 border rounded-md min-h-[80px] ${
                          dayData.hasBookings
                            ? 'bg-red-600  border-red-200'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {dayData.day}
                        </div>
                        {dayData.bookings.length > 0 && (
                          <div className="space-y-1">
                            {dayData.bookings.slice(0, 2).map((booking, bIndex) => (
                              <div
                                key={bIndex}
                                className={`text-xs p-1 rounded ${
                                  booking.status === 'approved'
                                    ? 'bg-green-300 text-green-800'
                                    : booking.status === 'pending'
                                    ? 'bg-yellow-400 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                <div className="font-medium truncate">{booking.activityName}</div>
                                <div className="text-xs">
                                  {new Date(booking.startTime).toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })} - {new Date(booking.endTime).toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                            ))}
                            {dayData.bookings.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{dayData.bookings.length - 2} lagi
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-center items-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                )}

                {/* Legend */}
                <div className="mt-6 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-white border border-gray-200 rounded mr-2"></div>
                    <span className="text-green-700">Tersedia</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-700 border border-red-200 rounded mr-2"></div>
                    <span className="text-red-700">Ada Booking</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-300 rounded mr-2"></div>
                    <span className="text-green-700">Approved</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-400 rounded mr-2"></div>
                    <span className="text-yellow-400">Pending</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end p-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCalendarModal(false);
                    setCalendarData(null);
                  }}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomsPage;