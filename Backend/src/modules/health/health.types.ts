export interface HealthCheckData {
  status: 'ok';
  checks: {
    database: 'up';
  };
  timestamp: string;
}
