"use client";

import { useEffect, useState } from "react";
import { Truck, MapPin, Package, CheckCircle, XCircle, Clock, Phone } from "lucide-react";
import { DeliveryStatus, DELIVERY_STATUS_MAP, VehicleType, VEHICLE_CONFIGS } from "../lib/deliverySystem";

interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  vehicle: VehicleType;
  rating: number;
  avatar?: string;
}

interface DeliveryTrackingInfo {
  orderId: string;
  status: DeliveryStatus;
  currentLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  deliveryPartner?: DeliveryPartner;
  estimatedArrival?: Date;
  lastUpdate?: Date;
  timeline: Array<{
    status: DeliveryStatus;
    timestamp: Date;
    location?: string;
  }>;
}

interface DeliveryTrackerProps {
  tracking: DeliveryTrackingInfo;
  onContact?: (partner: DeliveryPartner) => void;
}

export function DeliveryTracker({ tracking, onContact }: DeliveryTrackerProps) {
  const [displayTime, setDisplayTime] = useState("");

  useEffect(() => {
    if (tracking.estimatedArrival) {
      const updateTime = () => {
        const now = new Date();
        const arrival = new Date(tracking.estimatedArrival!);
        const diff = arrival.getTime() - now.getTime();

        if (diff <= 0) {
          setDisplayTime("Arriving now");
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setDisplayTime(`${hours}h ${minutes}m away`);
        }
      };

      updateTime();
      const interval = setInterval(updateTime, 60000);
      return () => clearInterval(interval);
    }
  }, [tracking.estimatedArrival]);

  const statusInfo = DELIVERY_STATUS_MAP[tracking.status];
  const vehicleInfo = tracking.deliveryPartner
    ? VEHICLE_CONFIGS[tracking.deliveryPartner.vehicle]
    : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Order Tracking</h3>
            <p className="text-sm text-gray-600">Order #{tracking.orderId}</p>
          </div>
          <div className={`px-4 py-2 rounded-full font-semibold text-sm bg-${statusInfo.color}-100 text-${statusInfo.color}-700`}>
            {statusInfo.icon} {statusInfo.label}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-8">
        {/* Delivery Partner Info */}
        {tracking.deliveryPartner && tracking.status !== DeliveryStatus.PENDING && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              Your Delivery Partner
            </h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {tracking.deliveryPartner.avatar ? (
                  <img
                    src={tracking.deliveryPartner.avatar}
                    alt={tracking.deliveryPartner.name}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-blue-200 flex items-center justify-center">
                    <Truck className="h-6 w-6 text-blue-600" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{tracking.deliveryPartner.name}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    ⭐ {tracking.deliveryPartner.rating.toFixed(1)} rating
                  </p>
                  <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                    {vehicleInfo?.icon} {vehicleInfo?.name}
                  </p>
                </div>
              </div>
              {onContact && (
                <button
                  onClick={() => onContact(tracking.deliveryPartner!)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition"
                >
                  <Phone className="h-4 w-4" />
                  Call
                </button>
              )}
            </div>
          </div>
        )}

        {/* Location Info */}
        {tracking.currentLocation && tracking.status !== DeliveryStatus.PENDING && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              Current Location
            </h4>
            <p className="text-gray-800">{tracking.currentLocation.address}</p>
            {tracking.lastUpdate && (
              <p className="text-xs text-gray-600 mt-2">
                Last updated: {new Date(tracking.lastUpdate).toLocaleTimeString()}
              </p>
            )}
          </div>
        )}

        {/* Estimated Arrival */}
        {tracking.estimatedArrival &&
          [
            DeliveryStatus.PICKED_UP,
            DeliveryStatus.IN_TRANSIT,
            DeliveryStatus.OUT_FOR_DELIVERY,
          ].includes(tracking.status) && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                Estimated Arrival
              </h4>
              <p className="text-lg font-bold text-green-700">{displayTime}</p>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(tracking.estimatedArrival).toLocaleString()}
              </p>
            </div>
          )}

        {/* Status Timeline */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Delivery Timeline</h4>
          <div className="space-y-4">
            {tracking.timeline
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((event, index) => {
                const eventStatus = DELIVERY_STATUS_MAP[event.status];
                const isLast = index === tracking.timeline.length - 1;
                const isCompleted =
                  tracking.status === DeliveryStatus.DELIVERED ||
                  tracking.status === DeliveryStatus.FAILED;

                return (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white ${
                          event.status === DeliveryStatus.DELIVERED
                            ? "bg-green-500"
                            : event.status === DeliveryStatus.FAILED
                              ? "bg-red-500"
                              : "bg-gray-400"
                        }`}
                      >
                        {event.status === DeliveryStatus.DELIVERED ? (
                          <CheckCircle className="h-6 w-6" />
                        ) : event.status === DeliveryStatus.FAILED ? (
                          <XCircle className="h-6 w-6" />
                        ) : (
                          <Package className="h-6 w-6" />
                        )}
                      </div>
                      {!isLast && (
                        <div className="w-1 h-12 bg-gray-300 mt-2"></div>
                      )}
                    </div>
                    <div className="pb-4 pt-1">
                      <p className="font-semibold text-gray-900">{eventStatus.label}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                      {event.location && (
                        <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Delivery Notes */}
        {tracking.status === DeliveryStatus.DELIVERED && (
          <div className="bg-green-50 rounded-lg p-4 border border-green-200 flex items-start gap-3">
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-green-900">Delivery Complete</h4>
              <p className="text-sm text-green-800 mt-1">
                Thank you for your order! Your items have been successfully delivered.
              </p>
            </div>
          </div>
        )}

        {tracking.status === DeliveryStatus.FAILED && (
          <div className="bg-red-50 rounded-lg p-4 border border-red-200 flex items-start gap-3">
            <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-red-900">Delivery Attempt Failed</h4>
              <p className="text-sm text-red-800 mt-1">
                We weren't able to deliver your order. We'll try again soon or contact you for
                alternative delivery arrangements.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
