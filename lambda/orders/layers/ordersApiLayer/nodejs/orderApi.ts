export enum PaymentType {
  CASH = 'CASH',
  DEBIT_CARD = 'DEBIT_CARD',
  CREDIT_CARD = 'CREDIT_CARD', 
}

export enum ShippingType {
  ECONOMIC = 'ECONOMIC',
  URGENTE = 'URGENTE',
}

export enum CarrierType {
  CORREIOS = 'CORREREIOS',
  FEDEX = 'FEDEX'
}

export interface OrderRequest {
  email: string
  productsIds: string[]
  payment: PaymentType
  shipping: {
    type: ShippingType,
    carrier: CarrierType
  }
}

export interface OrderProduct {
  code: string
  price: number
}

export interface OrderResponse {
  email: string,
  id: string,
  createdAt: number,
  billing: {
    payment: PaymentType,
    totalPrince: number
  },
  shipping: {
    type: ShippingType,
    carrier: CarrierType
  },
  products: OrderProduct[]
}