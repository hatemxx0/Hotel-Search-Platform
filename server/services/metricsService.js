import NodeCache from 'node-cache';

// In-memory metrics storage (use Redis in production for multi-instance deployments)
const metricsCache = new NodeCache({ stdTTL: 86400 }); // 24 hours

const apiMetrics = {
  tbo: { requests: 0, errors: 0, totalTime: 0, lastError: null, lastSuccess: null },
  webbeds: { requests: 0, errors: 0, totalTime: 0, lastError: null, lastSuccess: null },
  google_geocoding: { requests: 0, errors: 0, totalTime: 0, lastError: null, lastSuccess: null },
  google_reverse_geocoding: { requests: 0, errors: 0, totalTime: 0, lastError: null, lastSuccess: null },
  booking: { requests: 0, errors: 0, totalTime: 0, lastError: null, lastSuccess: null }
};

const systemMetrics = {
  totalRequests: 0,
  totalErrors: 0,
  cacheHits: 0,
  cacheMisses: 0,
  startTime: Date.now()
};

export async function trackAPICall(provider, apiCall) {
  const startTime = Date.now();
  
  if (!apiMetrics[provider]) {
    apiMetrics[provider] = { requests: 0, errors: 0, totalTime: 0, lastError: null, lastSuccess: null };
  }
  
  apiMetrics[provider].requests++;
  systemMetrics.totalRequests++;
  
  try {
    const result = await apiCall();
    
    const endTime = Date.now();
    apiMetrics[provider].totalTime += (endTime - startTime);
    apiMetrics[provider].lastSuccess = new Date().toISOString();
    
    // Store recent response times
    const recentTimes = metricsCache.get(`${provider}_response_times`) || [];
    recentTimes.push(endTime - startTime);
    if (recentTimes.length > 100) recentTimes.shift(); // Keep last 100
    metricsCache.set(`${provider}_response_times`, recentTimes);
    
    console.log(`📊 ${provider.toUpperCase()} API call completed in ${endTime - startTime}ms`);
    
    return result;
  } catch (error) {
    const endTime = Date.now();
    apiMetrics[provider].errors++;
    systemMetrics.totalErrors++;
    apiMetrics[provider].totalTime += (endTime - startTime);
    apiMetrics[provider].lastError = {
      timestamp: new Date().toISOString(),
      message: error.message
    };
    
    console.error(`❌ ${provider.toUpperCase()} API call failed after ${endTime - startTime}ms:`, error.message);
    
    throw error;
  }
}

export function trackCacheHit() {
  systemMetrics.cacheHits++;
}

export function trackCacheMiss() {
  systemMetrics.cacheMisses++;
}

export function getMetrics() {
  const now = Date.now();
  const uptime = now - systemMetrics.startTime;
  
  const processedMetrics = {};
  
  for (const [provider, metrics] of Object.entries(apiMetrics)) {
    const recentTimes = metricsCache.get(`${provider}_response_times`) || [];
    
    processedMetrics[provider] = {
      ...metrics,
      averageResponseTime: metrics.requests > 0 ? Math.round(metrics.totalTime / metrics.requests) : 0,
      errorRate: metrics.requests > 0 ? Math.round((metrics.errors / metrics.requests) * 100) : 0,
      recentAverageResponseTime: recentTimes.length > 0 ? 
        Math.round(recentTimes.reduce((a, b) => a + b, 0) / recentTimes.length) : 0,
      requestsPerMinute: metrics.requests > 0 ? 
        Math.round((metrics.requests / (uptime / 1000)) * 60) : 0
    };
  }
  
  const cacheTotal = systemMetrics.cacheHits + systemMetrics.cacheMisses;
  
  return {
    apis: processedMetrics,
    system: {
      ...systemMetrics,
      uptime: Math.round(uptime / 1000), // seconds
      cacheHitRate: cacheTotal > 0 ? Math.round((systemMetrics.cacheHits / cacheTotal) * 100) : 0,
      requestsPerMinute: systemMetrics.totalRequests > 0 ? 
        Math.round((systemMetrics.totalRequests / (uptime / 1000)) * 60) : 0,
      errorRate: systemMetrics.totalRequests > 0 ? 
        Math.round((systemMetrics.totalErrors / systemMetrics.totalRequests) * 100) : 0,
      uptimeHuman: formatUptime(uptime)
    },
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };
}

export function resetMetrics() {
  // Reset API metrics
  for (const provider in apiMetrics) {
    apiMetrics[provider] = { 
      requests: 0, 
      errors: 0, 
      totalTime: 0, 
      lastError: null, 
      lastSuccess: null 
    };
    metricsCache.del(`${provider}_response_times`);
  }
  
  // Reset system metrics
  systemMetrics.totalRequests = 0;
  systemMetrics.totalErrors = 0;
  systemMetrics.cacheHits = 0;
  systemMetrics.cacheMisses = 0;
  systemMetrics.startTime = Date.now();
  
  console.log('📊 Metrics reset');
}

// Health check for APIs
export function getAPIHealthStatus() {
  const health = {};
  
  for (const [provider, metrics] of Object.entries(apiMetrics)) {
    const recentTimes = metricsCache.get(`${provider}_response_times`) || [];
    const recentAverage = recentTimes.length > 0 ? 
      recentTimes.reduce((a, b) => a + b, 0) / recentTimes.length : 0;
    
    let status = 'healthy';
    if (metrics.requests === 0) {
      status = 'unknown';
    } else if (metrics.errorRate > 50) {
      status = 'critical';
    } else if (metrics.errorRate > 20 || recentAverage > 10000) {
      status = 'degraded';
    }
    
    health[provider] = {
      status,
      errorRate: metrics.requests > 0 ? Math.round((metrics.errors / metrics.requests) * 100) : 0,
      averageResponseTime: Math.round(recentAverage),
      lastSuccess: metrics.lastSuccess,
      lastError: metrics.lastError
    };
  }
  
  return health;
}

function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
}