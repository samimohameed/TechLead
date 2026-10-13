import { Observable } from 'rxjs';
import { Result } from '../../dtos/common/result.dto';
import { environment } from '../../../environments/environment';

export class HttpService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = environment.apiUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  public request<T>(endpoint: string, options: RequestInit = {}): Observable<T> {
    return new Observable<T>(subscriber => {
      const controller = new AbortController();
      const signal = controller.signal;

      const url = `${this.baseUrl}${endpoint}`;
      const headers = new Headers(options.headers || {});

      if (!headers.has('Content-Type') && options.body) {
        headers.set('Content-Type', 'application/json');
      }

      fetch(url, {
        ...options,
        signal,
        headers
      })
        .then(async response => {
          let json: Result<T> | null = null;
          const text = await response.text();
          if (text) {
            try {
              json = JSON.parse(text) as Result<T>;
            } catch {
              // Non-JSON response
            }
          }

          if (!response.ok || !json || !json.isSuccess) {
            const message =
              json?.message ||
              (response.status === 404
                ? 'Resource not found'
                : `Request failed with status ${response.status}`);
            const err = new Error(message);
            (err as any).status = response.status;
            (err as any).errorCode = json?.errorCode;
            (err as any).errors = json?.errors;
            subscriber.error(err);
            return;
          }

          subscriber.next(json.data as T);
          subscriber.complete();
        })
        .catch(err => {
          if (err.name !== 'AbortError') {
            subscriber.error(err);
          }
        });

      return () => {
        controller.abort();
      };
    });
  }

  public get<T>(endpoint: string, options?: RequestInit): Observable<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestInit): Observable<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  }

  public put<T>(endpoint: string, body?: unknown, options?: RequestInit): Observable<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  }

  public delete<T>(endpoint: string, options?: RequestInit): Observable<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const httpService = new HttpService();
