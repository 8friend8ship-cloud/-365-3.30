export interface WebAppStatus {
  name: string;
  deploymentId: string;
  url: string;
  lastCalledUrl: string;
  lastCalledTime: string;
  isSuccess: boolean;
  itemCount: number;
  itemIds: string[];
}

export interface PrimaryContentResponse {
  success: boolean;
  type: string;
  dayKey: string;
  items: any[];
}

export interface AudioDeliveryResponse {
  success: boolean;
  type: string;
  dayKey: string;
  payload: {
    items: any[];
  };
}
