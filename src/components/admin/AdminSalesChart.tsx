import { useState, useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { type OrderDoc } from "@/lib/firebase";

const MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
const WEEKDAYS = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];

export function AdminSalesChart({ orders = [] }: { orders: OrderDoc[] }) {
  const [period, setPeriod] = useState<7 | 14 | 30>(7);
  const [activeMetric, setActiveMetric] = useState<"revenue" | "count">("revenue");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price || 0);
  };

  // Group daily sales data for the selected period
  const chartData = useMemo(() => {
    const days = [];
    const now = new Date();

    for (let i = period - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const pad = (n: number) => String(n).padStart(2, "0");
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

      const dayNum = d.getDate();
      const monthIdx = d.getMonth();
      const weekIdx = d.getDay();

      const monthName = MONTHS[monthIdx] || "";
      const weekdayShort = WEEKDAYS[weekIdx] || "";

      days.push({
        dateKey: dateStr,
        label: period <= 7 ? `${dayNum}-${monthName}, ${weekdayShort}` : `${dayNum} ${monthName}`,
        dayNum,
        monthName,
        weekdayShort,
        revenue: 0,
        count: 0,
      });
    }

    // Map through non-cancelled orders
    orders.forEach((order) => {
      if (order.status === "cancelled" || !order.createdAt) return;
      const orderDate = order.createdAt.slice(0, 10);
      const targetDay = days.find((d) => d.dateKey === orderDate);
      if (targetDay) {
        targetDay.revenue += Number(order.total) || 0;
        targetDay.count += 1;
      }
    });

    return days;
  }, [orders, period]);

  // Aggregate Stats
  const totalRevenue = useMemo(
    () => chartData.reduce((acc, d) => acc + d.revenue, 0),
    [chartData],
  );
  const totalOrders = useMemo(
    () => chartData.reduce((acc, d) => acc + d.count, 0),
    [chartData],
  );
  const dailyAverage = useMemo(
    () => Math.round(totalRevenue / (period || 1)),
    [totalRevenue, period],
  );
  const averageCheck = useMemo(
    () => (totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0),
    [totalRevenue, totalOrders],
  );

  const peakDay = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData.reduce(
      (max, d) => (d.revenue > (max?.revenue || 0) ? d : max),
      chartData[0],
    );
  }, [chartData]);

  const maxVal = useMemo(() => {
    if (activeMetric === "revenue") {
      const max = Math.max(...chartData.map((d) => d.revenue), 100000);
      return max * 1.35;
    } else {
      const max = Math.max(...chartData.map((d) => d.count), 5);
      return max * 1.35;
    }
  }, [chartData, activeMetric]);

  return (
    <div className="bg-white border border-gray-150 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-4 sm:space-y-5 select-none animate-in fade-in duration-300">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3.5 sm:pb-4">
        <div className="text-left space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FFF0F1] text-[#CC1122] flex items-center justify-center border border-[#FFE4E6] shadow-2xs shrink-0">
              <BarChart3 className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h3 className="font-black text-gray-900 text-sm sm:text-base tracking-tight">
              Savdo Dinamikasi & Tushum Grafigi
            </h3>
          </div>
          <p className="text-[11px] text-gray-400 font-medium">
            Fast-food buyurtmalarining kunlik tahlili va ko'rsatkichlari
          </p>
        </div>

        {/* Filters: Metric Switcher + Period Switcher */}
        <div className="flex items-center justify-between sm:justify-end flex-wrap gap-2 pt-1 sm:pt-0">
          {/* Metric Selector */}
          <div className="bg-gray-100/80 p-0.5 sm:p-1 rounded-2xl flex items-center gap-1 border border-gray-200/60">
            <button
              type="button"
              onClick={() => setActiveMetric("revenue")}
              className={`px-2.5 sm:px-3 py-1 text-[11px] font-black rounded-xl transition-all cursor-pointer ${
                activeMetric === "revenue"
                  ? "bg-white text-[#CC1122] shadow-2xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Tushum (UZS)
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric("count")}
              className={`px-2.5 sm:px-3 py-1 text-[11px] font-black rounded-xl transition-all cursor-pointer ${
                activeMetric === "count"
                  ? "bg-white text-[#CC1122] shadow-2xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Buyurtmalar (ta)
            </button>
          </div>

          {/* Period Selector */}
          <div className="bg-gray-100/80 p-0.5 sm:p-1 rounded-2xl flex items-center gap-1 border border-gray-200/60">
            {[7, 14, 30].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p as 7 | 14 | 30)}
                className={`px-2.5 py-1 text-[11px] font-black rounded-xl transition-all cursor-pointer ${
                  period === p
                    ? "bg-[#CC1122] text-white shadow-sm shadow-[#CC1122]/20"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {p} kun
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-KPI Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3 bg-gray-50/70 rounded-2xl border border-gray-150">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
            Davr bo'yicha jami
          </span>
          <span className="text-sm sm:text-base font-black text-gray-900 block mt-0.5 truncate">
            {formatPrice(totalRevenue)} UZS
          </span>
        </div>

        <div className="p-3 bg-gray-50/70 rounded-2xl border border-gray-150">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
            Kunlik o'rtacha
          </span>
          <span className="text-sm sm:text-base font-black text-gray-900 block mt-0.5 truncate">
            {formatPrice(dailyAverage)} UZS
          </span>
        </div>

        <div className="p-3 bg-gray-50/70 rounded-2xl border border-gray-150">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
            Eng yuqori kun
          </span>
          <span className="text-sm sm:text-base font-black text-[#CC1122] block mt-0.5 truncate">
            {peakDay ? `${formatPrice(peakDay.revenue)} UZS` : "0 UZS"}
          </span>
        </div>

        <div className="p-3 bg-gray-50/70 rounded-2xl border border-gray-150">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
            O'rtacha chek (AOV)
          </span>
          <span className="text-sm sm:text-base font-black text-gray-900 block mt-0.5 truncate">
            {formatPrice(averageCheck)} UZS
          </span>
        </div>
      </div>

      {/* Interactive Chart Container */}
      <div className="h-56 sm:h-64 w-full pt-4 pb-2 flex items-end gap-1.5 sm:gap-2.5 border-b border-gray-100">
        {chartData.map((d, idx) => {
          const val = activeMetric === "revenue" ? d.revenue : d.count;
          const heightPercent = Math.max(8, Math.min(100, Math.round((val / (maxVal || 1)) * 100)));
          const isHovered = hoveredIndex === idx;

          return (
            <div
              key={d.dateKey}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
            >
              {/* Tooltip Popup on Hover */}
              {isHovered && (
                <div className="absolute -top-12 z-20 bg-gray-900 text-white text-[10px] font-extrabold px-2.5 py-1.5 rounded-xl shadow-xl whitespace-nowrap pointer-events-none transform -translate-x-1/2 left-1/2">
                  <div className="text-[9px] text-gray-300">{d.label}</div>
                  <div className="text-[#ff4d5e]">
                    {activeMetric === "revenue" ? `${formatPrice(d.revenue)} UZS` : `${d.count} ta buyurtma`}
                  </div>
                </div>
              )}

              {/* Chart Bar */}
              <div
                style={{ height: `${heightPercent}%` }}
                className={`w-full max-w-[36px] rounded-t-xl transition-all duration-300 ${
                  isHovered
                    ? "bg-[#CC1122] shadow-md shadow-[#CC1122]/30 scale-105"
                    : val > 0
                      ? "bg-gradient-to-t from-[#CC1122]/70 to-[#CC1122] hover:bg-[#CC1122]"
                      : "bg-gray-100 hover:bg-gray-200"
                }`}
              />

              {/* Date Axis Label */}
              <span className="text-[10px] font-bold text-gray-400 mt-2 truncate w-full text-center">
                {d.dayNum}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

