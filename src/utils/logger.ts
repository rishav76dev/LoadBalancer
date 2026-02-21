export class Logger {
  static request(method: string, path: string, backendUrl: string): void {
    console.log(`REQUEST: ${method} ${path} -> ${backendUrl}`);
  }

  static response(method: string, path: string, backendUrl: string, statusCode: number, duration: number): void {
    console.log(`RESPONSE: ${method} ${path} <- ${backendUrl} [${statusCode}] ${duration}ms`);
  }

  static error(message: string, backendUrl?: string): void {
    const backend = backendUrl ? ` (${backendUrl})` : '';
    console.error(`ERROR: ${message}${backend}`);
  }

  static info(message: string): void {
    console.log(`INFO: ${message}`);
  }

  static health(url: string, isHealthy: boolean, details?: string): void {
    const status = isHealthy ? 'HEALTHY' : 'UNHEALTHY';
    const extraInfo = details ? ` - ${details}` : '';
    console.log(`HEALTH: ${status} ${url}${extraInfo}`);
  }
}
