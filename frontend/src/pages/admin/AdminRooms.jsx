import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { roomsAPI } from "../../services/api";
import toast from "react-hot-toast";
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  XMarkIcon,
  CheckIcon,
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

// Custom Hook untuk semua logika manajemen ruangan
const useAdminRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalState, setModalState] = useState({ isOpen: false, room: null });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState("all");

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const loadRooms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await roomsAPI.getRooms({
        includeInactive: true,
        limit: 1000,
      });
      setRooms(response.data.data);
    } catch {
      toast.error("Gagal memuat data ruangan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const openModal = (room = null) => setModalState({ isOpen: true, room });
  const closeModal = () => setModalState({ isOpen: false, room: null });

  const handleSubmitForm = async (data) => {
    try {
      setSubmitting(true);
      const formData = new FormData();
      // Konversi data form menjadi FormData
      Object.keys(data).forEach((key) => {
        if (key === "facilities") {
          formData.append(
            key,
            JSON.stringify(
              data[key]
                ? data[key]
                    .split(",")
                    .map((f) => f.trim())
                    .filter(Boolean)
                : []
            )
          );
        } else if (key === "operatingHours") {
          formData.append(key, JSON.stringify(data[key]));
        } else if (key === "image" && data.image?.[0]) {
          formData.append("image", data.image[0]);
        } else {
          formData.append(key, data[key]);
        }
      });

      if (modalState.room) {
        await roomsAPI.updateRoom(modalState.room._id, formData);
        toast.success("Ruangan berhasil diperbarui");
      } else {
        await roomsAPI.createRoom(formData);
        toast.success("Ruangan berhasil ditambahkan");
      }
      await loadRooms();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (roomId) => {
    const originalRooms = [...rooms];
    setRooms((prev) => prev.filter((r) => r._id !== roomId)); // Optimistic delete
    setDeleteConfirm(null);
    try {
      await roomsAPI.deleteRoom(roomId);
      toast.success("Ruangan berhasil dihapus");
    } catch {
      setRooms(originalRooms); // Kembalikan jika gagal
      toast.error("Gagal menghapus ruangan");
    }
  };

  const toggleStatus = async (roomToToggle) => {
    const originalRooms = [...rooms];
    // Optimistic update
    setRooms((prev) =>
      prev.map((r) =>
        r._id === roomToToggle._id ? { ...r, isActive: !r.isActive } : r
      )
    );
    try {
      await roomsAPI.toggleRoomStatus(roomToToggle._id);
      toast.success("Status berhasil diubah");
    } catch {
      setRooms(originalRooms); // Kembalikan jika gagal
      toast.error("Gagal mengubah status");
    }
  };

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const search = debouncedSearchTerm.toLowerCase();
      const matchesSearch =
        room.roomName.toLowerCase().includes(search) ||
        room.description.toLowerCase().includes(search);
      const matchesFilter =
        filterActive === "all" ||
        (filterActive === "active" && room.isActive) ||
        (filterActive === "inactive" && !room.isActive);
      return matchesSearch && matchesFilter;
    });
  }, [rooms, debouncedSearchTerm, filterActive]);

  return {
    rooms,
    loading,
    submitting,
    modalState,
    deleteConfirm,
    searchTerm,
    filterActive,
    filteredRooms,
    setSearchTerm,
    setFilterActive,
    openModal,
    closeModal,
    handleSubmitForm,
    handleDelete,
    toggleStatus,
    setDeleteConfirm,
  };
};

// Komponen Modal Form
const RoomFormModal = ({ state, onClose, onSubmit, submitting }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm();
  const [imagePreview, setImagePreview] = useState(null);
  const watchedImage = watch("image");

  useEffect(() => {
    if (state.isOpen) {
      const room = state.room;
      reset({
        roomName: room?.roomName || "",
        description: room?.description || "",
        capacity: room?.capacity || "",
        location: room?.location || "",
        facilities: room?.facilities?.join(", ") || "",
        operatingHours: {
          start: room?.operatingHours?.start || "08:00",
          end: room?.operatingHours?.end || "17:00",
        },
        isActive: room?.isActive ?? true,
      });
      setImagePreview(room?.imageUrl || null);
    }
  }, [state, reset]);

  useEffect(() => {
    if (watchedImage?.[0]) {
      const reader = new FileReader();  
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(watchedImage[0]);
    } else {
      // Hanya hapus preview jika tidak ada gambar awal
      if (!state.room?.imageUrl) setImagePreview(null);
    }
  }, [watchedImage, state.room]);

  if (!state.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium text-blue-600">
                {state.room ? "Edit Ruangan" : "Tambah Ruangan Baru"}
              </h3>
              <button type="button" onClick={onClose}>
                <XMarkIcon className="h-6 w-6 text-black" />
              </button>
            </div>
            {/* Body */}
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-gray-900 font-semibold">
                  Nama Ruangan
                </label>
                <input
                  {...register("roomName", { required: "Nama wajib diisi" })}
                  className="w-full mt-1 border-gray-700 text-gray-900 bg-white rounded-md shadow-sm"
                />
                {errors.roomName && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.roomName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-gray-900 font-semibold">Deskripsi</label>
                <textarea
                  {...register("description", {
                    required: "Deskripsi wajib diisi",
                  })}
                  className="w-full mt-1 border-gray-700 text-gray-900 bg-white rounded-md shadow-sm"
                />
                {errors.description && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-900 font-semibold">
                    Kapasitas
                  </label>
                  <input
                    type="number"
                    {...register("capacity", {
                      required: "Kapasitas wajib diisi",
                      min: 1,
                    })}
                    className="w-full mt-1 border-gray-700 text-gray-900 bg-white rounded-md shadow-sm"
                  />
                  {errors.capacity && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.capacity.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-gray-900 font-semibold">Lokasi</label>
                  <input
                    {...register("location")}
                    className="w-full mt-1 border-gray-700 text-gray-900 bg-white rounded-md shadow-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-gray-900 font-semibold">
                  Fasilitas (pisahkan dengan koma)
                </label>
                <input
                  {...register("facilities")}
                  className="w-full mt-1 border-gray-700 text-gray-900 bg-white rounded-md shadow-sm"
                />
              </div>
              <div>
                <label className="text-gray-900 font-semibold">
                  Foto Ruangan
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mx-auto h-32 w-auto rounded-lg"
                      />
                    ) : (
                      <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    )}
                    <div className="flex text-sm text-gray-900">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-700 hover:text-primary-500">
                        <span>Upload foto</span>
                        <input
                          type="file"
                          {...register("image")}
                          accept="image/*"
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <input
                  id="isActive"
                  type="checkbox"
                  {...register("isActive")}
                  className="h-4 w-4 text-primary-700 rounded border-gray-700"
                />
                <label
                  htmlFor="isActive"
                  className="ml-2 text-gray-900 font-semibold"
                >
                  Ruangan aktif dan dapat dibooking
                </label>
              </div>
            </div>
            {/* Footer */}
            <div className="flex justify-end p-4 border-t gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-red-600 border border-gray-300 rounded-2xl cursor-pointer hover:bg-transparent hover:text-black"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-3xl disabled:bg-primary-300 flex items-center cursor-pointer hover:bg-transparent hover:text-blue-800 hover:font-medium"
              >
                {submitting && <LoadingSpinner size="sm" />}
                <span className={submitting ? "ml-2" : ""}>
                  {state.room ? "Perbarui" : "Simpan"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Komponen Konfirmasi Hapus
const DeleteConfirmModal = ({ room, onClose, onConfirm }) => {
  if (!room) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-red-100">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium">Hapus Ruangan</h3>
            <p className="text-sm text-gray-500 mt-1">
              Apakah Anda yakin ingin menghapus ruangan "{room.roomName}"?
              Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 border-gray-300 rounded-3xl cursor-pointer hover:bg-transparent hover:text-black"
          >
            Batal
          </button>
          <button
            onClick={() => onConfirm(room._id)}
            className="px-4 py-2 text-black cursor-pointer"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
};

// Komponen Utama
const AdminRooms = () => {
  const {
    loading,
    submitting,
    modalState,
    deleteConfirm,
    searchTerm,
    filterActive,
    filteredRooms,
    setSearchTerm,
    setFilterActive,
    openModal,
    closeModal,
    handleSubmitForm,
    handleDelete,
    toggleStatus,
    setDeleteConfirm,
  } = useAdminRooms();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Ruangan</h1>
          <p className="text-sm text-gray-600">
            Kelola ruangan perpustakaan dan fasilitasnya
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-md shadow-sm hover:bg-primary-700 cursor-pointer bg-green-600"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Tambah Ruangan
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari ruangan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-black"
          />
        </div>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="w-full sm:w-48 border border-gray-300 rounded-md text-gray-600"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredRooms.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Ruangan
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Kapasitas
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Lokasi
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="p-4 text-right text-xs font-medium text-gray-500 uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRooms.map((room) => (
                  <tr key={room._id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            room.imageUrl || "https://via.placeholder.com/150"
                          }
                          alt={room.roomName}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{room.roomName}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {room.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {room.capacity} orang
                    </td>
                    <td className="p-4 text-sm text-gray-900">{room.location || "-"}</td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleStatus(room)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          room.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {room.isActive ? (
                          <CheckIcon className="w-3 h-3 mr-1" />
                        ) : (
                          <XMarkIcon className="w-3 h-3 mr-1" />
                        )}
                        {room.isActive ? "Aktif" : "Nonaktif"}
                      </button>
                    </td>
                    <td className="p-4 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openModal(room)}>
                          <PencilIcon className="h-4 w-4 text-primary-600 text-black cursor-pointer" />
                        </button>
                        <button onClick={() => setDeleteConfirm(room)}>
                          <TrashIcon className="h-4 w-4 text-red-600 cursor-pointer" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium">Tidak ada ruangan</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? "Tidak ditemukan ruangan yang cocok"
                : "Mulai dengan menambahkan ruangan baru"}
            </p>
          </div>
        )}
      </div>

      <RoomFormModal
        state={modalState}
        onClose={closeModal}
        onSubmit={handleSubmitForm}
        submitting={submitting}
      />
      <DeleteConfirmModal
        room={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default AdminRooms;
