// typed http errors — the error handler maps statusCode straight to the response
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "unauthorized") {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "forbidden") {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "not found") {
    super(404, message);
  }
}
