import React, { useState, useEffect } from "react";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { roomsAPI } from "../../services/api";

// Mock Link component for demonstration
const Link = ({ to, children, className, ...props }) => (
  <a href={to} className={className} {...props}>
    {children}
  </a>
);
const handleScroll = (e, targetId) => {
  e.preventDefault();
  const targetElement = document.getElementById(targetId);
  if (targetElement) {
    targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

// Custom SVG Icons to replace Heroicons
const BookOpenIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  </svg>
);

const BuildingOfficeIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
);

const CalendarDaysIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const BellIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

const CheckCircleIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ClockIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const UserGroupIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

const ChevronDownIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

const ChevronUpIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 15l7-7 7 7"
    />
  </svg>
);

const LandingPage = () => {
  const [openFAQ, setOpenFAQ] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await roomsAPI.getRooms({ isActive: true });
        const roomsData = response?.data?.data;
        setRooms(Array.isArray(roomsData) ? roomsData : []);
      } catch (error) {
        console.error("Error fetching rooms:", error);
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to prevent race conditions
    const timer = setTimeout(fetchRooms, 100);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: CalendarDaysIcon,
      title: "Jadwal Transparan",
      description:
        "Lihat ketersediaan ruangan secara real-time dengan kalender yang mudah dipahami",
    },
    {
      icon: ClockIcon,
      title: "Proses Instan",
      description:
        "Ajukan peminjaman ruangan hanya dalam hitungan menit dengan proses yang sederhana",
    },
    {
      icon: BellIcon,
      title: "Notifikasi Cerdas",
      description:
        "Dapatkan update status pengajuan langsung melalui email dan sistem notifikasi",
    },
  ];

  const steps = [
    {
      step: 1,
      title: "Pilih Ruang",
      description:
        "Browse dan pilih ruangan yang sesuai dengan kebutuhan acara Anda",
      icon: BuildingOfficeIcon,
    },
    {
      step: 2,
      title: "Isi Form",
      description:
        "Lengkapi formulir booking dengan detail kegiatan dan upload dokumen pendukung",
      icon: CheckCircleIcon,
    },
    {
      step: 3,
      title: "Dapatkan Konfirmasi",
      description:
        "Tunggu persetujuan admin dan dapatkan notifikasi konfirmasi booking",
      icon: BellIcon,
    },
  ];

  const faqs = [
    {
      question: "Bagaimana cara membuat akun SIMPRUSWIL?",
      answer:
        'Klik tombol "Register" di halaman utama, isi formulir pendaftaran dengan data yang valid, kemudian verifikasi email Anda untuk mengaktifkan akun.',
    },
    {
      question: "Berapa lama proses persetujuan booking?",
      answer:
        "Proses persetujuan biasanya memakan waktu 1-3 hari kerja. Anda akan mendapatkan notifikasi email segera setelah admin memproses pengajuan Anda.",
    },
    {
      question: "Dokumen apa saja yang perlu diupload?",
      answer:
        "Anda perlu mengupload surat resmi dari instansi yang menjelaskan tujuan penggunaan ruangan. Format yang diterima: PDF, DOC, DOCX, JPG, PNG.",
    },
    {
      question: "Apakah ada biaya untuk booking ruangan?",
      answer:
        "Untuk informasi mengenai biaya booking, silakan hubungi langsung pihak Pustaka Wilayah Aceh atau admin sistem.",
    },
    {
      question: "Bagaimana cara membatalkan booking?",
      answer:
        'Anda dapat membatalkan booking melalui halaman "Booking Saya" selama booking masih dalam status pending atau belum melewati waktu yang dijadwalkan.',
    },
  ];

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20 top-0 z-50 fixed w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center group">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                <BookOpenIcon className="h-8 w-8 text-white" />
              </div>
              <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                SIMPRUSWIL
              </span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a
                href="#features"
                className="text-gray-700 hover:text-red-600 transition-all duration-300 font-medium relative group"
                onClick={(e) => handleScroll(e, "features")}
              >
                Fitur
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a
                href="#rooms"
                className="text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium relative group"
                onClick={(e) => handleScroll(e, "rooms")}
              >
                Ruangan
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a
                href="#how-it-works"
                className="text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium relative group"
                onClick={(e) => handleScroll(e, "how-it-works")}
              >
                Cara Kerja
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a
                href="#faq"
                className="text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium relative group"
                onClick={(e) => handleScroll(e, "faq")}
              >
                FAQ
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </a>
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-blue-600 font-semibold transition-all duration-300"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-4xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden flex items-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="absolute top-0 left-0 right-0 bottom-0 w-full h-full bg-gradient-to-br from-blue-100/30 via-transparent to-indigo-100/30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="mb-8 animate-fade-in">
              {/* Animated Text */}
              <h1 className="text-5xl md:text-7xl font-bold text-center text-gray-900 leading-normal">
                Selamat Datang di SIMPRUSWIL
              </h1>
              <p className="text-lg md:text-xl font-medium text-center text-gray-700 leading-normal">
                Sistem Informasi Peminjaman Ruang Pustaka Wilayah
              </p>
            </div>
            <p className="text-md md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Platform online Pustaka Wilayah Aceh yang
              <span className="font-semibold text-blue-600"> efisien</span>,
              <span className="font-semibold text-indigo-600"> transparan</span>
              , dan{" "}
              <span className="font-semibold text-purple-600">
                mudah digunakan
              </span>{" "}
              untuk mengelola semua kebutuhan peminjaman ruang dan penjadwalan
              tur Pustaka Wilayah
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                to="/register"
                className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-7 py-5 rounded-4xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-bold text-md shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-1 hover:scale-105 hover:bg-red-600"
              >
                <span className="flex items-center justify-center text-white">
                  Mulai Booking
                </span>
              </Link>
              <a
                href="#rooms"
                className="px-7 py-5 rounded-4xl group bg-gradient-to-r from-blue-700 to-red-500 text-white font-bold text-md shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 flex items-center justify-center"
                onClick={(e) => handleScroll(e, "rooms")}
              >
                Lihat Ruang
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-24 bg-white/50 backdrop-blur-sm relative z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Mengapa Memilih
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent block leading-normal">
                SIMPRUSWIL?
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Platform terdepan dengan teknologi modern untuk kemudahan booking
              ruangan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group text-center p-10 bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-10 h-10 text-blue-600 group-hover:text-indigo-600 transition-colors duration-300" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 group-hover:text-blue-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Rooms Section */}
      <section
        id="rooms"
        className="py-24 bg-gradient-to-br from-gray-50 to-blue-50 relative z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
              Pilihan Ruangan
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent block leading-normal">
                untuk Agenda Anda
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Berbagai pilihan ruangan dengan fasilitas terbaik untuk acara Anda
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {loading ? (
              <div className="col-span-full flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : !rooms || rooms.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-600 text-lg">
                  Tidak ada ruangan tersedia saat ini.
                </p>
              </div>
            ) : (
              rooms.map((room) => (
                <div
                  key={room._id}
                  className="group bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border border-gray-100"
                >
                  <div className="h-56 bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center relative overflow-hidden">
                    {room.imageUrl ? (
                      <img
                        src={room.imageUrl}
                        alt={room.roomName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BuildingOfficeIcon className="w-20 h-20 text-blue-600 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-indigo-600/20"></div>
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-sm font-semibold text-gray-700">
                        Premium
                      </span>
                    </div>
                  </div>
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                      {room.roomName}
                    </h3>
                    <p className="text-gray-600 mb-6 text-lg">
                      {room.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-500 bg-gray-50 px-4 py-2 rounded-xl">
                        <UserGroupIcon className="w-5 h-5 mr-2 text-blue-600" />
                        <span className="font-semibold">
                          {room.capacity} orang
                        </span>
                      </div>
                      <Link
                        to="/register"
                        className="group/link bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <span className="flex items-center">
                          Book Now
                          <svg
                            className="ml-1 w-4 h-4 group-hover/link:translate-x-1 transition-transform duration-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-white/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Tiga Langkah
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent block">
                Menuju Kesuksesan
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Proses booking yang simpel dan efisien untuk ruangan impian Anda
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map((step) => (
              <div key={step.step} className="text-center relative">
                {step.step < 3 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-1 bg-gradient-to-r from-blue-200 to-indigo-200 z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 w-0 animate-pulse"></div>
                  </div>
                )}
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-4xl flex items-center justify-center mx-auto mb-6 font-bold text-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110">
                    {step.step}
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-6 hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed max-w-sm mx-auto">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        id="faq"
        className="py-24 bg-gradient-to-br from-gray-50 to-indigo-50 relative z-10"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Pertanyaan Yang Sering
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent block leading-normal">
                Diajukan
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              Temukan jawaban atas pertanyaan seputar SIMPRUSWIL
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50"
              >
                <button
                  className="w-full px-8 py-6 text-left flex justify-between items-center hover:bg-blue-50/50 transition-all duration-300 rounded-2xl group"
                  onClick={() => toggleFAQ(index)}
                >
                  <span className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors duration-300">
                    {faq.question}
                  </span>
                  <div className="p-2 bg-blue-100 rounded-xl group-hover:bg-blue-600 transition-all duration-300">
                    {openFAQ === index ? (
                      <ChevronUpIcon className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors duration-300" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors duration-300" />
                    )}
                  </div>
                </button>
                {openFAQ === index && (
                  <div className="px-8 pb-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent mb-4"></div>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center mb-6">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                  <BookOpenIcon className="h-8 w-8 text-white" />
                </div>
                <span className="ml-3 text-2xl font-bold">SIMPRUSWIL</span>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">
                Sistem peminjaman ruang dan penjadwalan tur online untuk Pustaka
                Wilayah Aceh
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-6 text-blue-300">Kontak</h3>
              <div className="space-y-4 text-gray-300">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <div>
                    <p className="font-semibold">Pustaka Wilayah Aceh</p>
                    <p>Jl. T. Nyak Arief No. 1, Banda Aceh</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                  <p>Email: info@pustaka-aceh.go.id</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <p>Tel: (0651) 1234567</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-6 text-blue-300">
                Tautan Cepat
              </h3>
              <div className="space-y-4">
                <Link
                  to="/register"
                  className="block text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-2 transform"
                >
                  → Buat Akun
                </Link>
                <Link
                  to="/login"
                  className="block text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-2 transform"
                >
                  → Login
                </Link>
                <a
                  href="#faq"
                  className="block text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-2 transform"
                  onClick={(e) => handleScroll(e, "faq")}
                >
                  → FAQ
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8">
            <p className="text-gray-400 text-center font-semibold">
              &copy; 2024 SIMPRUSWIL - Pustaka Wilayah Aceh. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;