import { useEffect, useState } from "react";

/**
 * Custom hook to detect device type and OS
 * Returns:
 *  - isMobile: boolean
 *  - deviceOS: "Android" | "iOS" | "Windows" | "MacOS" | "Linux" | "Unknown"
 */
const useDeviceDetector = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [deviceOS, setDeviceOS] = useState("Unknown");

    useEffect(() => {
        const userAgent = navigator.userAgent;
        const ua = userAgent.toLowerCase();

        const mobileRegex =
            /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
        setIsMobile(mobileRegex.test(userAgent));

        if (/android/i.test(ua)) {
            setDeviceOS("ANDROID");
        } else if (/iphone|ipad|ipod/i.test(ua)) {
            setDeviceOS("IOS");
        } else {
            setDeviceOS("Unknown");
        }
    }, []);

    return { isMobile, deviceOS };
};

export default useDeviceDetector;