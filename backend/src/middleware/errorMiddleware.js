export function notFoundHandler(request, response) {
  response.status(404).json({
    message: `Route not found: ${request.method} ${request.originalUrl}`,
  });
}

export function errorHandler(error, _request, response, _next) {
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors)
      .map((validationError) => validationError.message)
      .join(', ');

    return response.status(400).json({ message });
  }

  if (error.name === 'CastError') {
    return response.status(400).json({ message: 'Invalid resource identifier' });
  }

  if (error.code === 11000) {
    return response.status(409).json({ message: 'A record with these details already exists' });
  }

  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'An unexpected server error occurred' : error.message;

  if (statusCode === 500) {
    console.error(error);
  }

  return response.status(statusCode).json({ message });
}
