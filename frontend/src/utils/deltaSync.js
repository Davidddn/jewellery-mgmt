// src/utils/deltaSync.js
// Delta synchronization - only sync changed fields

class DeltaSync {
  // Generate diff between two objects
  static generateDiff(original, updated) {
    const diff = {};
    const allKeys = new Set([...Object.keys(original || {}), ...Object.keys(updated || {})]);
    
    for (const key of allKeys) {
      const originalValue = original?.[key];
      const updatedValue = updated?.[key];
      
      if (originalValue !== updatedValue) {
        if (typeof originalValue === 'object' && typeof updatedValue === 'object' && 
            originalValue !== null && updatedValue !== null) {
          const nestedDiff = this.generateDiff(originalValue, updatedValue);
          if (Object.keys(nestedDiff).length > 0) {
            diff[key] = nestedDiff;
          }
        } else {
          diff[key] = {
            old: originalValue,
            new: updatedValue,
            action: originalValue === undefined ? 'add' : 
                   updatedValue === undefined ? 'remove' : 'update'
          };
        }
      }
    }
    
    return diff;
  }
  
  // Apply diff to an object
  static applyDiff(original, diff) {
    const result = { ...original };
    
    for (const [key, change] of Object.entries(diff)) {
      if (typeof change === 'object' && change.action) {
        // Simple change
        switch (change.action) {
          case 'add':
          case 'update':
            result[key] = change.new;
            break;
          case 'remove':
            delete result[key];
            break;
        }
      } else {
        // Nested change
        result[key] = this.applyDiff(result[key] || {}, change);
      }
    }
    
    return result;
  }
  
  // Check if diff is empty
  static isEmpty(diff) {
    return Object.keys(diff).length === 0;
  }
  
  // Calculate diff size
  static getDiffSize(diff) {
    return JSON.stringify(diff).length;
  }
  
  // Merge multiple diffs
  static mergeDiffs(diffs) {
    return diffs.reduce((merged, diff) => {
      for (const [key, change] of Object.entries(diff)) {
        if (merged[key] && typeof change === 'object' && !change.action) {
          merged[key] = this.mergeDiffs([merged[key], change]);
        } else {
          merged[key] = change;
        }
      }
      return merged;
    }, {});
  }
}

export { DeltaSync };
