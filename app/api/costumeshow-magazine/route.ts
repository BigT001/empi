import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dirPath = path.join(process.cwd(), 'public', 'costumeshow');
    if (!fs.existsSync(dirPath)) {
      return NextResponse.json({ success: false, error: 'Directory not found' }, { status: 404 });
    }

    const files = fs.readdirSync(dirPath);
    
    // Filter PNG files
    const pngFiles = files.filter(f => f.endsWith('.png'));

    // Custom sorting parser
    const regex = /Image 11-07-2026 at (\d{2})\.(\d{2})(?:\s*\((\d+)\))?\.png/;

    const sortedFiles = pngFiles.map(name => {
      const match = name.match(regex);
      if (!match) {
        // If file doesn't match standard format, push to end
        return { name, hour: 99, minute: 99, index: 99 };
      }
      return {
        name,
        hour: parseInt(match[1]),
        minute: parseInt(match[2]),
        index: match[3] ? parseInt(match[3]) : 0
      };
    }).sort((a, b) => {
      if (a.hour !== b.hour) return a.hour - b.hour;
      if (a.minute !== b.minute) return a.minute - b.minute;
      return a.index - b.index;
    }).map(f => `/costumeshow/${f.name}`);

    return NextResponse.json({ success: true, images: sortedFiles });
  } catch (error: any) {
    console.error('Error reading costumeshow directory:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
