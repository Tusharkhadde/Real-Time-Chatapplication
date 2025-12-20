// Simple in-memory rate limiter (no Redis required)
const rateLimitStore = new Map();

const createRateLimiter = (options = {}) => {
  const {
    windowMs = 60000,  // 1 minute
    max = 100,         // requests per window
    message = 'Too many requests, please try again later'
  } = options;

  // Cleanup old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
      if (now - data.windowStart > windowMs) {
        rateLimitStore.delete(key);
      }
    }
  }, windowMs);

  return (req, res, next) => {
    const key = req.ip + (req.user?._id || '');
    const now = Date.now();
    
    let data = rateLimitStore.get(key);
    
    if (!data || now - data.windowStart > windowMs) {
      data = { count: 1, windowStart: now };
      rateLimitStore.set(key, data);
      return next();
    }
    
    data.count++;
    
    if (data.count > max) {
      return res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil((data.windowStart + windowMs - now) / 1000)
      });
    }
    
    next();
  };
};

// Different rate limiters for different routes
const generalLimiter = createRateLimiter({
  windowMs: 60000,
  max: 100,
  message: 'Too many requests'
});

const authLimiter = createRateLimiter({
  windowMs: 900000, // 15 minutes
  max: 10,
  message: 'Too many login attempts, please try again later'
});

const messageLimiter = createRateLimiter({
  windowMs: 1000,
  max: 30,
  message: 'Sending messages too fast'
});

const uploadLimiter = createRateLimiter({
  windowMs: 60000,
  max: 10,
  message: 'Too many uploads'
});

module.exports = {
  createRateLimiter,
  generalLimiter,
  authLimiter,
  messageLimiter,
  uploadLimiter
};