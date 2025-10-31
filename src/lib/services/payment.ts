import { env } from "../env";
import ApiClient from "../client";

export async function initiatePayment(payload: any) {
  const url = `${env.PG_SERVICE_BASE_URL}/api/payments`;
  return ApiClient.raw().post(url, payload);
}

export async function verifyVPA(payload: any) {
  const url = `${env.PG_SERVICE_BASE_URL}/api/payments/verify-vpa`;
  return ApiClient.raw().post(url, payload);
}

export async function verifyPaymentStatus(payload: any) {
  const url = `${env.PG_SERVICE_BASE_URL}/api/payments/verify`;
  return ApiClient.raw().post(url, payload);
}

export async function initiateRefund(payload: { orderId: string, gateway: string, amount: number, refundId: string }) {
  const url = `${env.PG_SERVICE_BASE_URL}/api/payments/refund`;
  return ApiClient.raw().post(url, payload);
}

export async function checkRefundStatus(payload: { refundId: string, gateway: string }) {
  const url = `${env.PG_SERVICE_BASE_URL}/api/payments/refund-status`;
  return ApiClient.raw().post(url, payload);
}