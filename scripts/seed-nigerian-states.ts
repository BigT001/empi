import mongoose from 'mongoose';
import { NigerianState } from '../app/lib/models/NigerianState';

const NIGERIAN_STATES_DATA = [
  {
    name: 'Lagos',
    code: 'LA',
    region: 'Southwest',
    capital: 'Ikeja',
    coordinates: { latitude: 6.5244, longitude: 3.3662 },
    zones: [
      {
        zoneId: 'intra_lagos',
        zoneName: 'Intra Lagos',
        deliveryDays: { min: 0.5, max: 2 },
        baseFee: 2500,
        perKmRate: 200,
      },
    ],
  },
  {
    name: 'Ogun',
    code: 'OG',
    region: 'Southwest',
    capital: 'Abeokuta',
    coordinates: { latitude: 7.1964, longitude: 3.3857 },
    zones: [
      {
        zoneId: 'ogun_zone',
        zoneName: 'Ogun State',
        deliveryDays: { min: 1, max: 3 },
        baseFee: 2000,
        perKmRate: 150,
      },
    ],
  },
  {
    name: 'Oyo',
    code: 'OY',
    region: 'Southwest',
    capital: 'Ibadan',
    coordinates: { latitude: 7.3957, longitude: 3.9039 },
    zones: [
      {
        zoneId: 'oyo_zone',
        zoneName: 'Oyo State',
        deliveryDays: { min: 1, max: 3 },
        baseFee: 2000,
        perKmRate: 150,
      },
    ],
  },
  {
    name: 'Osun',
    code: 'OS',
    region: 'Southwest',
    capital: 'Oshogbo',
    coordinates: { latitude: 7.7675, longitude: 4.5405 },
    zones: [
      {
        zoneId: 'osun_zone',
        zoneName: 'Osun State',
        deliveryDays: { min: 1, max: 3 },
        baseFee: 1800,
        perKmRate: 140,
      },
    ],
  },
  {
    name: 'Ondo',
    code: 'OD',
    region: 'Southwest',
    capital: 'Akure',
    coordinates: { latitude: 7.2521, longitude: 5.1971 },
    zones: [
      {
        zoneId: 'ondo_zone',
        zoneName: 'Ondo State',
        deliveryDays: { min: 1, max: 3 },
        baseFee: 1800,
        perKmRate: 140,
      },
    ],
  },
  {
    name: 'Ekiti',
    code: 'EK',
    region: 'Southwest',
    capital: 'Ado-Ekiti',
    coordinates: { latitude: 7.6209, longitude: 5.2283 },
    zones: [
      {
        zoneId: 'ekiti_zone',
        zoneName: 'Ekiti State',
        deliveryDays: { min: 1, max: 3 },
        baseFee: 1700,
        perKmRate: 130,
      },
    ],
  },
  {
    name: 'Kogi',
    code: 'KO',
    region: 'Northcentral',
    capital: 'Lokoja',
    coordinates: { latitude: 7.8009, longitude: 6.7539 },
    zones: [
      {
        zoneId: 'kogi_zone',
        zoneName: 'Kogi State',
        deliveryDays: { min: 2, max: 4 },
        baseFee: 1600,
        perKmRate: 120,
      },
    ],
  },
  {
    name: 'Kwara',
    code: 'KW',
    region: 'Northcentral',
    capital: 'Ilorin',
    coordinates: { latitude: 8.4961, longitude: 4.5449 },
    zones: [
      {
        zoneId: 'kwara_zone',
        zoneName: 'Kwara State',
        deliveryDays: { min: 2, max: 4 },
        baseFee: 1600,
        perKmRate: 120,
      },
    ],
  },
  {
    name: 'Abuja (FCT)',
    code: 'AB',
    region: 'Northcentral',
    capital: 'Abuja',
    coordinates: { latitude: 9.0765, longitude: 7.3986 },
    zones: [
      {
        zoneId: 'abuja_zone',
        zoneName: 'Abuja',
        deliveryDays: { min: 1, max: 3 },
        baseFee: 2200,
        perKmRate: 180,
      },
    ],
  },
  {
    name: 'Enugu',
    code: 'EN',
    region: 'Southeast',
    capital: 'Enugu',
    coordinates: { latitude: 6.4549, longitude: 7.4977 },
    zones: [
      {
        zoneId: 'enugu_zone',
        zoneName: 'Enugu State',
        deliveryDays: { min: 2, max: 4 },
        baseFee: 1800,
        perKmRate: 140,
      },
    ],
  },
  {
    name: 'Anambra',
    code: 'AN',
    region: 'Southeast',
    capital: 'Awka',
    coordinates: { latitude: 6.2167, longitude: 7.0833 },
    zones: [
      {
        zoneId: 'anambra_zone',
        zoneName: 'Anambra State',
        deliveryDays: { min: 2, max: 4 },
        baseFee: 1700,
        perKmRate: 130,
      },
    ],
  },
  {
    name: 'Ebonyi',
    code: 'EB',
    region: 'Southeast',
    capital: 'Abakaliki',
    coordinates: { latitude: 6.3275, longitude: 8.1157 },
    zones: [
      {
        zoneId: 'ebonyi_zone',
        zoneName: 'Ebonyi State',
        deliveryDays: { min: 2, max: 4 },
        baseFee: 1600,
        perKmRate: 120,
      },
    ],
  },
  {
    name: 'Imo',
    code: 'IM',
    region: 'Southeast',
    capital: 'Owerri',
    coordinates: { latitude: 5.4867, longitude: 7.0147 },
    zones: [
      {
        zoneId: 'imo_zone',
        zoneName: 'Imo State',
        deliveryDays: { min: 2, max: 4 },
        baseFee: 1700,
        perKmRate: 130,
      },
    ],
  },
  {
    name: 'Abia',
    code: 'AB',
    region: 'Southeast',
    capital: 'Umuahia',
    coordinates: { latitude: 5.5244, longitude: 7.4935 },
    zones: [
      {
        zoneId: 'abia_zone',
        zoneName: 'Abia State',
        deliveryDays: { min: 2, max: 4 },
        baseFee: 1700,
        perKmRate: 130,
      },
    ],
  },
  {
    name: 'Cross River',
    code: 'CR',
    region: 'Southeast',
    capital: 'Calabar',
    coordinates: { latitude: 4.9526, longitude: 8.6753 },
    zones: [
      {
        zoneId: 'cross_river_zone',
        zoneName: 'Cross River State',
        deliveryDays: { min: 2, max: 4 },
        baseFee: 1600,
        perKmRate: 120,
      },
    ],
  },
  {
    name: 'Rivers',
    code: 'RV',
    region: 'Southsouth',
    capital: 'Port Harcourt',
    coordinates: { latitude: 4.7957, longitude: 7.0064 },
    zones: [
      {
        zoneId: 'rivers_zone',
        zoneName: 'Rivers State',
        deliveryDays: { min: 2, max: 4 },
        baseFee: 1900,
        perKmRate: 150,
      },
    ],
  },
  {
    name: 'Bayelsa',
    code: 'BY',
    region: 'Southsouth',
    capital: 'Yenagoa',
    coordinates: { latitude: 4.9243, longitude: 6.2663 },
    zones: [
      {
        zoneId: 'bayelsa_zone',
        zoneName: 'Bayelsa State',
        deliveryDays: { min: 2, max: 4 },
        baseFee: 1800,
        perKmRate: 140,
      },
    ],
  },
  {
    name: 'Delta',
    code: 'DL',
    region: 'Southsouth',
    capital: 'Asaba',
    coordinates: { latitude: 5.7833, longitude: 6.1667 },
    zones: [
      {
        zoneId: 'delta_zone',
        zoneName: 'Delta State',
        deliveryDays: { min: 2, max: 4 },
        baseFee: 1800,
        perKmRate: 140,
      },
    ],
  },
  {
    name: 'Edo',
    code: 'ED',
    region: 'Southsouth',
    capital: 'Benin City',
    coordinates: { latitude: 6.3350, longitude: 5.6201 },
    zones: [
      {
        zoneId: 'edo_zone',
        zoneName: 'Edo State',
        deliveryDays: { min: 2, max: 4 },
        baseFee: 1700,
        perKmRate: 130,
      },
    ],
  },
  {
    name: 'Akwa Ibom',
    code: 'AK',
    region: 'Southsouth',
    capital: 'Uyo',
    coordinates: { latitude: 5.0269, longitude: 7.9194 },
    zones: [
      {
        zoneId: 'akwa_ibom_zone',
        zoneName: 'Akwa Ibom State',
        deliveryDays: { min: 2, max: 4 },
        baseFee: 1800,
        perKmRate: 140,
      },
    ],
  },
  {
    name: 'Jigawa',
    code: 'JI',
    region: 'North',
    capital: 'Dutse',
    coordinates: { latitude: 11.7667, longitude: 9.9167 },
    zones: [
      {
        zoneId: 'jigawa_zone',
        zoneName: 'Jigawa State',
        deliveryDays: { min: 3, max: 5 },
        baseFee: 1500,
        perKmRate: 110,
      },
    ],
  },
  {
    name: 'Kano',
    code: 'KN',
    region: 'North',
    capital: 'Kano',
    coordinates: { latitude: 11.9500, longitude: 8.4667 },
    zones: [
      {
        zoneId: 'kano_zone',
        zoneName: 'Kano State',
        deliveryDays: { min: 3, max: 5 },
        baseFee: 1600,
        perKmRate: 120,
      },
    ],
  },
  {
    name: 'Katsina',
    code: 'KT',
    region: 'North',
    capital: 'Katsina',
    coordinates: { latitude: 12.9833, longitude: 7.6167 },
    zones: [
      {
        zoneId: 'katsina_zone',
        zoneName: 'Katsina State',
        deliveryDays: { min: 3, max: 5 },
        baseFee: 1500,
        perKmRate: 110,
      },
    ],
  },
  {
    name: 'Kebbi',
    code: 'KB',
    region: 'North',
    capital: 'Birnin Kebbi',
    coordinates: { latitude: 12.4519, longitude: 4.1975 },
    zones: [
      {
        zoneId: 'kebbi_zone',
        zoneName: 'Kebbi State',
        deliveryDays: { min: 3, max: 5 },
        baseFee: 1400,
        perKmRate: 100,
      },
    ],
  },
  {
    name: 'Sokoto',
    code: 'SK',
    region: 'North',
    capital: 'Sokoto',
    coordinates: { latitude: 13.5116, longitude: 5.2411 },
    zones: [
      {
        zoneId: 'sokoto_zone',
        zoneName: 'Sokoto State',
        deliveryDays: { min: 3, max: 5 },
        baseFee: 1400,
        perKmRate: 100,
      },
    ],
  },
  {
    name: 'Zamfara',
    code: 'ZA',
    region: 'North',
    capital: 'Gusau',
    coordinates: { latitude: 12.1667, longitude: 6.7167 },
    zones: [
      {
        zoneId: 'zamfara_zone',
        zoneName: 'Zamfara State',
        deliveryDays: { min: 3, max: 5 },
        baseFee: 1400,
        perKmRate: 100,
      },
    ],
  },
  {
    name: 'Kogi (Confirmed)',
    code: 'KG',
    region: 'Northcentral',
    capital: 'Lokoja',
    coordinates: { latitude: 7.8009, longitude: 6.7539 },
    zones: [
      {
        zoneId: 'kogi_confirmed_zone',
        zoneName: 'Kogi State',
        deliveryDays: { min: 2, max: 4 },
        baseFee: 1600,
        perKmRate: 120,
      },
    ],
  },
  {
    name: 'Nassarawa',
    code: 'NS',
    region: 'Northcentral',
    capital: 'Lafia',
    coordinates: { latitude: 8.5226, longitude: 8.5494 },
    zones: [
      {
        zoneId: 'nassarawa_zone',
        zoneName: 'Nassarawa State',
        deliveryDays: { min: 2, max: 4 },
        baseFee: 1600,
        perKmRate: 120,
      },
    ],
  },
  {
    name: 'Plateau',
    code: 'PL',
    region: 'Northcentral',
    capital: 'Jos',
    coordinates: { latitude: 9.9265, longitude: 9.9833 },
    zones: [
      {
        zoneId: 'plateau_zone',
        zoneName: 'Plateau State',
        deliveryDays: { min: 2, max: 4 },
        baseFee: 1600,
        perKmRate: 120,
      },
    ],
  },
  {
    name: 'Niger',
    code: 'NG',
    region: 'Northcentral',
    capital: 'Minna',
    coordinates: { latitude: 9.6222, longitude: 6.5436 },
    zones: [
      {
        zoneId: 'niger_zone',
        zoneName: 'Niger State',
        deliveryDays: { min: 2, max: 4 },
        baseFee: 1500,
        perKmRate: 110,
      },
    ],
  },
  {
    name: 'Adamawa',
    code: 'AD',
    region: 'North',
    capital: 'Yola',
    coordinates: { latitude: 9.2077, longitude: 12.4719 },
    zones: [
      {
        zoneId: 'adamawa_zone',
        zoneName: 'Adamawa State',
        deliveryDays: { min: 3, max: 5 },
        baseFee: 1500,
        perKmRate: 110,
      },
    ],
  },
  {
    name: 'Taraba',
    code: 'TR',
    region: 'North',
    capital: 'Jalingo',
    coordinates: { latitude: 8.8941, longitude: 11.3517 },
    zones: [
      {
        zoneId: 'taraba_zone',
        zoneName: 'Taraba State',
        deliveryDays: { min: 3, max: 5 },
        baseFee: 1500,
        perKmRate: 110,
      },
    ],
  },
  {
    name: 'Gombe',
    code: 'GM',
    region: 'North',
    capital: 'Gombe',
    coordinates: { latitude: 10.2936, longitude: 11.1712 },
    zones: [
      {
        zoneId: 'gombe_zone',
        zoneName: 'Gombe State',
        deliveryDays: { min: 3, max: 5 },
        baseFee: 1500,
        perKmRate: 110,
      },
    ],
  },
  {
    name: 'Yobe',
    code: 'YB',
    region: 'North',
    capital: 'Damaturu',
    coordinates: { latitude: 11.9500, longitude: 11.9667 },
    zones: [
      {
        zoneId: 'yobe_zone',
        zoneName: 'Yobe State',
        deliveryDays: { min: 3, max: 5 },
        baseFee: 1500,
        perKmRate: 110,
      },
    ],
  },
  {
    name: 'Borno',
    code: 'BR',
    region: 'North',
    capital: 'Maiduguri',
    coordinates: { latitude: 11.8410, longitude: 13.1531 },
    zones: [
      {
        zoneId: 'borno_zone',
        zoneName: 'Borno State',
        deliveryDays: { min: 3, max: 5 },
        baseFee: 1500,
        perKmRate: 110,
      },
    ],
  },
];

async function seedNigerianStates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/empi');

    // Clear existing data
    await NigerianState.deleteMany({});

    // Insert all states
    const result = await NigerianState.insertMany(NIGERIAN_STATES_DATA);

    console.log(`✅ Successfully seeded ${result.length} Nigerian states`);
    console.log('States added:');
    result.forEach((state) => {
      console.log(`  - ${state.name} (${state.code})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Nigerian states:', error);
    process.exit(1);
  }
}

seedNigerianStates();
