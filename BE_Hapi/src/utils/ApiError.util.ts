export class ApiError extends Error {
    constructor(message: string, public code: number) {
      super(message);
      this.name = "ApiError";
    }
  
    toJSON() {
      return {
        status: "Failed",
        error: this.message,
        code: this.code,
      };
    }
  }