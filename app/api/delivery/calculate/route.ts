import { NextRequest, NextResponse } from "next/server";
import { calculateDeliveryFee } from "@/app/lib/deliveryCalculator";
import { CartItemDelivery } from "@/app/lib/deliveryCalculator";

// Haversine formula to calculate distance between two points
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Estimate delivery time based on distance and vehicle type
function estimateDeliveryTime(
  distance: number,
  vehicleType: 'bike' | 'car' | 'van'
): { min: number; max: number; formatted: string } {
  let speedMin = 20; // km/h
  let speedMax = 40; // km/h

  if (vehicleType === 'bike') {
    speedMin = 15;
    speedMax = 30;
  } else if (vehicleType === 'van') {
    speedMin = 30;
    speedMax = 50;
  }

  const timeMinHours = distance / speedMax;
  const timeMaxHours = distance / speedMin;

  const timeMinMinutes = Math.round(timeMinHours * 60);
  const timeMaxMinutes = Math.round(timeMaxHours * 60);

  return {
    min: timeMinMinutes,
    max: timeMaxMinutes,
    formatted: `${timeMinMinutes}m - ${timeMaxMinutes}m`,
  };
}

// Calculate delivery fee based on distance and vehicle type
function calculateDeliveryFeeFromCoordinates(
  distance: number,
  vehicleType: 'bike' | 'car' | 'van'
): number {
  const baseFees: { [key: string]: number } = {
    bike: 1500,
    car: 2500,
    van: 3500,
  };

  const perKmRates: { [key: string]: number } = {
    bike: 100,
    car: 200,
    van: 300,
  };

  const baseFee = baseFees[vehicleType] || 2500;
  const perKmRate = perKmRates[vehicleType] || 200;

  return Math.round(baseFee + distance * perKmRate);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a coordinates-based calculation (from modal)
    if (body.pickupCoordinates && body.deliveryCoordinates) {
      const {
        pickupCoordinates,
        deliveryCoordinates,
        vehicleType,
        address,
      } = body;

      // Extract coordinates (handle both formats)
      const pickup = pickupCoordinates;
      const delivery = 'lat' in deliveryCoordinates
        ? {
            latitude: deliveryCoordinates.lat,
            longitude: deliveryCoordinates.lng,
          }
        : deliveryCoordinates;

      // Calculate distance using Haversine formula
      const distance = calculateDistance(
        pickup.latitude,
        pickup.longitude,
        delivery.latitude,
        delivery.longitude
      );

      // Estimate delivery time
      const deliveryTime = estimateDeliveryTime(distance, vehicleType);

      // Calculate delivery fee
      const fee = calculateDeliveryFeeFromCoordinates(distance, vehicleType);

      return NextResponse.json({
        success: true,
        distance: distance,
        duration: deliveryTime.formatted,
        durationMinutes: { min: deliveryTime.min, max: deliveryTime.max },
        fee: fee,
        pickupPoint: {
          name: 'Pickup Location',
          address: 'Pickup address',
          coordinates: pickup,
        },
        deliveryPoint: {
          address: address || 'Delivery location',
          coordinates: delivery,
        },
        breakdown: {
          baseFee: vehicleType === 'bike' ? 1500 : vehicleType === 'car' ? 2500 : 3500,
          distanceFee: Math.round(distance * (vehicleType === 'bike' ? 100 : vehicleType === 'car' ? 200 : 300)),
          total: fee,
        },
      });
    }

    // Original calculation for cart/checkout
    const { state, items, distanceKm, rushDelivery, weekendDelivery, holidayDelivery } = body;

    // Validate required fields
    if (!state || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: state and items array" },
        { status: 400 }
      );
    }

    // Validate items structure
    const validItems: CartItemDelivery[] = items.map((item: any) => ({
      id: item.id || "",
      name: item.name || "",
      quantity: item.quantity || 1,
      size: item.size || "MEDIUM",
      weight: item.weight || 0.5,
      totalWeight: item.totalWeight || (item.weight || 0.5) * (item.quantity || 1),
      fragile: item.fragile || false,
    }));

    // Calculate delivery fee
    const quote = calculateDeliveryFee(state, validItems, {
      distanceKm: distanceKm || 10,
      rushDelivery: rushDelivery || false,
      weekendDelivery: weekendDelivery || false,
      holidayDelivery: holidayDelivery || false,
    });

    if (!quote) {
      return NextResponse.json(
        { error: "Unable to calculate delivery for the specified location" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        quote: {
          fee: quote.fee,
          vehicle: quote.vehicle,
          zone: quote.zone,
          estimatedDays: quote.estimatedDays,
          breakdown: quote.breakdown,
          warnings: quote.warnings || [],
          recommendations: quote.recommendations || [],
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delivery calculation error:", error);
    return NextResponse.json(
      { error: "Internal server error during delivery calculation" },
      { status: 500 }
    );
  }
}
