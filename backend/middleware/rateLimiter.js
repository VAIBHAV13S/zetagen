import rateLimit from 'express-rate-limit';

// General API rate limiting
export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiting for asset generation
export const generateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 generation requests per 5 minutes
  message: {
    success: false,
    error: 'Too many generation requests. Please wait before generating more assets.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for minting operations
export const mintLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 5, // limit each IP to 5 mint requests per 2 minutes
  message: {
    success: false,
    error: 'Too many minting requests. Please wait before minting more assets.',
    retryAfter: '2 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for suggestion requests
export const suggestLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 suggestion requests per minute
  message: {
    success: false,
    error: 'Too many suggestion requests. Please wait before requesting more suggestions.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
