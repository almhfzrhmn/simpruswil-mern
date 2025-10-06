import React, { useState, useEffect, useCallback } from "react";
import { toursAPI } from "../../services/api";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  AcademicCapIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
  SparklesIcon,
  GlobeAltIcon,
  BookOpenIcon,
  UsersIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

const ToursPage = () => {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Tour booking form state
  const [tourForm, setTourForm] = useState({
    groupName: '',
    numberOfParticipants: '',
    tourDate: '',
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

  const [documentFile, setDocumentFile] = useState(null);

  const loadAvailableSlots = useCallback(async (date) => {
    if (!date) return;

    try {
      setLoading(true);
      const dateString = date.toISOString().split('T')[0];
      const response = await toursAPI.getAvailableSlots({ date: dateString });
      setAvailableSlots(response.data.data.availableSlots);
    } catch (error) {
      console.error('Error loading slots:', error);
      toast.error("Gagal memuat slot tersedia");
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate, loadAvailableSlots]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date) {
      // Format date in local timezone to avoid UTC conversion issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const localDateString = `${year}-${month}-${day}`;
      setTourForm(prev => ({ ...prev, tourDate: localDateString }));
    }
  };

  const handleSlotSelect = (slot) => {
    const startTime = new Date(slot.startTime);
    const timeString = startTime.toTimeString().substring(0, 5); // HH:MM format

    setSelectedSlot(slot);
    setTourForm(prev => ({
      ...prev,
      startTime: timeString,
      duration: slot.duration
    }));
    setShowBookingModal(true);
  };

  const handleTourSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!tourForm.groupName || !tourForm.numberOfParticipants ||
        !tourForm.tourDate || !tourForm.startTime ||
        !tourForm.contactPerson.name || !tourForm.contactPerson.phone) {
      toast.error("Mohon lengkapi semua field yang wajib");
      return;
    }

    if (parseInt(tourForm.numberOfParticipants) < 1) {
      toast.error("Jumlah peserta minimal 1 orang");
      return;
    }

    // Combine date and time
    const startDateTime = new Date(`${tourForm.tourDate}T${tourForm.startTime}`);

    if (startDateTime < new Date()) {
      toast.error("Tidak dapat memilih waktu yang sudah lewat");
      return;
    }

    const formData = new FormData();
    Object.keys(tourForm).forEach(key => {
      if (key === 'contactPerson') {
        formData.append(key, JSON.stringify(tourForm[key]));
      } else {
        formData.append(key, tourForm[key]);
      }
    });

    if (documentFile) {
      formData.append('document', documentFile);
    }

    try {
      await toursAPI.createTour(formData);
      toast.success("Permintaan tur berhasil diajukan! Menunggu approval admin.");

      // Reset form
      setTourForm({
        groupName: '',
        numberOfParticipants: '',
        tourDate: '',
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
      setDocumentFile(null);
      setShowBookingModal(false);
      setSelectedDate(null);
      setAvailableSlots([]);
      setSelectedSlot(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal mengajukan tur");
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const tourTypes = [
    {
      id: 'general',
      name: 'Tur Umum',
      description: 'Tur perpustakaan standar untuk semua kalangan',
      icon: BookOpenIcon,
      color: 'bg-blue-500'
    },
    {
      id: 'academic',
      name: 'Tur Akademik',
      description: 'Tur khusus untuk mahasiswa dan peneliti',
      icon: AcademicCapIcon,
      color: 'bg-green-500'
    },
    {
      id: 'research',
      name: 'Tur Riset',
      description: 'Tur fokus pada koleksi riset dan referensi',
      icon: GlobeAltIcon,
      color: 'bg-purple-500'
    },
    {
      id: 'special',
      name: 'Tur Khusus',
      description: 'Tur dengan program khusus sesuai kebutuhan',
      icon: SparklesIcon,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/10 rounded-full backdrop-blur-sm">
                <AcademicCapIcon className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Tur Perpustakaan
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Jelajahi dunia pengetahuan bersama kami. Rasakan pengalaman unik mengeksplorasi koleksi perpustakaan yang kaya dan fasilitas modern.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tour Types Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Pilih Jenis Tur</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Kami menyediakan berbagai jenis tur perpustakaan yang disesuaikan dengan kebutuhan dan minat Anda
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tourTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div
                  key={type.id}
                  className={`relative p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 ${
                    tourForm.tourType === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                  onClick={() => setTourForm(prev => ({ ...prev, tourType: type.id }))}
                >
                  <div className={`inline-flex p-3 rounded-xl ${type.color} text-white mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{type.name}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{type.description}</p>
                  {tourForm.tourType === type.id && (
                    <div className="absolute top-4 right-4">
                      <CheckCircleIcon className="h-6 w-6 text-blue-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Booking Section */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-white">
            <h2 className="text-2xl font-bold mb-2">Jadwalkan Tur Anda</h2>
            <p className="text-blue-100">Pilih tanggal dan waktu yang sesuai untuk kunjungan Anda</p>
          </div>

          <div className="p-8">
            {/* Date Selection */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                Pilih Tanggal Kunjungan
              </label>
              <div className="max-w-md">
                <DatePicker
                  selected={selectedDate}
                  onChange={handleDateChange}
                  minDate={new Date()}
                  maxDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)}
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-gray-900 text-lg"
                  placeholderText="Pilih tanggal kunjungan"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Pilih tanggal untuk melihat jadwal yang tersedia
                </p>
              </div>
            </div>

            {/* Available Slots */}
            {selectedDate && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Slot Waktu Tersedia - {selectedDate.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h3>

                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableSlots.map((slot, index) => (
                      <div
                        key={index}
                        className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl hover:border-green-300 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                        onClick={() => handleSlotSelect(slot)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <ClockIcon className="h-5 w-5 text-green-600 mr-2" />
                            <span className="font-semibold text-gray-900">
                              {formatTime(slot.startTime)}
                            </span>
                          </div>
                          <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            {slot.duration} menit
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Selesai pukul {formatTime(slot.endTime)}
                        </p>
                        <div className="flex items-center text-green-700 font-medium group-hover:text-green-800">
                          <span>Pilih Slot</span>
                          <CheckCircleIcon className="h-4 w-4 ml-2 group-hover:scale-110 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Slot Tersedia</h4>
                    <p className="text-gray-600">
                      Maaf, semua slot untuk tanggal ini sudah terisi. Silakan pilih tanggal lain.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                <div className="flex items-center mb-3">
                  <UsersIcon className="h-6 w-6 text-blue-600 mr-3" />
                  <h4 className="font-semibold text-blue-900">Kapasitas Fleksibel</h4>
                </div>
                <p className="text-blue-700">Dapat menampung berbagai ukuran grup</p>
              </div>

              <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                <div className="flex items-center mb-3">
                  <ClockIcon className="h-6 w-6 text-green-600 mr-3" />
                  <h4 className="font-semibold text-green-900">Durasi Tur</h4>
                </div>
                <p className="text-green-700">60 menit sesi tur interaktif</p>
              </div>

              <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                <div className="flex items-center mb-3">
                  <StarIcon className="h-6 w-6 text-purple-600 mr-3" />
                  <h4 className="font-semibold text-purple-900">Pengalaman Unik</h4>
                </div>
                <p className="text-purple-700">Eksplorasi koleksi dan fasilitas modern</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm"
              onClick={() => setShowBookingModal(false)}
            ></div>
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white rounded-t-3xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold">Detail Pemesanan Tur</h3>
                    <p className="text-blue-100 mt-1">
                      {selectedDate?.toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} • {formatTime(selectedSlot?.startTime)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleTourSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Nama Grup/Kelompok *
                    </label>
                    <input
                      type="text"
                      value={tourForm.groupName}
                      onChange={(e) => setTourForm({...tourForm, groupName: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-gray-900"
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
                      value={tourForm.numberOfParticipants}
                      onChange={(e) => setTourForm({...tourForm, numberOfParticipants: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-gray-900"
                      placeholder="Jumlah peserta"
                      required
                    />
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
                        value={tourForm.contactPerson.name}
                        onChange={(e) => setTourForm({
                          ...tourForm,
                          contactPerson: {...tourForm.contactPerson, name: e.target.value}
                        })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-gray-900"
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
                        value={tourForm.contactPerson.phone}
                        onChange={(e) => setTourForm({
                          ...tourForm,
                          contactPerson: {...tourForm.contactPerson, phone: e.target.value}
                        })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-gray-900"
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
                      value={tourForm.contactPerson.email}
                      onChange={(e) => setTourForm({
                        ...tourForm,
                        contactPerson: {...tourForm.contactPerson, email: e.target.value}
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-gray-900"
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
                        value={tourForm.ageGroup}
                        onChange={(e) => setTourForm({...tourForm, ageGroup: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all bg-white text-gray-900"
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
                        value={tourForm.language}
                        onChange={(e) => setTourForm({...tourForm, language: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all bg-white text-gray-900"
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
                      value={tourForm.specialRequests}
                      onChange={(e) => setTourForm({...tourForm, specialRequests: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all resize-none text-gray-900"
                      placeholder="Jelaskan kebutuhan khusus atau fokus tur yang diinginkan..."
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Dokumen Persyaratan (Opsional)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setDocumentFile(e.target.files[0])}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Upload dokumen persyaratan (PDF, DOC, DOCX, JPG, PNG) maksimal 5MB
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-start">
                      <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h5 className="font-semibold text-blue-900 mb-1">Informasi Penting</h5>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Konfirmasi tur akan dikirim via email/SMS</li>
                          <li>• Datang 15 menit sebelum waktu yang dijadwalkan</li>
                          <li>• Bawa kartu identitas untuk verifikasi</li>
                          <li>• Tur dapat dibatalkan maksimal 24 jam sebelumnya</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl"
                  >
                    Ajukan Tur Sekarang
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

export default ToursPage;