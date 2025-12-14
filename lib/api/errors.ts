import { NextResponse } from "next/server";

/**
 * APIエラーコード
 */
export enum ApiErrorCode {
	INVALID_REQUEST = "INVALID_REQUEST",
	UNAUTHORIZED = "UNAUTHORIZED",
	FORBIDDEN = "FORBIDDEN",
	NOT_FOUND = "NOT_FOUND",
	ALREADY_EXISTS = "ALREADY_EXISTS",
	INSUFFICIENT_POINTS = "INSUFFICIENT_POINTS",
	RACE_CLOSED = "RACE_CLOSED",
	DAILY_BONUS_CLAIMED = "DAILY_BONUS_CLAIMED",
	INVALID_NFC_CARD = "INVALID_NFC_CARD",
	SERVER_ERROR = "SERVER_ERROR",
}

/**
 * APIエラーレスポンス
 */
export interface ApiErrorResponse {
	success: false;
	error: string;
	code: ApiErrorCode;
	details?: Record<string, unknown>;
}

/**
 * API成功レスポンス
 */
export interface ApiSuccessResponse<T = unknown> {
	success: true;
	[key: string]: T | boolean | string | number;
}

/**
 * エラーレスポンスを生成
 */
export function createErrorResponse(
	message: string,
	code: ApiErrorCode,
	status: number = 400,
	details?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
	return NextResponse.json(
		{
			success: false,
			error: message,
			code,
			details,
		},
		{ status }
	);
}

/**
 * 成功レスポンスを生成
 */
export function createSuccessResponse<T>(
	data: T,
	status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
	return NextResponse.json(
		{
			success: true,
			...data,
		} as ApiSuccessResponse<T>,
		{ status }
	);
}

/**
 * 400 Bad Request
 */
export function badRequest(message: string, details?: Record<string, unknown>) {
	return createErrorResponse(
		message,
		ApiErrorCode.INVALID_REQUEST,
		400,
		details
	);
}

/**
 * 401 Unauthorized
 */
export function unauthorized(message: string = "認証が必要です") {
	return createErrorResponse(message, ApiErrorCode.UNAUTHORIZED, 401);
}

/**
 * 403 Forbidden
 */
export function forbidden(message: string = "アクセス権限がありません") {
	return createErrorResponse(message, ApiErrorCode.FORBIDDEN, 403);
}

/**
 * 404 Not Found
 */
export function notFound(message: string) {
	return createErrorResponse(message, ApiErrorCode.NOT_FOUND, 404);
}

/**
 * 409 Conflict
 */
export function conflict(message: string, details?: Record<string, unknown>) {
	return createErrorResponse(
		message,
		ApiErrorCode.ALREADY_EXISTS,
		409,
		details
	);
}

/**
 * 500 Internal Server Error
 */
export function serverError(message: string = "サーバーエラーが発生しました") {
	return createErrorResponse(message, ApiErrorCode.SERVER_ERROR, 500);
}

