import { AxiosResponse } from "axios";
import ApiClient from "../client";
// const PG_SERVICE_BASE_URL = "http://192.168.1.8:4000";
const PG_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_PG_SERVICE_BASE_URL || "https://pay.cgpey.com";

export async function initiatePayment(payload: any) {
  const url = `${PG_SERVICE_BASE_URL}/api/payments`;
  return ApiClient.raw().post(url, payload);
}

export async function verifyVPA(payload: any) {
  const url = `${PG_SERVICE_BASE_URL}/api/payments/verify-vpa`;
  return ApiClient.raw().post(url, payload);
}

export async function verifyPaymentStatus(payload: any) {
  const url = `${PG_SERVICE_BASE_URL}/api/payments/verify`;
  return ApiClient.raw().post(url, payload);
}

export async function initiateRefund(payload: { orderId: string, gateway: string, amount: number, refundId: string }) {
  const url = `${PG_SERVICE_BASE_URL}/api/payments/refund`;
  return ApiClient.raw().post(url, payload);
}

export async function checkRefundStatus(payload: { refundId: string, gateway: string }) {
  const url = `${PG_SERVICE_BASE_URL}/api/payments/refund-status`;
  return ApiClient.raw().post(url, payload);
}

export const fetchPaymentDetails = async (paymentId: string): Promise<AxiosResponse> => {
  if (!paymentId) {
    throw new Error('Payment ID is required');
  }

  // Validate paymentId format client-side
  if (!/^pay_\d+_[a-f0-9]{12}$/.test(paymentId)) {
    throw new Error('Invalid payment ID format');
  }

  try {
    const response = await ApiClient.raw().get(`${PG_SERVICE_BASE_URL}/api/checkout/${paymentId}`);
    return response;
  } catch (error: any) {
    // Re-throw with user-friendly message
    if (error.response?.status === 404) {
      throw new Error('Payment not found');
    } else if (error.response?.status === 410) {
      throw new Error('Payment link has expired');
    } else if (error.response?.status === 403) {
      throw new Error('This merchant is currently not accepting payments');
    }
    throw error;
  }
};