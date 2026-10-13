export const environment = {
  production: import.meta.env.PROD,
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  signalRHubUrl: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/hubs/trading`,
  appName: 'StockSquares',
  defaultSymbol: 'BTCUSDT',
  reconnectIntervals: [0, 1000, 3000, 5000, 10000, 30000]
};
