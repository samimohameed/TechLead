import * as signalR from '@microsoft/signalr';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { PriceUpdatedDto } from '../../dtos/realtime/price-updated.dto';
import { OrderUpdatedDto } from '../../dtos/realtime/order-updated.dto';
import { PortfolioUpdatedDto } from '../../dtos/realtime/portfolio-updated.dto';
import { ConnectionState } from '../../dtos/realtime/connection-state.type';
import { environment } from '../../../environments/environment';

export class RealtimeService {
  private hubConnection: signalR.HubConnection | null = null;
  private readonly hubUrl: string;
  private startPromise: Promise<void> | null = null;
  private isStopping: boolean = false;

  private readonly priceSubject = new Subject<PriceUpdatedDto>();
  private readonly orderSubject = new Subject<OrderUpdatedDto>();
  private readonly portfolioSubject = new Subject<PortfolioUpdatedDto>();
  private readonly connectionStateSubject = new BehaviorSubject<ConnectionState>('Disconnected');
  private readonly reconnectedSubject = new Subject<void>();

  public readonly price$: Observable<PriceUpdatedDto> = this.priceSubject.asObservable();
  public readonly order$: Observable<OrderUpdatedDto> = this.orderSubject.asObservable();
  public readonly portfolio$: Observable<PortfolioUpdatedDto> = this.portfolioSubject.asObservable();
  public readonly connectionState$: Observable<ConnectionState> = this.connectionStateSubject.asObservable();
  public readonly reconnected$: Observable<void> = this.reconnectedSubject.asObservable();

  constructor(hubUrl: string = environment.signalRHubUrl) {
    this.hubUrl = hubUrl;
  }

  private retryTimer: any = null;

  private buildConnection(): signalR.HubConnection {
    if (this.hubConnection) {
      try {
        this.hubConnection.stop();
      } catch {
        // Handled
      }
      this.hubConnection = null;
    }

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect(environment.reconnectIntervals)
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    conn.on('PriceUpdated', (data: PriceUpdatedDto) => {
      this.priceSubject.next(data);
    });

    conn.on('OrderUpdated', (data: OrderUpdatedDto) => {
      this.orderSubject.next(data);
    });

    conn.on('PortfolioUpdated', (data: PortfolioUpdatedDto) => {
      this.portfolioSubject.next(data);
    });

    conn.onreconnecting(() => {
      this.connectionStateSubject.next('Reconnecting');
    });

    conn.onreconnected(() => {
      this.connectionStateSubject.next('Connected');
      this.reconnectedSubject.next();
    });

    conn.onclose(() => {
      this.connectionStateSubject.next('Disconnected');
      this.scheduleAutoRetry();
    });

    this.hubConnection = conn;
    return conn;
  }

  private scheduleAutoRetry(): void {
    if (this.isStopping || this.retryTimer) {
      return;
    }

    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (!this.isStopping && this.hubConnection?.state !== signalR.HubConnectionState.Connected) {
        this.connect().catch(() => {});
      }
    }, 2000);
  }

  public async connect(): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.connectionStateSubject.next('Connected');
      return;
    }

    if (this.startPromise) {
      return this.startPromise;
    }

    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }

    this.isStopping = false;
    this.connectionStateSubject.next('Connecting');

    this.startPromise = (async () => {
      try {
        if (!this.hubConnection || this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
          this.buildConnection();
        }

        const conn = this.hubConnection;
        if (!conn) {
          return;
        }

        if (conn.state === signalR.HubConnectionState.Disconnected) {
          await conn.start();
        }

        if (this.isStopping) {
          await conn.stop();
          this.connectionStateSubject.next('Disconnected');
        } else {
          this.connectionStateSubject.next('Connected');
        }
      } catch (err: any) {
        this.connectionStateSubject.next('Disconnected');
        if (!this.isStopping) {
          this.scheduleAutoRetry();
        }
      } finally {
        this.startPromise = null;
      }
    })();

    return this.startPromise;
  }

  public async disconnect(): Promise<void> {
    this.isStopping = true;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }

    if (this.startPromise) {
      try {
        await this.startPromise;
      } catch {
        // Handled
      }
    }

    if (this.hubConnection && this.hubConnection.state !== signalR.HubConnectionState.Disconnected) {
      try {
        await this.hubConnection.stop();
      } catch {
        // Handled
      }
    }
    this.connectionStateSubject.next('Disconnected');
  }
}

export const realtimeService = new RealtimeService();
