// src/utils/dataCompression.js
// Data compression utilities for offline storage

// Simple LZ-string based compression
class DataCompressor {
  // Compress data before storing
  static compress(data) {
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }
    
    // Simple dictionary-based compression
    const dict = {};
    let dictSize = 256;
    let result = [];
    let w = '';
    
    for (let i = 0; i < data.length; i++) {
      const c = data.charAt(i);
      const wc = w + c;
      
      if (dict[wc]) {
        w = wc;
      } else {
        result.push(dict[w] || w.charCodeAt(0));
        dict[wc] = dictSize++;
        w = c;
      }
    }
    
    if (w) {
      result.push(dict[w] || w.charCodeAt(0));
    }
    
    return result;
  }
  
  // Decompress data after retrieval
  static decompress(compressed) {
    if (!Array.isArray(compressed)) return compressed;
    
    const dict = {};
    let dictSize = 256;
    let result = '';
    let w = String.fromCharCode(compressed[0]);
    result = w;
    
    for (let i = 1; i < compressed.length; i++) {
      const k = compressed[i];
      let entry;
      
      if (dict[k]) {
        entry = dict[k];
      } else if (k === dictSize) {
        entry = w + w.charAt(0);
      } else {
        throw new Error('Invalid compressed data');
      }
      
      result += entry;
      dict[dictSize++] = w + entry.charAt(0);
      w = entry;
    }
    
    try {
      return JSON.parse(result);
    } catch {
      return result;
    }
  }
  
  // Calculate compression ratio
  static getCompressionRatio(original, compressed) {
    const originalSize = JSON.stringify(original).length;
    const compressedSize = JSON.stringify(compressed).length;
    return ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
  }
}

export { DataCompressor };
