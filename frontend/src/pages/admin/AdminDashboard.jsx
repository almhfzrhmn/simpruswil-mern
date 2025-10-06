import React, { useEffect, useState, useCallback, useRef } from "react";
import { adminAPI } from "../../services/api";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import {
  UserGroupIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ClockIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ChartPieIcon,
  CheckCircleIcon,
  PlusIcon,
  DocumentIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

// Import chart components normally since lazy loading individual components causes rendering issues
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Area,
  AreaChart,
} from "recharts";

function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [activityTrendData, setActivityTrendData] = useState([]);
  const [participantsTrendData, setParticipantsTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedWeek, setSelectedWeek] = useState(0); // 0-3 untuk 4 minggu dalam bulan
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // Current month (0-11)
  const [animatedValues, setAnimatedValues] = useState({});
  const [dashboardCache, setDashboardCache] = useState(null);
  const [statsCache, setStatsCache] = useState({});
  const [lastFetchDate, setLastFetchDate] = useState(new Date().toDateString());
  const fetchDashboardDataRef = useRef();

  // Pagination states for activities
  const [todayPage, setTodayPage] = useState(0);
  const [tomorrowPage, setTomorrowPage] = useState(0);
  const ITEMS_PER_PAGE = 4;

  // Helper function to get week number in month
  const getWeekInMonth = useCallback((date) => {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfMonth = date.getDate();
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Calculate which week of the month this date falls into
    const adjustedDate = dayOfMonth + firstDayOfWeek - 1; // -1 to make Monday = 0
    return Math.floor(adjustedDate / 7);
  }, []);

  // Process activity trend data from API
  const processActivityTrendData = useCallback((statsData) => {
    if (!statsData?.trends) {
      setActivityTrendData([]);
      setParticipantsTrendData([]);
      return;
    }

    const { bookings = [], tours = [], users = [] } = statsData.trends;

    if (selectedPeriod === 'week') {
      // Special handling for week view
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      if (selectedWeek === null) {
        // Show all weeks aggregated
        const weekData = Array.from({ length: 4 }, (_, weekIndex) => ({
          name: `Minggu ${weekIndex + 1}`,
          weekIndex,
          bookings: 0,
          tours: 0,
          users: 0,
          participants: 0,
          date: new Date(currentYear, currentMonth, 1 + (weekIndex * 7))
        }));

        // Process bookings data by week
        bookings.forEach(item => {
          const date = new Date(item._id);
          if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            const weekIndex = Math.min(getWeekInMonth(date), 3);
            weekData[weekIndex].bookings += item.total || 0;
            weekData[weekIndex].participants += item.totalParticipants || 0;
          }
        });

        // Process tours data by week
        tours.forEach(item => {
          const date = new Date(item._id);
          if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            const weekIndex = Math.min(getWeekInMonth(date), 3);
            weekData[weekIndex].tours += item.total || 0;
            if (item.totalParticipants) {
              weekData[weekIndex].participants += item.totalParticipants;
            }
          }
        });

        // Process users data by week
        users.forEach(item => {
          const date = new Date(item._id);
          if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            const weekIndex = Math.min(getWeekInMonth(date), 3);
            weekData[weekIndex].users += item.count || 0;
          }
        });

        setActivityTrendData(weekData);

        // Create participants trend data
        const participantsData = weekData.map(item => ({
          name: item.name,
          participants: item.participants || 0
        }));
        setParticipantsTrendData(participantsData);

      } else {
        // Show daily data for selected week
        const weekStartDate = new Date(currentYear, currentMonth, 1 + (selectedWeek * 7));
        const weekEndDate = new Date(currentYear, currentMonth, 1 + ((selectedWeek + 1) * 7) - 1);

        // Create daily data structure for the selected week
        const dailyData = [];
        for (let d = new Date(weekStartDate); d <= weekEndDate; d.setDate(d.getDate() + 1)) {
          if (d.getMonth() === currentMonth) { // Ensure we don't go to next month
            dailyData.push({
              name: d.toLocaleDateString('id-ID', { weekday: 'short' }),
              date: new Date(d),
              bookings: 0,
              tours: 0,
              users: 0,
              participants: 0
            });
          }
        }

        // Process bookings data by day
        bookings.forEach(item => {
          const date = new Date(item._id);
          if (date >= weekStartDate && date <= weekEndDate && date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            const dayIndex = Math.floor((date - weekStartDate) / (1000 * 60 * 60 * 24));
            if (dailyData[dayIndex]) {
              dailyData[dayIndex].bookings = item.total || 0;
              dailyData[dayIndex].participants = item.totalParticipants || 0;
            }
          }
        });

        // Process tours data by day
        tours.forEach(item => {
          const date = new Date(item._id);
          if (date >= weekStartDate && date <= weekEndDate && date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            const dayIndex = Math.floor((date - weekStartDate) / (1000 * 60 * 60 * 24));
            if (dailyData[dayIndex]) {
              dailyData[dayIndex].tours = item.total || 0;
              if (item.totalParticipants) {
                dailyData[dayIndex].participants += item.totalParticipants;
              }
            }
          }
        });

        // Process users data by day
        users.forEach(item => {
          const date = new Date(item._id);
          if (date >= weekStartDate && date <= weekEndDate && date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            const dayIndex = Math.floor((date - weekStartDate) / (1000 * 60 * 60 * 24));
            if (dailyData[dayIndex]) {
              dailyData[dayIndex].users = item.count || 0;
            }
          }
        });

        setActivityTrendData(dailyData);

        // Create participants trend data
        const participantsData = dailyData.map(item => ({
          name: item.name,
          participants: item.participants || 0
        }));
        setParticipantsTrendData(participantsData);
      }

    } else {
      // Handle month and year views with month navigation
      const dataMap = new Map();
      const targetYear = new Date().getFullYear(); // Use current year for month navigation

      // Process bookings data with participants
      bookings.forEach(item => {
        const date = new Date(item._id);
        let label;
        let shouldInclude = false;

        if (selectedPeriod === 'year') {
          label = date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
          shouldInclude = true; // Include all months for year view
        } else if (selectedPeriod === 'month') {
          // For month view, only include data from selected month
          if (date.getMonth() === selectedMonth && date.getFullYear() === targetYear) {
            label = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
            shouldInclude = true;
          }
        }

        if (shouldInclude && !dataMap.has(item._id)) {
          dataMap.set(item._id, { name: label, date: item._id, bookings: 0, tours: 0, users: 0, participants: 0 });
        }
        if (shouldInclude) {
          dataMap.get(item._id).bookings = item.total || 0;
          dataMap.get(item._id).participants = item.totalParticipants || 0;
        }
      });

      // Process tours data
      tours.forEach(item => {
        const date = new Date(item._id);
        let label;
        let shouldInclude = false;

        if (selectedPeriod === 'year') {
          label = date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
          shouldInclude = true;
        } else if (selectedPeriod === 'month') {
          if (date.getMonth() === selectedMonth && date.getFullYear() === targetYear) {
            label = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
            shouldInclude = true;
          }
        }

        if (shouldInclude && !dataMap.has(item._id)) {
          dataMap.set(item._id, { name: label, date: item._id, bookings: 0, tours: 0, users: 0, participants: 0 });
        }
        if (shouldInclude) {
          dataMap.get(item._id).tours = item.total || 0;
          if (item.totalParticipants) {
            dataMap.get(item._id).participants += item.totalParticipants;
          }
        }
      });

      // Process users data
      users.forEach(item => {
        const date = new Date(item._id);
        let label;
        let shouldInclude = false;

        if (selectedPeriod === 'year') {
          label = date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
          shouldInclude = true;
        } else if (selectedPeriod === 'month') {
          if (date.getMonth() === selectedMonth && date.getFullYear() === targetYear) {
            label = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
            shouldInclude = true;
          }
        }

        if (shouldInclude && !dataMap.has(item._id)) {
          dataMap.set(item._id, { name: label, date: item._id, bookings: 0, tours: 0, users: 0, participants: 0 });
        }
        if (shouldInclude) {
          dataMap.get(item._id).users = item.count || 0;
        }
      });

      // Convert to array and sort by date
      let processedData = Array.from(dataMap.values())
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      // Slice based on period
      const sliceCount = selectedPeriod === 'month' ? 31 : 12; // Max 31 days for month
      processedData = processedData.slice(-sliceCount);

      setActivityTrendData(processedData);

      // Create participants trend data
      const participantsData = processedData.map(item => ({
        name: item.name,
        participants: item.participants || 0
      }));
      setParticipantsTrendData(participantsData);
    }
  }, [selectedPeriod, selectedWeek, selectedMonth, getWeekInMonth]);

 // Fetch dashboard data function
 const fetchDashboardData = useCallback(async () => {
   try {
     // Check if both data are cached
     if (dashboardCache && statsCache[selectedPeriod]) {
       setDashboardData(dashboardCache);
       setStatsData(statsCache[selectedPeriod]);
       processActivityTrendData(statsCache[selectedPeriod]);
       const stats = dashboardCache.stats;
       setAnimatedValues({
         users: stats.users.total,
         bookings: stats.bookings.total,
         rooms: stats.rooms.total,
         tours: stats.tours.total,
       });
       return; // No need to fetch
     }

     setLoading(true);
     const promises = [];

     if (!dashboardCache) {
       promises.push(adminAPI.getDashboard());
     }

     if (!statsCache[selectedPeriod]) {
       promises.push(adminAPI.getStats({ period: selectedPeriod }));
     }

     const results = await Promise.all(promises);

     let dashboardRes, statsRes;
     let resultIndex = 0;

     if (!dashboardCache) {
       dashboardRes = results[resultIndex++];
       setDashboardCache(dashboardRes.data.data);
       setDashboardData(dashboardRes.data.data);
       // Reset pagination when new data is loaded
       setTodayPage(0);
       setTomorrowPage(0);
     } else {
       setDashboardData(dashboardCache);
       dashboardRes = { data: { data: dashboardCache } };
     }

     if (!statsCache[selectedPeriod]) {
       statsRes = results[resultIndex++];
       setStatsCache(prev => ({ ...prev, [selectedPeriod]: statsRes.data.data }));
       setStatsData(statsRes.data.data);
       processActivityTrendData(statsRes.data.data);
     } else {
       setStatsData(statsCache[selectedPeriod]);
       processActivityTrendData(statsCache[selectedPeriod]);
       statsRes = { data: { data: statsCache[selectedPeriod] } };
     }

     // Animate values
     const stats = dashboardRes.data.data.stats;
     setAnimatedValues({
       users: stats.users.total,
       bookings: stats.bookings.total,
       rooms: stats.rooms.total,
       tours: stats.tours.total,
     });
   } catch (error) {
     console.error('Dashboard error:', error);
     setError("Gagal memuat data dashboard");
   } finally {
     setLoading(false);
   }
 }, [selectedPeriod, dashboardCache, statsCache, processActivityTrendData]);

 fetchDashboardDataRef.current = fetchDashboardData;

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, selectedWeek, selectedMonth]);

  // Daily update effect
  useEffect(() => {
    const interval = setInterval(() => {
      const currentDate = new Date().toDateString();
      if (currentDate !== lastFetchDate) {
        setLastFetchDate(currentDate);
        // Clear caches to force refetch
        setDashboardCache(null);
        setStatsCache({});
        fetchDashboardDataRef.current();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [lastFetchDate]);

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    // Reset selections when changing periods
    if (period === 'week') {
      setSelectedWeek(0); // Default to first week
      setSelectedMonth(new Date().getMonth()); // Reset to current month
    } else if (period === 'month') {
      setSelectedWeek(null);
      setSelectedMonth(new Date().getMonth()); // Reset to current month
    } else {
      setSelectedWeek(null);
      setSelectedMonth(new Date().getMonth()); // Reset to current month
    }
  };

  const handleWeekChange = (weekIndex) => {
    setSelectedWeek(weekIndex);
  };

  const handleMonthChange = (monthIndex) => {
    setSelectedMonth(monthIndex);
  };

  const handleBackToCurrentMonth = () => {
    setSelectedMonth(new Date().getMonth());
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-sky-100 to-sky-300 rounded-4xl">
      <div className="text-center">
        <LoadingSpinner size="lg" color="gray" />
        <p className="mt-4 text-gray-900 text-lg animate-pulse">Memuat Dashboard...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-sky-100 to-sky-300 rounded-4xl">
      <div className="text-red-400 text-center p-8 bg-red-900/20 rounded-2xl border border-red-500/20">
        <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4" />
        {error}
      </div>
    </div>
  );

  if (!dashboardData || !statsData) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-sky-100 to-sky-300 rounded-4xl">
      <div className="text-red-400 text-center p-8 bg-red-900/20 rounded-2xl border border-red-500/20">
        Data tidak tersedia
      </div>
    </div>
  );


  // Create booking status data with proper fallbacks
  const bookingStatusData = [
    { name: 'Disetujui', value: dashboardData.stats.bookings.approved || 0, color: '#10b981' },
    { name: 'Menunggu', value: dashboardData.stats.bookings.pending || 0, color: '#f59e0b' },
    { name: 'Ditolak', value: dashboardData.stats.bookings.rejected || 0, color: '#ef4444' },
    { name: 'Selesai', value: dashboardData.stats.bookings.completed || 0, color: '#3b82f6' },
    { name: 'Dibatalkan', value: dashboardData.stats.bookings.cancelled || 0, color: '#6b7280' },
  ].filter(item => item.value > 0); // Only show items with values > 0


  // If no data, show sample data
  const finalBookingStatusData = bookingStatusData.length > 0 ? bookingStatusData : [
    { name: 'Disetujui', value: 35, color: '#10b981' },
    { name: 'Menunggu', value: 20, color: '#f59e0b' },
    { name: 'Selesai', value: 25, color: '#3b82f6' },
    { name: 'Ditolak', value: 10, color: '#ef4444' },
    { name: 'Dibatalkan', value: 10, color: '#6b7280' },
  ];

  // Filter activities to only approved ones
  const todayBookings = (dashboardData?.todayActivities?.bookings || []).filter(item => item.status === 'approved');
  const todayTours = (dashboardData?.todayActivities?.tours || []).filter(item => item.status === 'approved');
  const tomorrowBookings = (dashboardData?.tomorrowActivities?.bookings || []).filter(item => item.status === 'approved');
  const tomorrowTours = (dashboardData?.tomorrowActivities?.tours || []).filter(item => item.status === 'approved');

  // Combine activities for pagination
  const allTodayActivities = [
    ...todayBookings.map(item => ({ ...item, type: 'booking' })),
    ...todayTours.map(item => ({ ...item, type: 'tour' }))
  ];
  const allTomorrowActivities = [
    ...tomorrowBookings.map(item => ({ ...item, type: 'booking' })),
    ...tomorrowTours.map(item => ({ ...item, type: 'tour' }))
  ];

  // Helper variables for conditions
  const showDailyActivities = (todayBookings.length !== 0 || todayTours.length !== 0) ||
    (tomorrowBookings.length !== 0 || tomorrowTours.length !== 0);
  const showTodayEmpty = todayBookings.length === 0 && todayTours.length === 0;
  const showTomorrowEmpty = tomorrowBookings.length === 0 && tomorrowTours.length === 0;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };


  const StatCard = ({ title, value, change, icon: Icon, color, glowColor, delay = 0 }) => (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${color} p-4 rounded-xl shadow-xl transform transition-all duration-500 hover:scale-105 hover:shadow-2xl group animate-fade-in`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Glow effect */}
      <div className={`absolute inset-0 ${glowColor} opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-xl blur-xl`}></div>

      {/* Background pattern */}
      <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
        <div className="w-full h-full bg-white rounded-full transform translate-x-12 -translate-y-12"></div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-lg bg-white/20 backdrop-blur-sm`}>
            {React.createElement(Icon, { className: "h-5 w-5 text-white" })}
          </div>
          <div className="flex items-center space-x-1">
            <ArrowTrendingUpIcon className="h-3 w-3 text-green-300" />
            <span className="text-xs font-medium text-green-300">{change}</span>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-white/80 text-xs font-medium">{title}</h3>
          <div className="text-2xl font-bold text-white animate-count-up">
            {value?.toLocaleString() || 0}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-100 to-sky-300 p-6">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-800 mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Pantau performa sistem perpustakaan Anda
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              {['week', 'month', 'year'].map((period) => (
                <button
                  key={period}
                  onClick={() => handlePeriodChange(period)}
                  className={`px-6 py-3 text-sm font-medium rounded-4xl transition-all duration-300 transform hover:scale-105 cursor-pointer ${
                    selectedPeriod === period
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-white/50 text-gray-700 hover:bg-white/70 backdrop-blur-sm border border-gray-300/50'
                  }`}
                >
                  {period === 'week' ? 'Minggu' : period === 'month' ? 'Bulan' : 'Tahun'}
                </button>
              ))}
            </div>

            {/* Week Navigation - Only show when week period is selected */}
            {selectedPeriod === 'week' && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 font-medium">Pilih Minggu:</span>
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map((weekIndex) => (
                    <button
                      key={weekIndex}
                      onClick={() => handleWeekChange(weekIndex)}
                      className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-105 ${
                        selectedWeek === weekIndex
                          ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg'
                          : 'bg-white/70 text-gray-700 hover:bg-white/90 backdrop-blur-sm border border-gray-300/50'
                      }`}
                    >
                      Minggu {weekIndex + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedWeek(null)}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    selectedWeek === null
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-white/70 text-gray-700 hover:bg-white/90 backdrop-blur-sm border border-gray-300/50'
                  }`}
                >
                  Semua Minggu
                </button>
              </div>
            )}

            {/* Month Navigation - Only show when month period is selected */}
            {selectedPeriod === 'month' && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 font-medium">Pilih Bulan:</span>
                <div className="relative">
                  <select
                    value={selectedMonth}
                    onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                    className="px-4 py-2 text-sm font-medium rounded-xl bg-white/70 text-gray-700 backdrop-blur-sm border border-gray-300/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none pr-8"
                  >
                    {[
                      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                    ].map((monthName, index) => (
                      <option key={index} value={index}>
                        {monthName} 2025
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {selectedMonth !== new Date().getMonth() && (
                  <button
                    onClick={handleBackToCurrentMonth}
                    className="px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105"
                  >
                    🔙 Kembali ke Bulan Sekarang
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="space-y-8 mb-8">
        {/* Primary Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Pengguna"
            value={animatedValues.users}
            change="+12%"
            icon={UserGroupIcon}
            color="from-blue-500 to-blue-600"
            glowColor="bg-blue-500"
            delay={100}
          />
          <StatCard
            title="Total Ruangan"
            value={animatedValues.rooms}
            change="+5%"
            icon={BuildingOfficeIcon}
            color="from-purple-500 to-purple-600"
            glowColor="bg-purple-500"
            delay={200}
          />
          <StatCard
            title="Total Aktivitas"
            value={(animatedValues.bookings || 0) + (animatedValues.tours || 0)}
            change="+11%"
            icon={ChartBarIcon}
            color="from-indigo-500 to-indigo-600"
            glowColor="bg-indigo-500"
            delay={300}
          />
        </div>

        {/* Activity Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Booking"
            value={animatedValues.bookings}
            change="+8%"
            icon={CalendarDaysIcon}
            color="from-green-500 to-green-600"
            glowColor="bg-green-500"
            delay={400}
          />
          <StatCard
            title="Booking Selesai"
            value={dashboardData?.stats?.bookings?.completed || 0}
            change="+12%"
            icon={CheckCircleIcon}
            color="from-emerald-500 to-emerald-600"
            glowColor="bg-emerald-500"
            delay={500}
          />
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 transform transition-all duration-500 hover:scale-105 hover:shadow-2xl group animate-fade-in">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-slate-500/20 opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-xl blur-xl"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-slate-500/20 rounded-lg">
                  <ChartPieIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="text-right">
                  <div className="text-xs text-white dark:text-gray-400">Tingkat Penyelesaian</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {animatedValues.bookings > 0
                      ? Math.round(((dashboardData?.stats?.bookings?.completed || 0) / animatedValues.bookings) * 100)
                      : 0}%
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-black dark:text-gray-100 text-xs font-medium">Booking</h3>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
                    style={{
                      width: `${animatedValues.bookings > 0
                        ? Math.min(((dashboardData?.stats?.bookings?.completed || 0) / animatedValues.bookings) * 100, 100)
                        : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tour Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Tur"
            value={animatedValues.tours}
            change="+15%"
            icon={AcademicCapIcon}
            color="from-orange-500 to-orange-600"
            glowColor="bg-orange-500"
            delay={600}
          />
          <StatCard
            title="Tur Selesai"
            value={dashboardData?.stats?.tours?.completed || 0}
            change="+18%"
            icon={CheckCircleIcon}
            color="from-teal-500 to-teal-600"
            glowColor="bg-teal-500"
            delay={700}
          />
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 transform transition-all duration-500 hover:scale-105 hover:shadow-2xl group animate-fade-in">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-slate-500/20 opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-xl blur-xl"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-slate-500/20 rounded-lg">
                  <ChartPieIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="text-right">
                  <div className="text-xs text-black dark:text-gray-400">Tingkat Penyelesaian</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {animatedValues.tours > 0
                      ? Math.round(((dashboardData?.stats?.tours?.completed || 0) / animatedValues.tours) * 100)
                      : 0}%
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-black dark:text-gray-100 text-xs font-medium">Tur</h3>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-teal-500 h-2 rounded-full transition-all duration-1000"
                    style={{
                      width: `${animatedValues.tours > 0
                        ? Math.min(((dashboardData?.stats?.tours?.completed || 0) / animatedValues.tours) * 100, 100)
                        : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Participants Accumulation Chart */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-2xl animate-fade-in mb-8" style={{ animationDelay: '600ms' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <UserGroupIcon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white">
            Tren Penggunaan Ruangan (Peserta) {selectedPeriod === 'week' ? (() => {
              const now = new Date();
              const monthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
              if (selectedWeek === null) {
                return `Mingguan - ${monthName} (Semua Minggu)`;
              } else {
                const weekStart = new Date(now.getFullYear(), now.getMonth(), 1 + (selectedWeek * 7));
                const weekEnd = new Date(now.getFullYear(), now.getMonth(), 1 + ((selectedWeek + 1) * 7) - 1);
                const startDate = weekStart.toLocaleDateString('id-ID', { day: 'numeric' });
                const endDate = weekEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                return `Mingguan - ${startDate} - ${endDate} ${now.getFullYear()} (Minggu ${selectedWeek + 1})`;
              }
            })() : selectedPeriod === 'month' ? (() => {
              const monthNames = [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
              ];
              return `Bulanan - ${monthNames[selectedMonth]} 2025`;
            })() : 'Tahunan'}
          </h3>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={participantsTrendData}>
            <defs>
              <linearGradient id="participantsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#d3d3d3" />
            <YAxis stroke="#d3d3d3" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f9fafb'
              }}
            />
            <Area
              type="monotone"
              dataKey="participants"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#participantsGradient)"
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="mt-4 text-center">
          <div className="text-sm text-slate-300">
            Total Peserta: {participantsTrendData.reduce((sum, item) => sum + (item.participants || 0), 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Activity Trend Chart */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-2xl animate-fade-in" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">
              Tren Aktivitas {selectedPeriod === 'week' ? (() => {
                const now = new Date();
                const monthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                if (selectedWeek === null) {
                  return `Mingguan - ${monthName} (Semua Minggu)`;
                } else {
                  const weekStart = new Date(now.getFullYear(), now.getMonth(), 1 + (selectedWeek * 7));
                  const weekEnd = new Date(now.getFullYear(), now.getMonth(), 1 + ((selectedWeek + 1) * 7) - 1);
                  const startDate = weekStart.toLocaleDateString('id-ID', { day: 'numeric' });
                  const endDate = weekEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                  return `Mingguan - ${startDate} - ${endDate} ${now.getFullYear()} (Minggu ${selectedWeek + 1})`;
                }
              })() : selectedPeriod === 'month' ? (() => {
                const monthNames = [
                  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                ];
                return `Bulanan - ${monthNames[selectedMonth]} 2025`;
              })() : 'Tahunan'}
            </h3>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={activityTrendData}>
              <defs>
                <linearGradient id="bookingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="toursGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#d3d3d3" />
              <YAxis stroke="#d3d3d3" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb'
                }}
              />
              <Area
                type="monotone"
                dataKey="bookings"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#bookingsGradient)"
                strokeWidth={3}
              />
              <Area
                type="monotone"
                dataKey="tours"
                stroke="#f59e0b"
                fillOpacity={1}
                fill="url(#toursGradient)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Status Pie Chart */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-2xl animate-fade-in" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <ChartPieIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Status Booking</h3>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={finalBookingStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {finalBookingStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb'
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {finalBookingStatusData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-slate-300">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Activities - Today & Tomorrow */}
      {showDailyActivities && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Today's Activities */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-2xl animate-fade-in" style={{ animationDelay: '700ms' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CalendarDaysIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Aktivitas Hari Ini ({todayBookings.length + todayTours.length})
                </h3>
              </div>

              {/* Pagination Controls */}
              {(() => {
                const todayBookings = (dashboardData?.todayActivities?.bookings || []).filter(item => item.status === 'approved');
                const todayTours = (dashboardData?.todayActivities?.tours || []).filter(item => item.status === 'approved');
                return (todayBookings.length + todayTours.length > ITEMS_PER_PAGE && <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTodayPage(Math.max(0, todayPage - 1))}
                    disabled={todayPage === 0}
                    className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >lan
                    <ChevronLeftIcon className="h-4 w-4 text-white" />
                  </button>
                  <span className="text-sm text-slate-300">
                    {todayPage + 1} / {Math.ceil((todayBookings.length + todayTours.length) / ITEMS_PER_PAGE)}
                  </span>
                  <button
                    onClick={() => setTodayPage(Math.min(Math.ceil((todayBookings.length + todayTours.length) / ITEMS_PER_PAGE) - 1, todayPage + 1))}
                    disabled={todayPage >= Math.ceil((todayBookings.length + todayTours.length) / ITEMS_PER_PAGE) - 1}
                    className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRightIcon className="h-4 w-4 text-white" />
                  </button>
                </div>)
              })()}
            </div>

            <div className="space-y-4 min-h-[320px]">
              {/* Paginated Today's Activities */}
              {allTodayActivities.slice(todayPage * ITEMS_PER_PAGE, (todayPage + 1) * ITEMS_PER_PAGE).map((activity, index) => (
                activity.type === 'booking' ? (
                  <div key={`today-booking-${todayPage * ITEMS_PER_PAGE + index}`} className="flex items-center gap-4 p-4 bg-green-500/50 rounded-xl border border-green-500/20 hover:bg-green-300/10 transition-colors duration-300">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <CalendarDaysIcon className="h-5 w-5 text-white"/>
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{activity.userId?.name}</div>
                      <div className="text-gray-800 text-sm">{activity.roomId?.roomName} - {activity.participantsCount} orang</div>
                    </div>
                    <div className="text-gray-200 text-sm">{new Date(activity.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="px-3 py-1 bg-green-500/20 text-white text-xs rounded-full">Booking</div>
                  </div>
                ) : (
                  <div key={`today-tour-${todayPage * ITEMS_PER_PAGE + index}`} className="flex items-center gap-4 p-4 bg-blue-500/50 rounded-xl border border-blue-500/20 hover:bg-blue-300/10 transition-colors duration-300">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <AcademicCapIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{activity.userId?.name}</div>
                      <div className="text-gray-800 text-sm">{activity.groupName} - {activity.numberOfParticipants} orang</div>
                    </div>
                    <div className="text-gray-200 text-sm">{new Date(activity.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="px-3 py-1 bg-blue-500/20 text-white text-xs rounded-full">Tur</div>
                  </div>
                )
              ))}

              {/* Empty state for today */}
              {showTodayEmpty && <div className="text-center py-8 text-slate-400">
                <CalendarDaysIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Tidak ada aktivitas hari ini</p>
              </div>}
            </div>
          </div>

          {/* Tomorrow's Activities */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-2xl animate-fade-in" style={{ animationDelay: '800ms' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <CalendarDaysIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Aktivitas Besok ({tomorrowBookings.length + tomorrowTours.length})
                </h3>
              </div>

              {/* Pagination Controls */}
              {(() => {
                const tomorrowBookings = (dashboardData?.tomorrowActivities?.bookings || []).filter(item => item.status === 'approved');
                const tomorrowTours = (dashboardData?.tomorrowActivities?.tours || []).filter(item => item.status === 'approved');
                return (tomorrowBookings.length + tomorrowTours.length > ITEMS_PER_PAGE && <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTomorrowPage(Math.max(0, tomorrowPage - 1))}
                    disabled={tomorrowPage === 0}
                    className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeftIcon className="h-4 w-4 text-white" />
                  </button>
                  <span className="text-sm text-slate-300">
                    {tomorrowPage + 1} / {Math.ceil((tomorrowBookings.length + tomorrowTours.length) / ITEMS_PER_PAGE)}
                  </span>
                  <button
                    onClick={() => setTomorrowPage(Math.min(Math.ceil((tomorrowBookings.length + tomorrowTours.length) / ITEMS_PER_PAGE) - 1, tomorrowPage + 1))}
                    disabled={tomorrowPage >= Math.ceil((tomorrowBookings.length + tomorrowTours.length) / ITEMS_PER_PAGE) - 1}
                    className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRightIcon className="h-4 w-4 text-white" />
                  </button>
                </div>);
              })()}
            </div>

            <div className="space-y-4 min-h-[320px]">
              {/* Paginated Tomorrow's Activities */}
              {allTomorrowActivities.slice(tomorrowPage * ITEMS_PER_PAGE, (tomorrowPage + 1) * ITEMS_PER_PAGE).map((activity, index) => (
                activity.type === 'booking' ? (
                  <div key={`tomorrow-booking-${tomorrowPage * ITEMS_PER_PAGE + index}`} className="flex items-center gap-4 p-4 bg-orange-500/50 rounded-xl border border-orange-500/20 hover:bg-orange-300/10 transition-colors duration-300">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <CalendarDaysIcon className="h-5 w-5 text-white "/>
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{activity.userId?.name}</div>
                      <div className="text-gray-800 text-sm">{activity.roomId?.roomName} - {activity.participantsCount} orang</div>
                    </div>
                    <div className="text-gray-200 text-sm">{new Date(activity.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="px-3 py-1 bg-orange-500/20 text-white text-xs rounded-full">Booking</div>
                  </div>
                ) : (
                  <div key={`tomorrow-tour-${tomorrowPage * ITEMS_PER_PAGE + index}`} className="flex items-center gap-4 p-4 bg-purple-500/50 rounded-xl border border-purple-500/20 hover:bg-purple-300/10 transition-colors duration-300">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <AcademicCapIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{activity.userId?.name}</div>
                      <div className="text-gray-800 text-sm">{activity.groupName} - {activity.numberOfParticipants} orang</div>
                    </div>
                    <div className="text-gray-200 text-sm">{new Date(activity.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="px-3 py-1 bg-purple-500/20 text-white text-xs rounded-full">Tur</div>
                  </div>
                )
              ))}

              {/* Empty state for tomorrow */}
              {showTomorrowEmpty && <div className="text-center py-8 text-slate-400">
                <CalendarDaysIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Tidak ada aktivitas besok</p>
              </div>}
            </div>
          </div>
        </div>
      )}

      {/* Activity Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Activity */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-2xl animate-fade-in" style={{ animationDelay: '700ms' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Aktivitas Terbaru</h3>
          </div>

          <div className="space-y-4">
            {(() => {
              // Combine bookings and tours, sort by createdAt descending
              const allActivities = [
                ...(dashboardData.recentActivity.bookings || []).map(item => ({ ...item, type: 'booking' })),
                ...(dashboardData.recentActivity.tours || []).map(item => ({ ...item, type: 'tour' }))
              ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);

              return allActivities.map((activity, index) => (
                <div key={`${activity.type}-${index}`} className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors duration-300">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <CalendarDaysIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">{activity.userId?.name}</div>
                    <div className="text-gray-800 text-sm">
                      {activity.type === 'booking' ? activity.roomId?.roomName : activity.groupName}
                    </div>
                  </div>
                  <div className="text-gray-800 font-bold">{formatDate(activity.createdAt)}</div>
                  <div className="px-3 py-1 bg-blue-500/20 text-white text-xs rounded-full">
                    {activity.type === 'booking' ? 'Booking' : 'Tur'}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-2xl animate-fade-in" style={{ animationDelay: '800ms' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold text-white">
              Permintaan Menunggu ({dashboardData.pendingRequests.bookings.length + dashboardData.pendingRequests.tours.length})
            </h3>
          </div>

          <div className="space-y-4">
            {/* Pending Bookings */}
            {dashboardData.pendingRequests.bookings.slice(0, 2).map((booking, index) => (
              <div key={`pending-booking-${index}`} className="flex items-center gap-4 p-4 bg-yellow-500/30 rounded-xl border border-yellow-500/20 hover:bg-yellow-500/40">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <CalendarDaysIcon className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{booking.userId?.name}</div>
                  <div className="text-gray-800 text-sm">{booking.roomId?.roomName}</div>
                  {booking.documentUrl && (
                    <div className="flex items-center gap-1 mt-1">
                      <DocumentIcon className="h-3 w-3 text-blue-400" />
                      <button
                        onClick={() => window.open(booking.documentUrl, '_blank')}
                        className="text-xs text-white hover:text-blue-300 cursor-pointer"
                      >
                        Lihat Dokumen
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-gray-900 text-sm font-semibold">{formatDate(booking.createdAt)}</div>
                <div className="px-3 py-1 bg-yellow-500/20 text-xs rounded-full text-white">Booking</div>
              </div>
            ))}

            {/* Pending Tours */}
            {dashboardData.pendingRequests.tours.slice(0, 2).map((tour, index) => (
              <div key={`pending-tour-${index}`} className="flex items-center gap-4 p-4 bg-orange-500/30 rounded-xl border border-orange-500/20 hover:bg-orange-500/40">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <AcademicCapIcon className="h-5 w-5 text-orange-400" />
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{tour.userId?.name}</div>
                  <div className="text-gray-800 text-sm">{tour.groupName} - {tour.numberOfParticipants} orang</div>
                </div>
                <div className="text-gray-900 text-sm font-semibold">{formatDate(tour.createdAt)}</div>
                <div className="px-3 py-1 bg-orange-500/20 text-white text-xs rounded-full">Tur</div>
              </div>
            ))}

            {/* Show message if there are more items */}
            {((dashboardData.pendingRequests.bookings.length + dashboardData.pendingRequests.tours.length) > 4) && (
              <div className="text-center py-2 text-slate-400 text-sm">
                Dan {(dashboardData.pendingRequests.bookings.length + dashboardData.pendingRequests.tours.length) - 4} permintaan lainnya...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Activities */}
      {(dashboardData?.upcomingActivities?.bookings?.length > 0 || dashboardData?.upcomingActivities?.tours?.length > 0) && (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-2xl animate-fade-in mb-6" style={{ animationDelay: '900ms' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">
              Aktivitas Mendatang ({(dashboardData?.upcomingActivities?.bookings?.length || 0) + (dashboardData?.upcomingActivities?.tours?.length || 0)})
            </h3>
          </div>

          <div className="space-y-4">
            {/* Upcoming Bookings */}
            {dashboardData?.upcomingActivities?.bookings?.map((booking, index) => (
              <div key={`upcoming-booking-${index}`} className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-xl border border-indigo-500/20 hover:bg-slate-500 transition-colors-duration-300">
                <div className="p-2 bg-indigo-500/30 rounded-lg">
                  <CalendarDaysIcon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{booking.userId?.name}</div>
                  <div className="text-gray-800 text-sm">{booking.roomId?.roomName} - {booking.participantsCount} orang</div>
                </div>
                <div className="text-gray-800 text-sm font-semibold">{formatDate(booking.startTime)} {new Date(booking.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="px-3 py-1 bg-indigo-500/20 text-gray-100 text-xs rounded-full">Booking</div>
              </div>
            ))}

            {/* Upcoming Tours */}
            {dashboardData?.upcomingActivities?.tours?.map((tour, index) => (
              <div key={`upcoming-tour-${index}`} className="flex items-center gap-4 p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20 hover:bg-cyan-500/40 transition-colors-duration-300">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <AcademicCapIcon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{tour.userId?.name}</div>
                  <div className="text-gray-800 text-sm">{tour.groupName} - {tour.numberOfParticipants} orang</div>
                </div>
                <div className="text-gray-800 text-sm font-semibold">{formatDate(tour.tourDate)} {new Date(tour.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="px-3 py-1 bg-cyan-500/20 text-gray-100 text-xs rounded-full">Tur</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Most Active Institutions */}
      {statsData.institutionStats && statsData.institutionStats.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-2xl animate-fade-in" style={{ animationDelay: '1000ms' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <BuildingOfficeIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Institusi Teraktif</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statsData.institutionStats.slice(0, 6).map((institution, index) => (
              <div key={index} className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 p-4 rounded-xl border border-slate-600/50 hover:border-emerald-500/50 transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-emerald-400 font-bold">#{index + 1}</span>
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{institution.institution}</div>
                      <div className="text-slate-400 text-xs">{institution.userCount} pengguna</div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-emerald-400 font-bold">{institution.totalActivity} aktivitas</div>
                  <div className="text-xs text-slate-300">
                    {institution.bookingCount} booking, {institution.tourCount} tur
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Activity Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      </div>

      {/* Popular Rooms */}
      {statsData.popularRooms && statsData.popularRooms.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-2xl animate-fade-in" style={{ animationDelay: '900ms' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Ruangan Terpopuler</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statsData.popularRooms.slice(0, 6).map((room, index) => (
              <div key={index} className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 p-4 rounded-xl border border-slate-600/50 hover:border-indigo-500/50 transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-indigo-400 font-bold">#{index + 1}</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">{room.roomName}</div>
                      <div className="text-slate-400 text-sm">{room.capacity} orang</div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-indigo-400 font-bold">{room.bookingCount} booking</div>
                  <div className="text-green-400 text-sm">{room.utilizationRate}% utilized</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes count-up {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-count-up {
          animation: count-up 0.8s ease-out forwards;
          animation-delay: 0.3s;
          opacity: 0;
        }

        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
}

export default AdminDashboard;
