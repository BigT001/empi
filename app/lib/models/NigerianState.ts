import mongoose from 'mongoose';

const NigerianStateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    region: {
      type: String,
      enum: ['North', 'South', 'Southwest', 'Southeast', 'Northcentral', 'Southsouth'],
      required: true,
    },
    capital: {
      type: String,
      required: true,
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },
    // For delivery zones
    zones: [
      {
        zoneId: String,
        zoneName: String,
        deliveryDays: { min: Number, max: Number },
        baseFee: Number,
        perKmRate: Number,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: 'nigerian_states' }
);

export const NigerianState =
  mongoose.models.NigerianState || mongoose.model('NigerianState', NigerianStateSchema);
