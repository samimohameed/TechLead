import * as signalR from '@microsoft/signalr';
import { PriceUpdated, OrderUpdated, PortfolioUpdated, ConnectionState } from './types';

export class SignalRClient {
  private hubConnection: signalR.HubConnection | null = null;
  private url: string;
  private onConnectionStateChange?: (state: ConnectionState) => void;
  private onReconnectedCallback?: () => void;

  constructor(url: string) {
    this.url = url;
  }

  public setCallbacks(
    onStateChange: (state: ConnectionState) => void,
    onReconnected?: () => void
  ) {
    this.onConnectionStateChange = onStateChange;
    this.onReconnectedCallback = onReconnected;
  }

  public async start(
    onPrice: (e: PriceUpdated) => void,
    onOrder: (e: OrderUpdated) => void,
    onPortfolio: (e: PortfolioUpdated) => void
  ): Promise<void> {
    if (this.hubConnection) {
      return;
    }

    this.onConnectionStateChange?.('Connecting');

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.url, {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect([0, 1000, 3000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Register typed handlers
    this.hubConnection.on('PriceUpdated', onPrice);
    this.hubConnection.on('OrderUpdated', onOrder);
    this.hubConnection.on('PortfolioUpdated', onPortfolio);

    this.hubConnection.onreconnecting(() => {
      this.onConnectionStateChange?.('Reconnecting');
    });

    this.hubConnection.onreconnected(() => {
      this.onConnectionStateChange?.('Connected');
      // Per requirements: After reconnecting, refresh the relevant snapshots
      this.onReconnectedCallback?.();
    });

    this.hubConnection.onclose(() => {
      this.onConnectionStateChange?.('Disconnected');
    });

    try {
      await this.hubConnection.start();
      this.onConnectionStateChange?.('Connected');
    } catch (err) {
      console.warn('Initial SignalR connection failed, will retry...', err);
      this.onConnectionStateChange?.('Disconnected');
    }
  }

  public async stop(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = null;
      this.onConnectionStateChange?.('Disconnected');
    }
  }
}
