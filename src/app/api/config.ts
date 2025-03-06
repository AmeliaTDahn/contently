export const config = {
  runtime: 'edge',
  regions: ['iad1'], // Use a specific region for better performance
};

export const apiConfig = {
  maxTimeout: 60000, // 60 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
}; 