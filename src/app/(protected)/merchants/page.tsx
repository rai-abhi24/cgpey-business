import MerchantList from "./_components/merchant-list";
import HeaderSetter from "@/components/common/header-setter";

export default function MerchantsPage() {
    return (
        <div className="space-y-4">
            <HeaderSetter
                title="Merchants"
                desc="Onboard, manage & impersonate merchants"
            />
            <MerchantList />
        </div>
    );
}