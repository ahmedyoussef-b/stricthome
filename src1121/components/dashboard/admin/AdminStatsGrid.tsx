// src/components/dashboard/admin/AdminStatsGrid.tsx
import UserCard from "@/components/UserCard";
import CountChartContainer from "@/components/CountChartContainer";
import AttendanceChartContainer from "@/components/AttendanceChartContainer";
import FinanceChart from "@/components/FinanceChart";
import { Role as AppRole } from "@/types";
import AdminActionCards from "./AdminActionCards";

const AdminStatsGrid = () => {
    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <AdminActionCards />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <UserCard type={AppRole.ADMIN} bgColorClass="bg-sky-500" />
                <UserCard type={AppRole.TEACHER} bgColorClass="bg-teal-500" />
                <UserCard type={AppRole.STUDENT} bgColorClass="bg-amber-700" />
                <UserCard type={AppRole.PARENT} bgColorClass="bg-purple-500" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-1 h-[450px]">
                    <CountChartContainer />
                </div>
                <div className="xl:col-span-2 h-[450px]">
                    <AttendanceChartContainer />
                </div>
            </div>

            <div className="h-[500px]">
                <FinanceChart />
            </div>
        </div>
    );
};

export default AdminStatsGrid;
