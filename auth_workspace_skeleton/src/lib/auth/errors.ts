export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class WorkspaceNotFoundError extends Error {
  constructor(message = 'Workspace not found or inaccessible') {
    super(message);
    this.name = 'WorkspaceNotFoundError';
  }
}
