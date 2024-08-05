import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex justify-center py-4">
      <nav>
        <ul className="flex list-none">
          {pageNumbers.map((page) => (
            <li key={page} className={`mx-1 ${page === currentPage ? 'font-bold' : ''}`}>
              <button
                onClick={() => onPageChange(page)}
                className="px-3 py-1 border rounded-md hover:bg-gray-200"
              >
                {page}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Pagination;
