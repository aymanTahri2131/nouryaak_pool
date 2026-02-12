// ============================================
// Aronium SQLite Database Types
// Based on pos.db schema
// ============================================

// Aronium Product table
export interface AroniumProduct {
  Id: number;
  ProductGroupId: number | null;
  Name: string;
  Code: string | null;
  PLU: number | null;
  MeasurementUnit: string | null;
  Price: number;
  IsTaxInclusivePrice: number;
  CurrencyId: number | null;
  IsPriceChangeAllowed: number;
  IsService: number;
  IsUsingDefaultQuantity: number;
  IsEnabled: number;
  Description: string | null;
  DateCreated: string;
  DateUpdated: string;
  Cost: number;
  Markup: number;
  Image: Buffer | null;
  Color: string;
  AgeRestriction: number | null;
  LastPurchasePrice: number;
  Rank: number;
}

// Aronium ProductGroup table (categories)
export interface AroniumProductGroup {
  Id: number;
  Name: string;
  ParentGroupId: number | null;
  Color: string;
  Image: Buffer | null;
  Rank: number;
}

// Aronium FloorPlan table
export interface AroniumFloorPlan {
  Id: number;
  Name: string;
  Color: string;
}

// Aronium FloorPlanTable table
export interface AroniumFloorPlanTable {
  Id: number;
  Name: string;
  FloorPlanId: number;
  PositionX: number;
  PositionY: number;
  Width: number;
  Height: number;
  IsRound: number;
}

// Aronium Document table (for order export)
export interface AroniumDocument {
  Id: number;
  Number: string;
  UserId: number;
  CustomerId: number | null;
  OrderNumber: string | null;
  Date: string;
  StockDate: string;
  Total: number;
  IsClockedOut: number;
  DocumentTypeId: number;
  WarehouseId: number;
  ReferenceDocumentNumber: string | null;
  DateCreated: string;
  DateUpdated: string;
  InternalNote: string | null;
  Note: string | null;
  DueDate: string | null;
  Discount: number;
  DiscountType: number;
  PaidStatus: number;
  DiscountApplyRule: number;
  ServiceType: number;
}

// Aronium DocumentItem table
export interface AroniumDocumentItem {
  Id: number;
  DocumentId: number;
  ProductId: number;
  Quantity: number;
  ExpectedQuantity: number;
  PriceBeforeTax: number;
  Price: number;
  Discount: number;
  DiscountType: number;
  ProductCost: number;
  PriceBeforeTaxAfterDiscount: number;
  PriceAfterDiscount: number;
  Total: number;
  TotalAfterDocumentDiscount: number;
  DiscountApplyRule: number;
}

// Aronium User table
export interface AroniumUser {
  Id: number;
  FirstName: string | null;
  LastName: string | null;
  Username: string | null;
  Password: string;
  AccessLevel: number;
  IsEnabled: number;
  Email: string | null;
}

// Aronium Tax table
export interface AroniumTax {
  Id: number;
  Name: string;
  Rate: number;
  Code: string | null;
  IsFixed: number;
  IsTaxOnTotal: number;
  IsEnabled: number;
}

// Aronium ProductTax table
export interface AroniumProductTax {
  ProductId: number;
  TaxId: number;
}

// Aronium Payment table
export interface AroniumPayment {
  Id: number;
  DocumentId: number;
  PaymentTypeId: number;
  Amount: number;
  Date: string | null;
  UserId: number;
  ZReportId: number | null;
  DateCreated: string;
}

// Aronium PaymentType table
export interface AroniumPaymentType {
  Id: number;
  Name: string;
  Code: string | null;
  IsCustomerRequired: number;
  IsFiscal: number;
  IsSlipRequired: number;
  IsChangeAllowed: number;
  Ordinal: number;
  IsEnabled: number;
  IsQuickPayment: number;
  OpenCashDrawer: number;
  ShortcutKey: string | null;
  MarkAsPaid: number;
}

// Aronium DocumentType table
export interface AroniumDocumentType {
  Id: number;
  Name: string;
  Code: string;
  DocumentCategoryId: number;
  WarehouseId: number;
  StockDirection: number;
  EditorType: number;
  PrintTemplate: string | null;
  PriceType: number;
  LanguageKey: string | null;
}

// Aronium Warehouse table
export interface AroniumWarehouse {
  Id: number;
  Name: string;
}

// Aronium Counter table
export interface AroniumCounter {
  Name: string;
  Value: number;
}
