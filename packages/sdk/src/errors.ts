import { SmartAccountError } from "smart-account-kit";

export class BoundlessAuthError extends SmartAccountError {
  constructor(message: string) {
    super(message, "BOUNDLESS_AUTH" as any);
    this.name = "BoundlessAuthError";
  }
}

export class BoundlessLinkError extends SmartAccountError {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message, "BOUNDLESS_LINK" as any);
    this.name = "BoundlessLinkError";
  }
}
