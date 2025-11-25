import { NextRequest, NextResponse } from 'next/server';

// All 36 Nigerian states with coordinates
const NIGERIAN_STATES = [
  { name: 'Lagos', code: 'LA', region: 'Southwest', capital: 'Ikeja', coordinates: { latitude: 6.5244, longitude: 3.3662 } },
  { name: 'Ogun', code: 'OG', region: 'Southwest', capital: 'Abeokuta', coordinates: { latitude: 7.1964, longitude: 3.3857 } },
  { name: 'Oyo', code: 'OY', region: 'Southwest', capital: 'Ibadan', coordinates: { latitude: 7.3957, longitude: 3.9039 } },
  { name: 'Osun', code: 'OS', region: 'Southwest', capital: 'Oshogbo', coordinates: { latitude: 7.7675, longitude: 4.5405 } },
  { name: 'Ondo', code: 'OD', region: 'Southwest', capital: 'Akure', coordinates: { latitude: 7.2521, longitude: 5.1971 } },
  { name: 'Ekiti', code: 'EK', region: 'Southwest', capital: 'Ado-Ekiti', coordinates: { latitude: 7.6209, longitude: 5.2283 } },
  { name: 'Kogi', code: 'KO', region: 'Northcentral', capital: 'Lokoja', coordinates: { latitude: 7.8009, longitude: 6.7539 } },
  { name: 'Kwara', code: 'KW', region: 'Northcentral', capital: 'Ilorin', coordinates: { latitude: 8.4961, longitude: 4.5449 } },
  { name: 'Abuja (FCT)', code: 'AB', region: 'Northcentral', capital: 'Abuja', coordinates: { latitude: 9.0765, longitude: 7.3986 } },
  { name: 'Nassarawa', code: 'NS', region: 'Northcentral', capital: 'Lafia', coordinates: { latitude: 8.5226, longitude: 8.5494 } },
  { name: 'Niger', code: 'NG', region: 'Northcentral', capital: 'Minna', coordinates: { latitude: 9.6222, longitude: 6.5436 } },
  { name: 'Plateau', code: 'PL', region: 'Northcentral', capital: 'Jos', coordinates: { latitude: 9.9265, longitude: 9.9833 } },
  { name: 'Enugu', code: 'EN', region: 'Southeast', capital: 'Enugu', coordinates: { latitude: 6.4549, longitude: 7.4977 } },
  { name: 'Anambra', code: 'AN', region: 'Southeast', capital: 'Awka', coordinates: { latitude: 6.2167, longitude: 7.0833 } },
  { name: 'Ebonyi', code: 'EB', region: 'Southeast', capital: 'Abakaliki', coordinates: { latitude: 6.3275, longitude: 8.1157 } },
  { name: 'Imo', code: 'IM', region: 'Southeast', capital: 'Owerri', coordinates: { latitude: 5.4867, longitude: 7.0147 } },
  { name: 'Abia', code: 'AB', region: 'Southeast', capital: 'Umuahia', coordinates: { latitude: 5.5244, longitude: 7.4935 } },
  { name: 'Cross River', code: 'CR', region: 'Southeast', capital: 'Calabar', coordinates: { latitude: 4.9526, longitude: 8.6753 } },
  { name: 'Rivers', code: 'RV', region: 'Southsouth', capital: 'Port Harcourt', coordinates: { latitude: 4.7957, longitude: 7.0064 } },
  { name: 'Bayelsa', code: 'BY', region: 'Southsouth', capital: 'Yenagoa', coordinates: { latitude: 4.9243, longitude: 6.2663 } },
  { name: 'Delta', code: 'DL', region: 'Southsouth', capital: 'Asaba', coordinates: { latitude: 5.7833, longitude: 6.1667 } },
  { name: 'Edo', code: 'ED', region: 'Southsouth', capital: 'Benin City', coordinates: { latitude: 6.3350, longitude: 5.6201 } },
  { name: 'Akwa Ibom', code: 'AK', region: 'Southsouth', capital: 'Uyo', coordinates: { latitude: 5.0269, longitude: 7.9194 } },
  { name: 'Jigawa', code: 'JI', region: 'North', capital: 'Dutse', coordinates: { latitude: 11.7667, longitude: 9.9167 } },
  { name: 'Kano', code: 'KN', region: 'North', capital: 'Kano', coordinates: { latitude: 11.9500, longitude: 8.4667 } },
  { name: 'Katsina', code: 'KT', region: 'North', capital: 'Katsina', coordinates: { latitude: 12.9833, longitude: 7.6167 } },
  { name: 'Kebbi', code: 'KB', region: 'North', capital: 'Birnin Kebbi', coordinates: { latitude: 12.4519, longitude: 4.1975 } },
  { name: 'Sokoto', code: 'SK', region: 'North', capital: 'Sokoto', coordinates: { latitude: 13.5116, longitude: 5.2411 } },
  { name: 'Zamfara', code: 'ZA', region: 'North', capital: 'Gusau', coordinates: { latitude: 12.1667, longitude: 6.7167 } },
  { name: 'Adamawa', code: 'AD', region: 'North', capital: 'Yola', coordinates: { latitude: 9.2077, longitude: 12.4719 } },
  { name: 'Taraba', code: 'TR', region: 'North', capital: 'Jalingo', coordinates: { latitude: 8.8941, longitude: 11.3517 } },
  { name: 'Gombe', code: 'GM', region: 'North', capital: 'Gombe', coordinates: { latitude: 10.2936, longitude: 11.1712 } },
  { name: 'Yobe', code: 'YB', region: 'North', capital: 'Damaturu', coordinates: { latitude: 11.9500, longitude: 11.9667 } },
  { name: 'Borno', code: 'BR', region: 'North', capital: 'Maiduguri', coordinates: { latitude: 11.8410, longitude: 13.1531 } },
];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      count: NIGERIAN_STATES.length,
      data: NIGERIAN_STATES,
    });
  } catch (error) {
    console.error('Error fetching Nigerian states:', error);
    return NextResponse.json(
      { error: 'Failed to fetch states' },
      { status: 500 }
    );
  }
}
