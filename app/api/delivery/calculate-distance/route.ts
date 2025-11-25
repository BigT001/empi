import { NextRequest, NextResponse } from 'next/server';
import {
  calculateDistance,
  calculateDeliveryFee,
  estimateDeliveryTime,
  getNearestPickupPoint,
  PICKUP_POINTS,
  formatDistance,
  formatDeliveryTime,
} from '@/app/lib/distanceCalculator';

/**
 * POST /api/delivery/calculate-distance
 * 
 * Request body:
 * {
 *   userLatitude: number,
 *   userLongitude: number,
 *   vehicleType: "bike" | "car" | "van",
 *   itemSize: "SMALL" | "MEDIUM" | "LARGE",
 *   isFragile: boolean,
 *   isRushDelivery: boolean,
 *   pickupPointId?: "suru_lere" | "ojo" (auto-select if not provided)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      userLatitude,
      userLongitude,
      vehicleType,
      itemSize,
      isFragile,
      isRushDelivery,
      pickupPointId,
    } = body;

    // Validation
    if (
      !userLatitude ||
      !userLongitude ||
      !vehicleType ||
      !itemSize
    ) {
      return NextResponse.json(
        {
          error: 'Missing required fields: userLatitude, userLongitude, vehicleType, itemSize',
        },
        { status: 400 }
      );
    }

    // Get pickup point
    let pickupPoint;
    if (pickupPointId === 'ojo') {
      pickupPoint = PICKUP_POINTS.OJO;
    } else if (pickupPointId === 'suru_lere') {
      pickupPoint = PICKUP_POINTS.SURU_LERE;
    } else {
      // Auto-select nearest
      pickupPoint = getNearestPickupPoint(userLatitude, userLongitude);
    }

    // Calculate distance
    const distanceKm = calculateDistance(
      pickupPoint.latitude,
      pickupPoint.longitude,
      userLatitude,
      userLongitude
    );

    // Check if mainland Lagos (approximate boundaries)
    const isMainlandLagos =
      userLatitude >= 6.4 &&
      userLatitude <= 6.7 &&
      userLongitude >= 3.0 &&
      userLongitude <= 3.5;

    // Estimate delivery time
    const deliveryTime = estimateDeliveryTime(distanceKm, vehicleType);

    // Calculate fee
    const feeBreakdown = calculateDeliveryFee({
      distanceKm,
      vehicleType,
      itemSize,
      isFragile: isFragile || false,
      isRushDelivery: isRushDelivery || false,
      isMainlandLagos,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          pickupPoint: {
            id: pickupPoint.id,
            name: pickupPoint.name,
            address: pickupPoint.address,
            coordinates: {
              latitude: pickupPoint.latitude,
              longitude: pickupPoint.longitude,
            },
          },
          distance: {
            km: distanceKm,
            formatted: formatDistance(distanceKm),
          },
          deliveryTime: {
            min: deliveryTime.min,
            max: deliveryTime.max,
            formatted: `${formatDeliveryTime(deliveryTime.min)} - ${formatDeliveryTime(deliveryTime.max)}`,
          },
          pricing: {
            baseFee: feeBreakdown.baseFee,
            distanceFee: feeBreakdown.distanceFee,
            sizeMultiplier: feeBreakdown.sizeMultiplier,
            fragileMultiplier: feeBreakdown.fragileMultiplier,
            rushMultiplier: feeBreakdown.rushMultiplier,
            totalFee: feeBreakdown.totalFee,
            breakdown: feeBreakdown.breakdown,
          },
          isMainlandLagos,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error calculating delivery:', error);
    return NextResponse.json(
      { error: 'Failed to calculate delivery distance and fee' },
      { status: 500 }
    );
  }
}
