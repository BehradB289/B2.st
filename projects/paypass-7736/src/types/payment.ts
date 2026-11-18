import { ItemContentType, OrderStatus } from './database';

export interface CreatePaymentSessionInput {
  itemId: string;
  buyerEmail?: string;
  buyerPhone?: string;
}

export interface CreatePaymentSessionResult {
  success: boolean;
  paymentUrl?: string;
  authority?: string;
  orderId?: string;
  error?: string;
}

export interface VerifyPaymentResult {
  success: boolean;
  message: string;
  orderId?: string;
  refId?: string;
  item?: {
    id: string;
    title: string;
    contentType: ItemContentType;
    unlockedContent: string;
  };
  error?: string;
  statusCode?: number;
}

export interface GatewayRequestResponse {
  authority: string;
  paymentUrl: string;
  fee: number;
}

export interface GatewayVerifyResponse {
  isSuccess: boolean;
  refId?: string;
  cardPan?: string;
  code: number;
  message: string;
}