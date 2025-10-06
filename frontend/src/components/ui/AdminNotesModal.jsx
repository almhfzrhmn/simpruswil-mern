import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const AdminNotesModal = ({ isOpen, onClose, onConfirm, title, itemType, itemName, actionType }) => {
  const [adminNote, setAdminNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adminNote.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(adminNote.trim());
      setAdminNote('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setAdminNote('');
      onClose();
    }
  };

  if (!isOpen) return null;

  const getActionText = () => {
    switch (actionType) {
      case 'approved':
        return 'menyetujui';
      case 'rejected':
        return 'menolak';
      case 'completed':
        return 'menandai selesai';
      default:
        return 'memproses';
    }
  };

  const getActionColor = () => {
    switch (actionType) {
      case 'approved':
        return 'from-green-500 to-green-600';
      case 'rejected':
        return 'from-red-500 to-red-600';
      case 'completed':
        return 'from-blue-500 to-blue-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className={`bg-gradient-to-r ${getActionColor()} p-6 text-white rounded-t-3xl`}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="text-white/90 mt-1 text-sm">
                {itemType === 'booking' ? 'Booking' : 'Tur'}: {itemName}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Catatan Admin <span className="text-red-500">*</span>
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder={`Berikan alasan atau catatan untuk ${getActionText()} ${itemType === 'booking' ? 'booking' : 'tur'} ini...`}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all focus:text-black resize-none"
              rows={4}
              maxLength={500}
              disabled={isSubmitting}
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              {adminNote.length}/500 karakter
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !adminNote.trim()}
              className={`flex-1 px-6 py-3 bg-gradient-to-r ${getActionColor()} text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Memproses...
                </>
              ) : (
                <>
                  {actionType === 'approved' && 'Setujui'}
                  {actionType === 'rejected' && 'Tolak'}
                  {actionType === 'completed' && 'Selesai'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNotesModal;