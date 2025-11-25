/**
 * Convert MongoDB documents to plain JSON-serializable objects
 * Converts ObjectIds to strings and Dates to ISO strings
 */
export function serializeDoc(doc: any): any {
  if (!doc) return null;
  
  // Convert to plain object
  const obj = doc.toObject?.() || doc;
  
  // Recursively convert ObjectIds to strings and Dates to ISO strings
  const serialize = (val: any): any => {
    if (!val) return val;
    
    // Handle Date objects - convert to ISO string
    if (val instanceof Date) {
      return val.toISOString();
    }
    
    // Handle ObjectId
    if (val._bsontype === 'ObjectId' || (val.constructor?.name === 'ObjectId')) {
      return val.toString();
    }
    
    // Handle arrays
    if (Array.isArray(val)) {
      return val.map(serialize);
    }
    
    // Handle nested objects
    if (typeof val === 'object' && val !== null) {
      const result: any = {};
      for (const key in val) {
        if (Object.prototype.hasOwnProperty.call(val, key)) {
          result[key] = serialize(val[key]);
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
  return docs.map(serializeDoc);
}
