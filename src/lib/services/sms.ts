import qs from "querystring";

const SMS_BASE_URL = process.env.SMS_BASE_URL || "http://136.243.171.112/api/sendhttp.php";
const SMS_AUTH_KEY = process.env.SMS_AUTH_KEY || "31314347504534343910";
const SMS_SENDER = process.env.SMS_SENDER || "CGPEYI";
const SMS_DLT_TE_ID = process.env.SMS_DLT_TE_ID || "1707175577032776741";

if (!SMS_AUTH_KEY || !SMS_SENDER || !SMS_DLT_TE_ID) {
    console.warn(
        "[SMS] Missing SMS env vars. Set SMS_AUTH_KEY, SMS_SENDER, SMS_DLT_TE_ID"
    );
}

/**
 * Build final message text. You can modify template as per DLT content.
 */
function buildOtpMessage(otp: string) {
    return `Your OTP to login is ${otp} Valid for 5 mins. Do not share this with anyone.CGPEY International Pvt. Ltd.`;
}

/**
 * Sends OTP SMS via HTTP gateway (Laravel style).
 */
export async function sendLoginOtpSms(phone: string, otp: string) {
    if (!SMS_AUTH_KEY || !SMS_SENDER || !SMS_DLT_TE_ID) {
        console.warn("[SMS] Skipping SMS send due to missing config");
        return;
    }

    const parsedPhone = phone.replace(/[^0-9]/g, "");

    const mobileNumber = parsedPhone.startsWith("91") ? phone : `91${phone}`;
    const message = buildOtpMessage(otp);

    const query = qs.stringify({
        authkey: SMS_AUTH_KEY,
        mobiles: mobileNumber,
        message,
        country: 91,
        sender: SMS_SENDER,
        route: "2",
        DLT_TE_ID: SMS_DLT_TE_ID,
    });

    const url = `${SMS_BASE_URL}?${query}`;

    try {
        const res = await fetch(url, {
            method: "GET",
        });

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            console.error(
                `[SMS] HTTP error: ${res.status} - ${res.statusText}. Body: ${text}`
            );
        }
    } catch (err) {
        console.error("[SMS] Failed to send SMS:", err);
        // You can decide whether to throw or silently continue
    }
}