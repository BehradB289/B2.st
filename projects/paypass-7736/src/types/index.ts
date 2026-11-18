export type ContentType = "prompt" | "link" | "text" | "secret_key";

export interface Item {
  id: string;
  slug: string;
  title: string;
  description?: string;
  contentType: ContentType;
  encryptedContent: string; // AES-256-GCM encrypted (iv:authTag:cipher)
  price: number; // In Tomans (or base currency units)
  creatorSheba: string;
  platformFeePercent: number; // Fixed 5%
  creatorNetShare: number; // 95%
  viewsCount: number;
  purchasesCount: number;
  createdAt: string;
}

export interface ItemPublicView {
  id: string;
  slug: string;
  title: string;
  description?: string;
  contentType: ContentType;
  price: number;
  createdAt: string;
}

export type OrderStatus = "pending" | "paid" | "failed";

export interface Order {
  id: string;
  itemId: string;
  amount: number;
  feeAmount: number;
  sellerAmount: number;
  buyerIdentifier?: string; // Optional email/phone
  status: OrderStatus;
  paymentRefId?: string;
  paidAt?: string;
  createdAt: string;
}

export interface CreateItemInput {
  title: string;
  description?: string;
  contentType: ContentType;
  rawContent: string;
  price: number;
  creatorSheba: string;
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DecryptedPayload {
  unlockedContent: string;
  contentType: ContentType;
  title: string;
  refId: string;
  paidAt: string;
}