export class AggregateFilterDto {
  /** Danh sách PO IDs cần tổng hợp (bỏ qua nếu không truyền = lấy tất cả) */
  poIds?: string[];

  /** Danh sách PO_Line IDs (sản phẩm) cần tổng hợp */
  lineIds?: string[];

  /** Lọc BOM từ ngày (theo bom.createdAt) — ISO date string */
  dateFrom?: string;

  /** Lọc BOM đến ngày (theo bom.createdAt) — ISO date string */
  dateTo?: string;

  /**
   * Lọc theo status BOM.
   * Mặc định: ['Approved', 'Locked']
   */
  statuses?: string[];
}
