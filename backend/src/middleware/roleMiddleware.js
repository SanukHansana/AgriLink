export function requireRole(...allowedRoles) {
  return (request, response, next) => {
    if (!request.user || !allowedRoles.includes(request.user.role)) {
      return response.status(403).json({
        message: 'You do not have permission to access this resource',
      });
    }

    if (request.user.role === 'agricultureOfficer' && request.user.isVerified !== true) {
      return response.status(403).json({ message: 'Your agriculture officer account is awaiting administrator verification' });
    }
    return next();
  };
}
