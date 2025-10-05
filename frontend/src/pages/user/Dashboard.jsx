// src/pages/user/Dashboard.jsx - User Dashboard
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { roomsAPI, bookingsAPI, toursAPI } from '../../services/api';
import {
  BuildingOfficeIcon,
  CalendarDaysIcon,
  BookOpenIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import RoomCarousel from '../../components/RoomCarousel';

const Dashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentTours, setRecentTours] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    totalTours: 0
  });
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  const loadCalendarEvents = useCallback(async (bookings) => {
    const events = [];
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Add bookings to calendar
    bookings.forEach(booking => {
      const bookingDate = new Date(booking.startTime);
      if (bookingDate >= today && bookingDate <= nextWeek && booking.status === 'approved') {
        events.push({
          id: booking._id,
          title: booking.activityName,
          date: bookingDate,
          type: 'booking',
          room: booking.roomId?.roomName,
          time: formatTime(booking.startTime)
        });
      }
    });

    // Sort events by date
    events.sort((a, b) => a.date - b.date);
    setCalendarEvents(events);
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load rooms
      const roomsResponse = await roomsAPI.getRooms({ limit: 10 });
      setRooms(roomsResponse.data.data);

      // Load recent bookings
      const bookingsResponse = await bookingsAPI.getMyBookings({ limit: 5 });
      setRecentBookings(bookingsResponse.data.data);

      // Load recent tours
      const toursResponse = await toursAPI.getMyTours({ limit: 5 });
      setRecentTours(toursResponse.data.data);

      // Load calendar events
      await loadCalendarEvents(bookingsResponse.data.data);

      // Calculate stats
      const allBookings = await bookingsAPI.getMyBookings({ limit: 1000 });
      const allTours = await toursAPI.getMyTours({ limit: 1000 });
      
      const bookingData = allBookings.data.data;
      const tourData = allTours.data.data;

      setStats({
        totalBookings: bookingData.length,
        pendingBookings: bookingData.filter(b => b.status === 'pending').length,
        approvedBookings: bookingData.filter(b => b.status === 'approved').length,
        totalTours: tourData.length
      });

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadCalendarEvents]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        icon: ClockIcon,
        class: 'bg-yellow-100 text-yellow-800',
        text: 'Pending'
      },
      approved: {
        icon: CheckCircleIcon,
        class: 'bg-green-100 text-green-800',
        text: 'Disetujui'
      },
      rejected: {
        icon: XCircleIcon,
        class: 'bg-red-100 text-red-800',
        text: 'Ditolak'
      },
      cancelled: {
        icon: ExclamationTriangleIcon,
        class: 'bg-gray-100 text-gray-800',
        text: 'Dibatalkan'
      }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.class}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCalendarDate = (date) => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: months[date.getMonth()],
      year: date.getFullYear()
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex gap-8 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Main Content */}
      <div className="flex-1 space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-sm">
          <div className="px-8 py-8 sm:px-8 relative">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-md"></div>
            <div className="relative flex items-center">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                  Selamat datang, {user?.name}!
                </h1>
                <p className="mt-2 text-blue-100 text-lg drop-shadow-md">
                  Kelola booking ruangan dan jadwal tur perpustakaan Anda
                </p>
              </div>
              <div className="hidden sm:block">
                <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
                  <BookOpenIcon className="h-20 w-20 text-white drop-shadow-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white/80 backdrop-blur-lg overflow-hidden shadow-xl rounded-2xl border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-blue-100/80 rounded-xl p-3 backdrop-blur-sm">
                    <CalendarDaysIcon className="h-7 w-7 text-blue-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-semibold text-gray-600 truncate">
                      Total Booking
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.totalBookings}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg overflow-hidden shadow-xl rounded-2xl border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-yellow-100/80 rounded-xl p-3 backdrop-blur-sm">
                    <ClockIcon className="h-7 w-7 text-yellow-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-semibold text-gray-600 truncate">
                      Menunggu Approval
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.pendingBookings}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg overflow-hidden shadow-xl rounded-2xl border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-green-100/80 rounded-xl p-3 backdrop-blur-sm">
                    <CheckCircleIcon className="h-7 w-7 text-green-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-semibold text-gray-600 truncate">
                      Booking Disetujui
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.approvedBookings}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg overflow-hidden shadow-xl rounded-2xl border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-purple-100/80 rounded-xl p-3 backdrop-blur-sm">
                    <BookOpenIcon className="h-7 w-7 text-purple-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-semibold text-gray-600 truncate">
                      Total Tur
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.totalTours}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/60 backdrop-blur-lg shadow-xl rounded-3xl border border-white/30 overflow-hidden">
          <div className="px-6 py-6 sm:p-8">
            <h3 className="text-xl leading-6 font-bold text-gray-900 mb-6 drop-shadow-sm">
              Aksi Cepat
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <Link
                to="/rooms"
                className="relative group bg-gradient-to-br from-blue-50 to-blue-100/80 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-2xl hover:shadow-xl transition-all duration-300 backdrop-blur-sm border border-blue-200/50"
              >
                <div>
                  <span className="rounded-xl inline-flex p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                    <BuildingOfficeIcon className="h-7 w-7" />
                  </span>
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-semibold text-gray-900 drop-shadow-sm">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Booking Ruangan
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Pilih dan booking ruangan untuk kegiatan Anda
                  </p>
                </div>
              </Link>

              <Link
                to="/tours"
                className="relative group bg-gradient-to-br from-purple-50 to-purple-100/80 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-purple-500 rounded-2xl hover:shadow-xl transition-all duration-300 backdrop-blur-sm border border-purple-200/50"
              >
                <div>
                  <span className="rounded-xl inline-flex p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                    <BookOpenIcon className="h-7 w-7" />
                  </span>
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-semibold text-gray-900 drop-shadow-sm">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Jadwal Tur
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Ajukan jadwal tur perpustakaan untuk kelompok
                  </p>
                </div>
              </Link>

              <Link
                to="/my-bookings"
                className="relative group bg-gradient-to-br from-green-50 to-green-100/80 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-500 rounded-2xl hover:shadow-xl transition-all duration-300 backdrop-blur-sm border border-green-200/50"
              >
                <div>
                  <span className="rounded-xl inline-flex p-4 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                    <CalendarDaysIcon className="h-7 w-7" />
                  </span>
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-semibold text-gray-900 drop-shadow-sm">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Riwayat Booking
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Lihat status dan riwayat booking Anda
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Recent Bookings */}
          <div className="bg-white/70 backdrop-blur-lg shadow-xl rounded-3xl border border-white/30 overflow-hidden">
            <div className="px-6 py-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl leading-6 font-bold text-gray-900 drop-shadow-sm">
                  Booking Terbaru
                </h3>
                <Link
                  to="/my-bookings"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Lihat semua →
                </Link>
              </div>

              {recentBookings.length > 0 ? (
                <div className="space-y-4">
                  {recentBookings.slice(0, 3).map((booking) => (
                    <div key={booking._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/80 rounded-2xl backdrop-blur-sm border border-gray-200/50 hover:shadow-md transition-all duration-200">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {booking.activityName}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {booking.roomId?.roomName} • {formatDate(booking.startTime)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(booking.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gray-100/80 rounded-2xl p-4 inline-block backdrop-blur-sm">
                    <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-gray-900">Belum ada booking</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Mulai booking ruangan untuk kegiatan Anda
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/rooms"
                      className="inline-flex items-center px-6 py-3 border border-transparent shadow-lg text-sm font-semibold rounded-2xl text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                    >
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                      Booking Sekarang
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Tours */}
          <div className="bg-white/70 backdrop-blur-lg shadow-xl rounded-3xl border border-white/30 overflow-hidden">
            <div className="px-6 py-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl leading-6 font-bold text-gray-900 drop-shadow-sm">
                  Tur Terbaru
                </h3>
                <Link
                  to="/my-tours"
                  className="text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors"
                >
                  Lihat semua →
                </Link>
              </div>

              {recentTours.length > 0 ? (
                <div className="space-y-4">
                  {recentTours.slice(0, 3).map((tour) => (
                    <div key={tour._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/80 rounded-2xl backdrop-blur-sm border border-gray-200/50 hover:shadow-md transition-all duration-200">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {tour.groupName}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {tour.numberOfParticipants} peserta • {formatDate(tour.tourDate)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(tour.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-purple-100/80 rounded-2xl p-4 inline-block backdrop-blur-sm">
                    <BookOpenIcon className="mx-auto h-12 w-12 text-purple-400" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-gray-900">Belum ada tur</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Ajukan jadwal tur perpustakaan untuk kelompok Anda
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/tours"
                      className="inline-flex items-center px-6 py-3 border border-transparent shadow-lg text-sm font-semibold rounded-2xl text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
                    >
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                      Jadwal Tur
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Room Carousel - Replaced Static Room Section */}
        <div className="bg-white/60 backdrop-blur-lg shadow-xl rounded-3xl border border-white/30 overflow-hidden p-8">
          <RoomCarousel rooms={rooms} />
        </div>

        
        
      </div>

      {/* Side Calendar */}
      <div className="hidden xl:block w-80">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 sticky top-6 backdrop-blur-lg shadow-xl border border-emerald-200/50">
          <h3 className="text-xl font-bold text-gray-900 mb-6 drop-shadow-sm">Kalender Anda</h3>

          {calendarEvents.length > 0 ? (
            <div className="space-y-4">
              {calendarEvents.map((event) => {
                const dateInfo = formatCalendarDate(event.date);
                return (
                  <div key={event.id} className="bg-white/80 rounded-2xl p-5 shadow-lg border border-emerald-200/30 backdrop-blur-sm hover:shadow-xl transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="text-center bg-emerald-100/80 rounded-xl p-3 backdrop-blur-sm min-w-[60px]">
                        <p className="text-xs text-emerald-700 font-semibold">{dateInfo.day}</p>
                        <p className="text-2xl font-bold text-emerald-900">{dateInfo.date}</p>
                        <p className="text-xs text-emerald-600">{dateInfo.month}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-emerald-600 mb-2 font-medium">{event.time}</p>
                        <h4 className="text-sm font-bold text-gray-900 truncate">
                          {event.title}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {event.room}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-emerald-100/60 rounded-2xl p-4 inline-block backdrop-blur-sm">
                <CalendarDaysIcon className="mx-auto h-12 w-12 text-emerald-400" />
              </div>
              <p className="mt-4 text-sm text-emerald-700 font-medium">
                Belum ada jadwal minggu ini
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;