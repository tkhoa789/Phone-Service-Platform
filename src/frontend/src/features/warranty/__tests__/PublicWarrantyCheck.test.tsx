import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PublicWarrantyCheckPage } from '../../../pages/public/PublicWarrantyCheckPage';
import { serviceService } from '../../../services/serviceService';

vi.mock('../../../services/serviceService', () => ({
  serviceService: {
    checkWarrantyStatus: vi.fn(),
  },
}));

vi.mock('../../../stores/themeStore', () => ({
  useThemeStore: () => ({
    language: 'vi',
  }),
}));

describe('Public Warranty Check Page (BUG-10 Regression)', () => {
  it('renders lookup input and submit button', () => {
    render(
      <MemoryRouter>
        <PublicWarrantyCheckPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tra cứu/i })).toBeInTheDocument();
  });

  it('displays active warranty details and masked customer name upon successful lookup', async () => {
    vi.mocked(serviceService.checkWarrantyStatus).mockResolvedValueOnce({
      imei: '860123455442088',
      productName: 'Galaxy S24 Ultra Master',
      warrantyStatus: 'Active',
      isUnderWarranty: true,
      remainingDays: 365,
      customerName: 'Khách *** định',
      warrantyExpirationDate: '2027-09-04T00:00:00Z',
    } as any);

    render(
      <MemoryRouter>
        <PublicWarrantyCheckPage />
      </MemoryRouter>
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '860123455442088' } });

    const submitBtn = screen.getByRole('button', { name: /Tra cứu/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Galaxy S24 Ultra Master')).toBeInTheDocument();
    });

    // Verify masked customer name
    expect(screen.getByText(/Khách \*\*\* định/)).toBeInTheDocument();

    // Verify NO internal customer phone or customer ID leaked
    expect(screen.queryByText(/0901234567/)).not.toBeInTheDocument();
    expect(screen.queryByText(/customerId/i)).not.toBeInTheDocument();

    // Verify NO fake AppleCare fallback exists
    expect(screen.queryByText(/AppleCare\+/i)).not.toBeInTheDocument();
  });

  it('displays error message when device is not found or expired', async () => {
    vi.mocked(serviceService.checkWarrantyStatus).mockResolvedValueOnce({
      imei: '860999999999999',
      productName: 'Không tìm thấy thông tin sản phẩm',
      warrantyStatus: 'NotFound',
      isUnderWarranty: false,
      remainingDays: 0,
    } as any);

    render(
      <MemoryRouter>
        <PublicWarrantyCheckPage />
      </MemoryRouter>
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '860999999999999' } });

    const submitBtn = screen.getByRole('button', { name: /Tra cứu/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Không tìm thấy bản ghi bán hàng/i)).toBeInTheDocument();
    });
  });
});
