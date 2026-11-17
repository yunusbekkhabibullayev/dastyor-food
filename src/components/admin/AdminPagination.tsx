export interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function AdminPagination({ currentPage, totalPages, onPageChange }: AdminPaginationProps) {
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
    <div className="py-4 px-4 border-t border-gray-150 flex items-center justify-center gap-1.5 select-none animate-fadeIn bg-white rounded-2xl">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="inline-flex items-center justify-center w-9 h-9 rounded-xl border text-sm font-bold bg-white text-gray-700 border-gray-200 hover:bg-gray-50 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
        aria-label="Oldingi sahifa"
      >
        &laquo;
      </button>

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          className={`inline-flex items-center justify-center min-w-[36px] h-9 px-3 rounded-xl border text-xs font-black transition-all active:scale-95 cursor-pointer ${
            currentPage === p
              ? "bg-[#CC1122] text-white border-[#CC1122] shadow-xs"
              : "bg-white text-gray-700 border-gray-200 hover:bg-[#FFF0F1] hover:text-[#CC1122]"
          }`}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="inline-flex items-center justify-center w-9 h-9 rounded-xl border text-sm font-bold bg-white text-gray-700 border-gray-200 hover:bg-gray-50 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
        aria-label="Keyingi sahifa"
      >
        &raquo;
      </button>
    </div>
  );
}
