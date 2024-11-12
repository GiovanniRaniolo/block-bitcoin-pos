export interface CreateUserBody {
  email: string;
}

export interface LoginUserBody {
  email: string;
  password: string;
}

export interface EditUserBody {
  email: string;
  xpub: string;
  username?: string;
  basePath?: string;
  slippage?: number;
  currency?: string;
  onlyConfirmed?: boolean;
  metadata?: object;
}

export interface CreateRequestBody {
  chain: AllowedChains;
  network: AllowedNetworks;
  amount: number;
}

export enum AllowedChains {
  BITCOIN = "bitcoin",
}

export enum AllowedNetworks {
  MAINNET = "mainnet",
  TESTNET = "testnet",
}

export enum RequestStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  PARTIAL = "partial",
  EXPIRED = "expired",
}

export const validateChain = (chain: string): boolean => {
  return Object.values(AllowedChains).includes(chain as AllowedChains);
};

export const validateNetwork = (network: string): boolean => {
  return Object.values(AllowedNetworks).includes(network as AllowedNetworks);
};