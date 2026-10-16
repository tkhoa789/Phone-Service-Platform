namespace PSP.Application.Modules.Product.DTOs;

public class SupplierDebtTransactionDto
{
    public Guid Id { get; set; }
    public Guid SupplierId { get; set; }
    public string TransactionType { get; set; } = "PAYMENT"; // INVOICE, PAYMENT, DEBIT_NOTE
    public decimal Amount { get; set; }
    public decimal BalanceAfter { get; set; }
    public string ReferenceNo { get; set; } = string.Empty;
    public string? PaymentMethod { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
}
