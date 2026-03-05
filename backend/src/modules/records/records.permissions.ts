/** Thrown when permission check fails. */
export class PermissionDeniedError extends Error {
  constructor(message = "Access denied") {
    super(message);
    this.name = "PermissionDeniedError";
  }
}
