package models

import (
	"time"

	"github.com/google/uuid"
	"lib/pq" // postgres array support
)

// User represents ShambaLoop platform users
type User struct {
	ID        uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	Phone     string    `gorm:"type:varchar(20);uniqueIndex;not null"`
	Name      string    `gorm:"type:varchar(100);not null"`
	Email     *string   `gorm:"type:varchar(100);uniqueIndex"`
	Role      string    `gorm:"type:varchar(30);not null"` // landowner, farmer, investor, admin
	Verified  bool      `gorm:"default:false"`
	County    string    `gorm:"type:varchar(50);not null"`
	AvatarURL string    `gorm:"type:text"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP"`
}

// Listing represents Jumia-style agri-marketplace postings
type Listing struct {
	ID                  uuid.UUID         `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	Type                string            `gorm:"type:varchar(30);index;not null"` // land, livestock, opportunity
	Title               string            `gorm:"type:varchar(200);not null"`
	Description         string            `gorm:"type:text;not null"`
	LocationCounty      string            `gorm:"type:varchar(50);index;not null"`
	PriceKES            float64           `gorm:"type:decimal(14,2);not null"`
	RevenueSplitPercent *int              `gorm:"type:integer"`
	Verified            bool              `gorm:"default:false;index"`
	ImageURL            string            `gorm:"type:text"`
	OwnerID             uuid.UUID         `gorm:"type:uuid;not null"`
	OwnerName           string            `gorm:"type:varchar(100);not null"`
	OwnerPhone          string            `gorm:"type:varchar(20);not null"`
	LandDetails         *LandDetails      `gorm:"foreignKey:ListingID;constraint:OnDelete:CASCADE;"`
	LivestockDetails    *LivestockDetails `gorm:"foreignKey:ListingID;constraint:OnDelete:CASCADE;"`
	OpportunityDetails  *OpportunityDetails `gorm:"foreignKey:ListingID;constraint:OnDelete:CASCADE;"`
	CreatedAt           time.Time         `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt           time.Time         `gorm:"default:CURRENT_TIMESTAMP"`
}

// LandDetails adds land specific details
type LandDetails struct {
	ID             uuid.UUID      `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	ListingID      uuid.UUID      `gorm:"type:uuid;uniqueIndex;not null"`
	Acreage        float64        `gorm:"type:decimal(10,2);not null"`
	SoilType       string         `gorm:"type:varchar(100)"`
	WaterSource    string         `gorm:"type:varchar(100);not null"`
	Accessibility  string         `gorm:"type:varchar(150);not null"`
	IdealCrops     pq.StringArray `gorm:"type:text[]"`
}

// LivestockDetails adds shared animal equity details
type LivestockDetails struct {
	ID                  uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	ListingID           uuid.UUID `gorm:"type:uuid;uniqueIndex;not null"`
	Species             string    `gorm:"type:varchar(50);not null"` // dairy, poultry, goat, pig, beef
	TagID               string    `gorm:"type:varchar(50);uniqueIndex;not null"`
	Breed               string    `gorm:"type:varchar(100);not null"`
	ExpectedYield       string    `gorm:"type:varchar(150)"`
	RevenueShareConfig  string    `gorm:"type:text"`
}

// OpportunityDetails adds joint contracts information
type OpportunityDetails struct {
	ID                uuid.UUID      `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	ListingID         uuid.UUID      `gorm:"type:uuid;uniqueIndex;not null"`
	RequiredSkills    pq.StringArray `gorm:"type:text[]"`
	DurationMonths    int            `gorm:"type:integer;not null"`
	ExpectedWorkforce int            `gorm:"default:1;not null"`
	CompensationType  string         `gorm:"type:varchar(50);not null"`
}

// LandLease models actual farm rentals
type LandLease struct {
	ID                uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	ListingID         uuid.UUID `gorm:"type:uuid"`
	LandownerID       uuid.UUID `gorm:"type:uuid;not null"`
	FarmerID          uuid.UUID `gorm:"type:uuid;not null"`
	AcreageLeased     float64   `gorm:"type:decimal(10,2);not null"`
	PricePerAcreKES   float64   `gorm:"type:decimal(14,2);not null"`
	DurationMonths    int       `gorm:"type:integer;not null"`
	StartDate         time.Time `gorm:"type:date;not null"`
	Status            string    `gorm:"type:varchar(30);default:'PENDING'"` // PENDING, SIGNED, COMPLETED, CANCELLED
	MpesaEscrowStatus string    `gorm:"type:varchar(30);default:'UNPAID'"`  // UNPAID, ESCROWED, DISBURSED, REFUNDED
	PaymentsMade      float64   `gorm:"type:decimal(14,2);default:0.00"`
	CreatedAt         time.Time `gorm:"default:CURRENT_TIMESTAMP"`
}

// LivestockPartnership models animal share systems
type LivestockPartnership struct {
	ID                   uuid.UUID      `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	ListingID            *uuid.UUID     `gorm:"type:uuid"`
	InvestorID           uuid.UUID      `gorm:"type:uuid;not null"`
	FarmerID             uuid.UUID      `gorm:"type:uuid;not null"`
	AnimalTagID          string         `gorm:"type:varchar(50);not null"`
	AnimalType           string         `gorm:"type:varchar(50);not null"`
	Breed                string         `gorm:"type:varchar(100);not null"`
	SplitPercentInvestor int            `gorm:"type:integer;not null"`
	Status               string         `gorm:"type:varchar(30);default:'PROPOSED'"` // PROPOSED, ACTIVE, COMPLETED
	CreatedAt            time.Time      `gorm:"default:CURRENT_TIMESTAMP"`
	HealthLogs           []HealthLog    `gorm:"foreignKey:PartnershipID"`
	ProductionLogs       []ProductionLog `gorm:"foreignKey:PartnershipID"`
}

// HealthLog keeps diaries of animal status
type HealthLog struct {
	ID            uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	PartnershipID uuid.UUID `gorm:"type:uuid;not null"`
	Status        string    `gorm:"type:varchar(50);not null"` // Healthy, Sick, Recovering, Vaccinated
	Notes         string    `gorm:"type:text;not null"`
	RecordedBy    string    `gorm:"type:varchar(120);not null"`
	CreatedAt     time.Time `gorm:"default:CURRENT_TIMESTAMP"`
}

// ProductionLog monitors cash output divisions
type ProductionLog struct {
	ID                 uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	PartnershipID      uuid.UUID `gorm:"type:uuid;not null"`
	Metric             string    `gorm:"type:varchar(50);not null"` // Milk Liters, Egg Trays
	Quantity           float64   `gorm:"type:decimal(12,2);not null"`
	RevenueKES         float64   `gorm:"type:decimal(14,2);not null"`
	InvestorPayoutKES  float64   `gorm:"type:decimal(14,2);not null"`
	FarmerPayoutKES    float64   `gorm:"type:decimal(14,2);not null"`
	CreatedAt          time.Time `gorm:"default:CURRENT_TIMESTAMP"`
}

// VerificationRequest queues admin checks
type VerificationRequest struct {
	ID             uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	UserID         uuid.UUID `gorm:"type:uuid;not null"`
	UserName       string    `gorm:"type:varchar(100);not null"`
	UserRole       string    `gorm:"type:varchar(30);not null"`
	DocumentType   string    `gorm:"type:varchar(50);not null"` // ID_CARD, TITLE_DEED, LIVESTOCK_CERT
	DocumentNumber string    `gorm:"type:varchar(100);not null"`
	Notes          string    `gorm:"type:text"`
	Status         string    `gorm:"type:varchar(30);default:'PENDING'"` // PENDING, APPROVED, REJECTED
	SubmittedAt    time.Time `gorm:"default:CURRENT_TIMESTAMP"`
}

// MpesaTransaction creates an audit trail
type MpesaTransaction struct {
	ID            uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	TransactionID string    `gorm:"type:varchar(50);uniqueIndex;not null"`
	PhoneNumber   string    `gorm:"type:varchar(20);not null"`
	AmountKES     float64   `gorm:"type:decimal(14,2);not null"`
	Purpose       string    `gorm:"type:text;not null"`
	Status        string    `gorm:"type:varchar(30);not null"` // SUCCESS, FAILED
	CreatedAt     time.Time `gorm:"default:CURRENT_TIMESTAMP"`
}
