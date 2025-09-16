// src/utils/conflictResolver.js
// Advanced conflict resolution with field-level granularity

class ConflictResolver {
  // Detect field-level conflicts
  static detectFieldConflicts(localData, serverData, originalData = {}) {
    const conflicts = {};
    const allFields = new Set([
      ...Object.keys(localData || {}),
      ...Object.keys(serverData || {}),
      ...Object.keys(originalData || {})
    ]);
    
    for (const field of allFields) {
      const local = localData?.[field];
      const server = serverData?.[field];
      const original = originalData?.[field];
      
      // Three-way comparison
      if (local !== server) {
        if (local !== original && server !== original) {
          // Both changed - conflict
          conflicts[field] = {
            type: 'conflict',
            local,
            server,
            original,
            resolution: null
          };
        } else if (local !== original) {
          // Only local changed - auto-resolve to local
          conflicts[field] = {
            type: 'local-only',
            local,
            server,
            original,
            resolution: 'local'
          };
        } else {
          // Only server changed - auto-resolve to server
          conflicts[field] = {
            type: 'server-only',
            local,
            server,
            original,
            resolution: 'server'
          };
        }
      }
    }
    
    return conflicts;
  }
  
  // Auto-resolve conflicts based on rules
  static autoResolveConflicts(conflicts, rules = {}) {
    const resolved = { ...conflicts };
    
    Object.keys(resolved).forEach(field => {
      const conflict = resolved[field];
      
      if (conflict.type !== 'conflict') return; // Already resolved
      
      const rule = rules[field] || rules['*']; // Field-specific or default rule
      
      if (rule) {
        switch (rule.strategy) {
          case 'latest-timestamp':
            if (rule.timestampField) {
              const localTime = new Date(conflict.local[rule.timestampField] || 0);
              const serverTime = new Date(conflict.server[rule.timestampField] || 0);
              conflict.resolution = localTime > serverTime ? 'local' : 'server';
            }
            break;
          case 'prefer-local':
            conflict.resolution = 'local';
            break;
          case 'prefer-server':
            conflict.resolution = 'server';
            break;
          case 'merge-arrays':
            if (Array.isArray(conflict.local) && Array.isArray(conflict.server)) {
              conflict.resolution = 'merge';
              conflict.merged = [...new Set([...conflict.local, ...conflict.server])];
            }
            break;
          case 'numeric-max':
            if (typeof conflict.local === 'number' && typeof conflict.server === 'number') {
              conflict.resolution = conflict.local > conflict.server ? 'local' : 'server';
            }
            break;
        }
      }
    });
    
    return resolved;
  }
  
  // Apply conflict resolutions
  static applyResolutions(localData, conflicts) {
    const resolved = { ...localData };
    
    Object.keys(conflicts).forEach(field => {
      const conflict = conflicts[field];
      
      switch (conflict.resolution) {
        case 'local':
          resolved[field] = conflict.local;
          break;
        case 'server':
          resolved[field] = conflict.server;
          break;
        case 'merge':
          resolved[field] = conflict.merged;
          break;
        case 'original':
          resolved[field] = conflict.original;
          break;
      }
    });
    
    return resolved;
  }
  
  // Generate human-readable conflict summary
  static generateConflictSummary(conflicts) {
    const summary = {
      total: Object.keys(conflicts).length,
      byType: {
        conflict: 0,
        'local-only': 0,
        'server-only': 0
      },
      fields: Object.keys(conflicts),
      requiresUserInput: []
    };
    
    Object.values(conflicts).forEach(conflict => {
      summary.byType[conflict.type]++;
      if (!conflict.resolution) {
        summary.requiresUserInput.push(conflict);
      }
    });
    
    return summary;
  }
  
  // Calculate conflict complexity score
  static getComplexityScore(conflicts) {
    let score = 0;
    Object.values(conflicts).forEach(conflict => {
      if (conflict.type === 'conflict') score += 3;
      else if (conflict.type === 'local-only' || conflict.type === 'server-only') score += 1;
    });
    return score;
  }
}

export { ConflictResolver };
