import TransactionsList from "./_components/transaction-list";
import HeaderSetter from "@/components/common/header-setter";

export default function page() {
    return (
        <div>
            <HeaderSetter title="Transactions" desc="Review and track transactions" />
            <TransactionsList />
        </div>
    )
}