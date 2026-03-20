/**
 * 错误处理工具
 * 统一错误格式和提示
 */

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

class RateLimitError extends AppError {
  constructor(message) {
    super(message, 429, 'RATE_LIMIT');
  }
}

// 错误处理中间件
function errorHandler(err, req, res, next) {
  console.error('错误:', err);

  // 默认错误响应
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';
  const code = err.code || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    error: message,
    code,
    timestamp: new Date().toISOString()
  });
}

// 异步错误处理包装器
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 重试工具
async function retry(fn, options = {}) {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 2,
    shouldRetry = () => true
  } = options;

  let lastError;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (i === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      const currentDelay = delay * Math.pow(backoff, i);
      console.warn(`重试 ${i + 1}/${maxRetries}，延迟 ${currentDelay}ms`);
      await new Promise(resolve => setTimeout(resolve, currentDelay));
    }
  }

  throw lastError;
}

// 超时工具
function withTimeout(fn, timeoutMs, timeoutMessage = '操作超时') {
  return Promise.race([
    fn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new AppError(timeoutMessage, 408, 'TIMEOUT')), timeoutMs)
    )
  ]);
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  errorHandler,
  asyncHandler,
  retry,
  withTimeout
};
