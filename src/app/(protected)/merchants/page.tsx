import MerchantList from "./_components/merchant-list";
import HeaderSetter from "@/components/common/header-setter";

export default function page() {
    return (
        <div>
            <HeaderSetter title="Merchants" desc="Manage all merchants" />
            <MerchantList />
        </div >
    )
}