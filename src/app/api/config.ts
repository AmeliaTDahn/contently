export const config = {
  runtime: 'nodejs',
  maxDuration: 300 // 5 minutes in seconds
};

export const apiConfig = {
  maxTimeout: 240000, // 4 minutes
  maxRetries: 3,
  retryDelay: 1000, // 1 second
}; 