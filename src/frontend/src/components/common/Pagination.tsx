import React from 'react';
import { AppPagination } from '../shared/AppPagination';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

/**
 * Legacy Pagination component forwarder.
 * Delegates directly to the canonical AppPagination component to ensure
 * theme parity, dark mode support, and TypeUI neumorphic styling across all views.
 */
export const Pagination: React.FC<PaginationProps> = (props) => {
  return <AppPagination {...props} />;
};
