// src/components/RoomCard.jsx
import React from 'react';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

const RoomCard = ({ room, onBookClick }) => {
  const getStatusConfig = (status) => {
    if (status === 'available' || status === 'Tersedia') {
      return {
        class: 'bg-green-100 text-green-800',
        text: 'Tersedia'
      };
    }
    return {
      class: 'bg-red-100 text-red-800',
      text: 'Dipesan'
    };
  };

  const statusConfig = getStatusConfig(room.status);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-2xl w-full max-w-sm mx-auto">
      {/* Image Section */}
      <div className="relative w-full">
        {room.imageUrl ? (
          <img
            src={room.imageUrl}
            alt={room.roomName}
            className="w-full h-40 object-cover rounded-t-2xl"
          />
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-gray-200 to-gray-300 rounded-t-2xl flex items-center justify-center">
            <BuildingOfficeIcon className="h-16 w-16 text-gray-400" />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-2 truncate">
          {room.roomName}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Kapasitas: {room.capacity} orang
        </p>

        {/* Footer Section */}
        <div className="flex justify-between items-center">
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusConfig.class}`}>
            {statusConfig.text}
          </span>
          <button
            onClick={() => onBookClick && onBookClick(room)}
            className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Ajukan
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;