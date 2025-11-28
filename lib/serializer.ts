/**
 * Convert MongoDB documents to plain JSON-serializable objects
 * Converts ObjectIds to strings and Dates to ISO strings
 */
export function serializeDoc(doc: any): any {
  if (!doc) return null;
  
  // Convert to plain object
  const obj = doc.toObject?.() || doc;
  
  // Recursively convert ObjectIds to strings and Dates to ISO strings
  const serialize = (val: any, depth = 0): any => {
    if (!val) return val;
    
    // Handle Date objects - convert to ISO string
    if (val instanceof Date) {
      return val.toISOString();
    }
    
    // Handle ObjectId - multiple ways to detect it
    if (val._bsontype === 'ObjectId' || (val.constructor?.name === 'ObjectId') || typeof val.toHexString === 'function') {
      return val.toString();
    }
    
    // Handle arrays
    if (Array.isArray(val)) {
      return val.map(item => serialize(item, depth + 1));
    }
    
    // Handle nested objects
    if (typeof val === 'object' && val !== null && depth < 10) {
      const result: any = {};
      for (const key in val) {
        if (Object.prototype.hasOwnProperty.call(val, key)) {
          result[key] = serialize(val[key], depth + 1);
        }
      }
      return result;
    }
    
    return val;
  };
  
  return serialize(obj);
}

/**
 * Serialize an array of MongoDB documents
 */
export function serializeDocs(docs: any[]): any[] {
  const serialized = docs.map(serializeDoc);
  console.log("✅ Serialized docs count:", serialized.length, "First doc:", serialized[0]);
  return serialized;
}
