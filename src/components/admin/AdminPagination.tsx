export interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function AdminPagination({
  currentPage,
  totalPages,
  onPageChange,
}: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  const maxVisiblePages = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  const end = Math.min(totalPages, start + maxVisiblePages - 1);

  if (end - start + 1 < maxVisiblePages) {
    start = Math.max(1, end - maxVisiblePages + 1);
  }

  const pages: number[] = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="py-2.5 px-3.5 flex items-center justify-center gap-1.5 select-none animate-fadeIn bg-white border border-gray-150 rounded-lg shadow-2xs">
      {/* Previous Page Link */}
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="inline-flex items-center justify-center w-7 h-7 rounded-md border text-xs font-bold bg-white text-gray-700 border-gray-200 hover:bg-gray-50 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
      >
        &laquo;
      </button>

      {/* Page Numbers Links */}
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md border text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
            currentPage === p
              ? "bg-[#F97316] text-white border-[#F97316] shadow-sm shadow-[#F97316]/20 font-black"
              : "bg-white text-gray-700 border-gray-200 hover:bg-[#FFF7ED] hover:text-[#F97316]"
          }`}
        >
          {p}
        </button>
      ))}

      {/* Next Page Link */}
      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="inline-flex items-center justify-center w-7 h-7 rounded-md border text-xs font-bold bg-white text-gray-700 border-gray-200 hover:bg-gray-50 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
      >
        &raquo;
      </button>
    </div>
  );
}
