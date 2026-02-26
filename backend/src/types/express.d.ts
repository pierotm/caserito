declare namespace Express {
  interface Request {
    auth?: {
      userId: string;
      storeId: string;
      email: string;
      role: string;
    };
  }
}
