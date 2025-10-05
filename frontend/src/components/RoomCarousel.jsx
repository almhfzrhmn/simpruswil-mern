// src/components/RoomCarousel.jsx
import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Navigation, Pagination } from 'swiper/modules';
import RoomCard from './RoomCard';
import { useNavigate } from 'react-router-dom';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const RoomCarousel = ({ rooms }) => {
  const navigate = useNavigate();

  const handleBookClick = (room) => {
    navigate('/rooms', { state: { selectedRoom: room } });
  };

  if (!rooms || rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Tidak ada ruangan tersedia</p>
      </div>
    );
  }

  const enableLoop = rooms.length >= 4; // Enable loop only if enough slides

  return (
    <div className="room-carousel-wrapper">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Jelajahi Ruangan</h2>

      <div className="relative">
        <Swiper
          effect={enableLoop ? 'coverflow' : 'slide'}
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={3}
          loop={enableLoop}
          coverflowEffect={enableLoop ? {
            rotate: 20,
            stretch: 0,
            depth: 50,
            modifier: 1,
            slideShadows: false,
          } : undefined}
          navigation={true}
          pagination={{
            clickable: true,
          }}
          breakpoints={{
            320: {
              slidesPerView: 1,
              spaceBetween: 10,
            },
            640: {
              slidesPerView: 2,
              spaceBetween: 20,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 30,
            },
          }}
          modules={[EffectCoverflow, Navigation, Pagination]}
          className="mySwiper"
        >
          {rooms.map((room) => (
            <SwiperSlide key={room._id}>
              <div className="px-2">
                <RoomCard room={room} onBookClick={handleBookClick} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <style jsx>{`
        .room-carousel-wrapper {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          overflow: hidden;
        }

        :global(.mySwiper) {
          width: 100%;
          padding: 50px 0px 70px 0px !important;
        }

        :global(.mySwiper .swiper-slide) {
          width: 300px;
          height: auto;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        :global(.swiper-button-next),
        :global(.swiper-button-prev) {
          color: #2563eb !important;
          background: white !important;
          width: 44px !important;
          height: 44px !important;
          border-radius: 50% !important;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
        }

        :global(.swiper-button-next:after),
        :global(.swiper-button-prev:after) {
          font-size: 18px !important;
          font-weight: bold !important;
        }

        :global(.swiper-button-next:hover),
        :global(.swiper-button-prev:hover) {
          background: #2563eb !important;
          color: white !important;
        }

        :global(.swiper-pagination-bullet) {
          background: #2563eb !important;
          opacity: 0.5 !important;
        }

        :global(.swiper-pagination-bullet-active) {
          opacity: 1 !important;
          width: 30px !important;
          border-radius: 5px !important;
        }

        @media (max-width: 640px) {
          :global(.mySwiper) {
            padding: 40px 0px 60px 0px !important;
          }

          :global(.mySwiper .swiper-slide) {
            width: 280px;
          }

          :global(.swiper-button-next),
          :global(.swiper-button-prev) {
            width: 36px !important;
            height: 36px !important;
          }

          :global(.swiper-button-next:after),
          :global(.swiper-button-prev:after) {
            font-size: 14px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default RoomCarousel;