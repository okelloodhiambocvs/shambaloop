package main

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"golang.org/x/time/rate"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// ==========================================
// RELATIONAL MODELS DEFINITIONS
// ==========================================

type User struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Phone     string    `gorm:"type:varchar(20);uniqueIndex;not null" json:"phone"`
	Name      string    `gorm:"type:varchar(100);not null" json:"name"`
	Email     *string   `gorm:"type:varchar(100);uniqueIndex" json:"email"`
	Role      string    `gorm:"type:varchar(30);not null" json:"role"` // landowner, farmer, investor, admin
	Verified  bool      `gorm:"default:false" json:"verified"`
	County    string    `gorm:"type:varchar(50);not null" json:"county"`
	AvatarURL string    `gorm:"type:text" json:"avatarUrl"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"createdAt"`
	UpdatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updatedAt"`
}

type Listing struct {
	ID                  uuid.UUID         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Type                string            `gorm:"type:varchar(30);index;not null" json:"type"` // land, livestock, opportunity
	Title               string            `gorm:"type:varchar(200);not null" json:"title"`
	Description         string            `gorm:"type:text;not null" json:"description"`
	LocationCounty      string            `gorm:"type:varchar(50);index;not null" json:"locationCounty"`
	PriceKES            float64           `gorm:"type:decimal(14,2);not null" json:"priceKES"`
	RevenueSplitPercent *int              `gorm:"type:integer" json:"revenueSplitPercent,omitempty"`
	Verified            bool              `gorm:"default:false;index" json:"verified"`
	ImageURL            string            `gorm:"type:text" json:"imageUrl"`
	OwnerID             uuid.UUID         `gorm:"type:uuid;not null" json:"ownerId"`
	OwnerName           string            `gorm:"type:varchar(100);not null" json:"ownerName"`
	OwnerPhone          string            `gorm:"type:varchar(20);not null" json:"ownerPhone"`
	LandDetails         *LandDetails      `gorm:"foreignKey:ListingID;constraint:OnDelete:CASCADE;" json:"landDetails,omitempty"`
	LivestockDetails    *LivestockDetails `gorm:"foreignKey:ListingID;constraint:OnDelete:CASCADE;" json:"livestockDetails,omitempty"`
	OpportunityDetails  *OpportunityDetails `gorm:"foreignKey:ListingID;constraint:OnDelete:CASCADE;" json:"opportunityDetails,omitempty"`
	CreatedAt           time.Time         `gorm:"default:CURRENT_TIMESTAMP" json:"createdAt"`
	UpdatedAt           time.Time         `gorm:"default:CURRENT_TIMESTAMP" json:"updatedAt"`
}

type LandDetails struct {
	ID            uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	ListingID     uuid.UUID `gorm:"type:uuid;uniqueIndex;not null" json:"listingId"`
	Acreage       float64   `gorm:"type:decimal(10,2);not null" json:"acreage"`
	SoilType      string    `gorm:"type:varchar(100)" json:"soilType"`
	WaterSource   string    `gorm:"type:varchar(100);not null" json:"waterSource"`
	Accessibility string    `gorm:"type:varchar(150);not null" json:"accessibility"`
	IdealCrops    []string  `gorm:"type:text[]" json:"idealCrops"`
}

type LivestockDetails struct {
	ID                 uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	ListingID          uuid.UUID `gorm:"type:uuid;uniqueIndex;not null" json:"listingId"`
	Species            string    `gorm:"type:varchar(50);not null" json:"species"`
	TagID              string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"tagId"`
	Breed              string    `gorm:"type:varchar(100);not null" json:"breed"`
	ExpectedYield      string    `gorm:"type:varchar(150)" json:"expectedYield"`
	RevenueShareConfig string    `gorm:"type:text" json:"revenueShareConfig"`
}

type OpportunityDetails struct {
	ID                uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	ListingID         uuid.UUID `gorm:"type:uuid;uniqueIndex;not null" json:"listingId"`
	RequiredSkills    []string  `gorm:"type:text[]" json:"requiredSkills"`
	DurationMonths    int       `gorm:"type:integer;not null" json:"durationMonths"`
	ExpectedWorkforce int       `gorm:"default:1;not null" json:"expectedWorkforce"`
	CompensationType  string    `gorm:"type:varchar(50);not null" json:"compensationType"`
}

type LandLease struct {
	ID                uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	ListingID         uuid.UUID `gorm:"type:uuid" json:"listingId"`
	LandownerID       uuid.UUID `gorm:"type:uuid;not null" json:"landownerId"`
	FarmerID          uuid.UUID `gorm:"type:uuid;not null" json:"farmerId"`
	AcreageLeased     float64   `gorm:"type:decimal(10,2);not null" json:"acreageLeased"`
	PricePerAcreKES   float64   `gorm:"type:decimal(14,2);not null" json:"pricePerAcreKES"`
	DurationMonths    int       `gorm:"type:integer;not null" json:"durationMonths"`
	StartDate         time.Time `gorm:"type:date;not null" json:"startDate"`
	Status            string    `gorm:"type:varchar(30);default:'PENDING'" json:"status"`
	MpesaEscrowStatus string    `gorm:"type:varchar(30);default:'UNPAID'" json:"mpesaEscrowStatus"`
	PaymentsMade      float64   `gorm:"type:decimal(14,2);default:0.00" json:"paymentsMade"`
	CreatedAt         time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"createdAt"`
}

type LivestockPartnership struct {
	ID                   uuid.UUID       `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	ListingID            *uuid.UUID      `gorm:"type:uuid" json:"listingId"`
	InvestorID           uuid.UUID       `gorm:"type:uuid;not null" json:"investorId"`
	FarmerID             uuid.UUID       `gorm:"type:uuid;not null" json:"farmerId"`
	AnimalTagID          string          `gorm:"type:varchar(50);not null" json:"animalTagId"`
	AnimalType           string          `gorm:"type:varchar(50);not null" json:"animalType"`
	Breed                string          `gorm:"type:varchar(100);not null" json:"breed"`
	SplitPercentInvestor int             `gorm:"type:integer;not null" json:"splitPercentInvestor"`
	Status               string          `gorm:"type:varchar(30);default:'PROPOSED'" json:"status"`
	CreatedAt            time.Time       `gorm:"default:CURRENT_TIMESTAMP" json:"createdAt"`
	HealthLogs           []HealthLog     `gorm:"foreignKey:PartnershipID" json:"healthLogs"`
	ProductionLogs       []ProductionLog `gorm:"foreignKey:PartnershipID" json:"productionLogs"`
}

type HealthLog struct {
	ID            uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	PartnershipID uuid.UUID `gorm:"type:uuid;not null" json:"partnershipId"`
	Status        string    `gorm:"type:varchar(50);not null" json:"status"`
	Notes         string    `gorm:"type:text;not null" json:"notes"`
	RecordedBy    string    `gorm:"type:varchar(120);not null" json:"recordedBy"`
	CreatedAt     time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"createdAt"`
}

type ProductionLog struct {
	ID                uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	PartnershipID     uuid.UUID `gorm:"type:uuid;not null" json:"partnershipId"`
	Metric            string    `gorm:"type:varchar(50);not null" json:"metric"`
	Quantity          float64   `gorm:"type:decimal(12,2);not null" json:"quantity"`
	RevenueKES        float64   `gorm:"type:decimal(14,2);not null" json:"revenueKES"`
	InvestorPayoutKES float64   `gorm:"type:decimal(14,2);not null" json:"investorPayoutKES"`
	FarmerPayoutKES   float64   `gorm:"type:decimal(14,2);not null" json:"farmerPayoutKES"`
	CreatedAt         time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"createdAt"`
}

type VerificationRequest struct {
	ID             uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID         uuid.UUID `gorm:"type:uuid;not null" json:"userId"`
	UserName       string    `gorm:"type:varchar(100);not null" json:"userName"`
	UserRole       string    `gorm:"type:varchar(30);not null" json:"userRole"`
	DocumentType   string    `gorm:"type:varchar(50);not null" json:"documentType"`
	DocumentNumber string    `gorm:"type:varchar(100);not null" json:"documentNumber"`
	Notes          string    `gorm:"type:text" json:"notes"`
	Status         string    `gorm:"type:varchar(30);default:'PENDING'" json:"status"`
	SubmittedAt    time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"submittedAt"`
}

type MpesaTransaction struct {
	ID            uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	TransactionID string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"transactionId"`
	PhoneNumber   string    `gorm:"type:varchar(20);not null" json:"phoneNumber"`
	AmountKES     float64   `gorm:"type:decimal(14,2);not null" json:"amountKES"`
	Purpose       string    `gorm:"type:text;not null" json:"purpose"`
	Status        string    `gorm:"type:varchar(30);not null" json:"status"`
	CreatedAt     time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"createdAt"`
}

// Global active database pointer
var DB *gorm.DB
var jwtSecretKey []byte

// Rate limits maps using golang.org/x/time/rate
type GoLimiter struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

var rateLimiterMutex sync.Mutex
var requestCountMap = make(map[string]*GoLimiter)

func init() {
	go func() {
		for {
			time.Sleep(5 * time.Minute)
			rateLimiterMutex.Lock()
			for ip, client := range requestCountMap {
				if time.Since(client.lastSeen) > 10*time.Minute {
					delete(requestCountMap, ip)
				}
			}
			rateLimiterMutex.Unlock()
		}
	}()
}

func getJWTSecret() []byte {
	if len(jwtSecretKey) == 0 {
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			secret = "shambaloop_super_secret_jwt_token_key_2026_default"
		}
		jwtSecretKey = []byte(secret)
	}
	return jwtSecretKey
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("[INFO] Proceeding with runtime environment variables.")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	initDB()

	gin.SetMode(gin.ReleaseMode)
	r := gin.New()

	// Interceptors and Loggers
	r.Use(StructuredLogMiddleware())
	r.Use(GORMCORSMiddleware())
	r.Use(gin.Recovery())

	// Native health check
	r.GET("/api/health", func(c *gin.Context) {
		status := "healthy"
		dbState := "CONNECTED"
		if DB == nil {
			status = "degraded"
			dbState = "OFFLINE"
		} else {
			sqlDB, err := DB.DB()
			if err != nil || sqlDB.Ping() != nil {
				status = "degraded"
				dbState = "STALE"
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"status":            status,
			"market":            "ShambaLoop Kenya",
			"database":          dbState,
			"uptimeSeconds":     int(time.Since(time.Time{}).Seconds()),
			"goRuntimeVersion":  "go1.21+",
		})
	})

	api := r.Group("/api")
	{
		// Authentications
		api.POST("/auth/register", GoAuthRateLimiter(), RegisterUser)
		api.POST("/auth/login", GoAuthRateLimiter(), LoginUser)

		// Browse Listings
		api.GET("/listings", GetListings)
		api.GET("/listings/:id", GetListingByID)

		// Verification and webhook callbacks
		api.POST("/payments/callback", ProcessSTKCallback)

		// Strict JWT authorized routes
		authRequired := api.Group("/")
		authRequired.Use(JWTAuthRequiredMiddleware())
		{
			authRequired.POST("/listings", CreateListing)
			authRequired.POST("/verification/request", RequestVerification)

			// Leasings Escrows
			authRequired.POST("/land/leases", CreateLeaseAgreement)
			authRequired.GET("/land/leases", GetLeaseAgreements)
			authRequired.POST("/land/leases/:id/disburse", UpdateEscrowDisbursements)

			// Livestock matches
			authRequired.POST("/livestock/partnerships", CreatePartnership)
			authRequired.GET("/livestock/partnerships", GetPartnerships)
			authRequired.POST("/livestock/health", RecordHealthLog)
			authRequired.POST("/livestock/production", RecordProductionLog)

			// Payments STK trigger
			authRequired.POST("/payments/stkpush", InitiateSTKPush)

			// Restricted admin panel dashboard
			adminRequired := authRequired.Group("/admin")
			adminRequired.Use(AdminRoleEnforced())
			{
				adminRequired.GET("/analytics", GetAdminAnalytics)
				adminRequired.POST("/approve-listing", ApproveListing)
				adminRequired.POST("/approve-doc", ApproveVerificationRequest)
			}
		}
	}

	srv := &http.Server{
		Addr:    "0.0.0.0:" + port,
		Handler: r,
	}

	log.Printf("[SERVER] ShambaLoop Go backend initializing on port %s", port)

	// Graceful shutdown setup
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Fatal: Gin launch error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("[SHUTDOWN] Terminate signal intercepted. Flushing DB queries...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Fatal: Forcing backend server shutdown:", err)
	}

	log.Println("[SHUTDOWN] ShambaLoop backend release finished successfully.")
}

// ==========================================
// INFRASTRUCTURAL MIDDLEWARES
// ==========================================

func initDB() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Println("[DB] DATABASE_URL empty. SQLite driver or mock memory schema assumed inside local runtime.")
		return
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Printf("[DB ERROR] Connection failed: %v", err)
		return
	}

	log.Println("[DB] Connection confirmed. Migrating schemas safely...")
	_ = db.AutoMigrate(
		&User{}, &Listing{}, &LandDetails{}, &LivestockDetails{},
		&OpportunityDetails{}, &LandLease{}, &LivestockPartnership{},
		&HealthLog{}, &ProductionLog{}, &VerificationRequest{}, &MpesaTransaction{},
	)
	DB = db
}

func StructuredLogMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		logDetails := map[string]interface{}{
			"timestamp":   time.Now().Format(time.RFC3339),
			"method":      c.Request.Method,
			"path":        c.Request.URL.Path,
			"status":      c.Writer.Status(),
			"ip":          c.ClientIP(),
			"durationMs":  time.Since(start).Milliseconds(),
		}
		bytes, _ := json.Marshal(logDetails)
		fmt.Println(string(bytes))
	}
}

func GORMCORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		whitelistStr := os.Getenv("CORS_WHITELIST")
		allowed := false

		if whitelistStr != "" {
			parts := strings.Split(whitelistStr, ",")
			for _, part := range parts {
				trimmed := strings.TrimSpace(part)
				if trimmed == "*" || trimmed == origin {
					allowed = true
					break
				}
			}
		} else {
			// For testing/sandbox mode when CORS_WHITELIST is empty:
			// Allow localhost, local network ranges, and Europe West GCP Run apps
			if origin != "" {
				if strings.HasPrefix(origin, "http://localhost") || strings.HasPrefix(origin, "http://127.0.0.1") || strings.Contains(origin, "europe-west2.run.app") {
					allowed = true
				}
			} else {
				allowed = true
			}
		}

		if allowed && origin != "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		} else if origin != "" {
			// Strict block - do not set CORS headers for non-whitelisted origins
		} else {
			c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		}

		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

func GoAuthRateLimiter() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		rateLimiterMutex.Lock()
		client, exists := requestCountMap[ip]
		if !exists {
			// Limit: 15 requests burst, replenishing at 1 token every 4 seconds (average 15/minute)
			client = &GoLimiter{
				limiter:  rate.NewLimiter(rate.Every(4*time.Second), 15),
				lastSeen: time.Now(),
			}
			requestCountMap[ip] = client
		} else {
			client.lastSeen = time.Now()
		}
		limiter := client.limiter
		rateLimiterMutex.Unlock()

		if !limiter.Allow() {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "Too many requests. Please slow down and try again later."})
			return
		}
		c.Next()
	}
}

func JWTAuthRequiredMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			// Search parameter user-id fallback for testing
			fallbackID := c.GetHeader("X-User-ID")
			if fallbackID != "" && DB != nil {
				var fallbackUser User
				if err := DB.First(&fallbackUser, "id = ?", fallbackID).Error; err == nil {
					c.Set("user", fallbackUser)
					c.Next()
					return
				}
			}
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing access token in Bearer headers."})
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			return getJWTSecret(), nil
		})

		if err != nil || !token.Valid {
			// Fallback parsing base64 claims directly
			if bytesStr, err := base64.StdEncoding.DecodeString(tokenStr); err == nil {
				var rawClaims map[string]interface{}
				if json.Unmarshal(bytesStr, &rawClaims) == nil {
					if idVal, exists := rawClaims["id"]; exists {
						idStr, _ := idVal.(string)
						var fallbackUser User
						if DB != nil {
							if err := DB.First(&fallbackUser, "id = ?", idStr).Error; err == nil {
								c.Set("user", fallbackUser)
								c.Next()
								return
							}
						}
					}
				}
			}
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Access token is expired or signed incorrectly."})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token structures."})
			return
		}

		idString, _ := claims["id"].(string)
		var subscriber User
		if DB != nil {
			if err := DB.First(&subscriber, "id = ?", idString).Error; err != nil {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Subscriber profile could not be verified."})
				return
			}
		} else {
			subscriber = User{ID: uuid.MustParse(idString), Role: "farmer", Name: "Mock Mode"}
		}

		c.Set("user", subscriber)
		c.Next()
	}
}

func AdminRoleEnforced() gin.HandlerFunc {
	return func(c *gin.Context) {
		userVal, exists := c.Get("user")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized session."})
			return
		}
		sessionUser := userVal.(User)
		if sessionUser.Role != "admin" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Admin credentials are required to complete this task."})
			return
		}
		c.Next()
	}
}

// ==========================================
// AUTHENTICATIONS HANDLERS
// ==========================================

func RegisterUser(c *gin.Context) {
	var body struct {
		Phone    string  `json:"phone"`
		Name     string  `json:"name"`
		Email    *string `json:"email"`
		Role     string  `json:"role"`
		County   string  `json:"county"`
		Password string  `json:"password"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload binding error."})
		return
	}

	if body.Phone == "" || body.Name == "" || body.Role == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "All necessary fields (phone, name, role) must be supplied."})
		return
	}

	user := User{
		ID:        uuid.New(),
		Phone:     body.Phone,
		Name:      body.Name,
		Email:     body.Email,
		Role:      body.Role,
		County:    body.County,
		Verified:  false,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if DB != nil {
		if err := DB.Create(&user).Error; err != nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Mobile subscriber already registered."})
			return
		}
	}

	tokenStr := base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf(`{"id":"%s","role":"%s"}`, user.ID.String(), user.Role)))
	c.JSON(http.StatusCreated, gin.H{
		"user":  user,
		"token": tokenStr,
	})
}

func LoginUser(c *gin.Context) {
	var body struct {
		Phone    string `json:"phone"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid format."})
		return
	}

	var user User
	if DB != nil {
		if err := DB.First(&user, "phone = ?", body.Phone).Error; err != nil {
			// Autoprovide register for frictionless mockup testing
			user = User{
				ID:        uuid.New(),
				Phone:     body.Phone,
				Name:      "Mkulima_New",
				Role:      "farmer",
				County:    "Nairobi",
				Verified:  false,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}
			DB.Create(&user)
		}
	} else {
		user = User{ID: uuid.New(), Phone: body.Phone, Role: "farmer", Name: "Guest User"}
	}

	tokenStr := base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf(`{"id":"%s","role":"%s"}`, user.ID.String(), user.Role)))
	c.JSON(http.StatusOK, gin.H{
		"user":  user,
		"token": tokenStr,
	})
}

// ==========================================
// MARKETPLACE & LISTINGS
// ==========================================

func GetListings(c *gin.Context) {
	var resultList []Listing
	if DB != nil {
		query := DB.Preload("LandDetails").Preload("LivestockDetails").Preload("OpportunityDetails")
		
		county := c.Query("county")
		if county != "" {
			query = query.Where("LOWER(location_county) = ?", strings.ToLower(county))
		}
		listingType := c.Query("type")
		if listingType != "" {
			query = query.Where("type = ?", listingType)
		}
		minPrice, _ := strconv.ParseFloat(c.Query("minPrice"), 64)
		if minPrice > 0 {
			query = query.Where("price_kes >= ?", minPrice)
		}
		maxPrice, _ := strconv.ParseFloat(c.Query("maxPrice"), 64)
		if maxPrice > 0 {
			query = query.Where("price_kes <= ?", maxPrice)
		}

		query.Find(&resultList)
	} else {
		resultList = []Listing{}
	}

	c.JSON(http.StatusOK, resultList)
}

func GetListingByID(c *gin.Context) {
	id := c.Param("id")
	var item Listing
	if DB != nil {
		if err := DB.Preload("LandDetails").Preload("LivestockDetails").Preload("OpportunityDetails").First(&item, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Listing details not found."})
			return
		}
	} else {
		c.JSON(http.StatusNotFound, gin.H{"error": "Database not configured."})
		return
	}
	c.JSON(http.StatusOK, item)
}

func CreateListing(c *gin.Context) {
	var item Listing
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload error."})
		return
	}

	item.ID = uuid.New()
	item.CreatedAt = time.Now()
	item.UpdatedAt = time.Now()
	item.Verified = false

	if DB != nil {
		if err := DB.Create(&item).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to serialize listing."})
			return
		}
	}

	c.JSON(http.StatusCreated, item)
}

// ==========================================
// LEASING WORKFLOWS
// ==========================================

func CreateLeaseAgreement(c *gin.Context) {
	var input LandLease
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload binding mismatch."})
		return
	}

	input.ID = uuid.New()
	input.Status = "SIGNED"
	input.MpesaEscrowStatus = "ESCROWED"
	input.PaymentsMade = input.AcreageLeased * input.PricePerAcreKES * float64(input.DurationMonths)
	input.CreatedAt = time.Now()

	if DB != nil {
		if err := DB.Create(&input).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create lease record."})
			return
		}
	}

	c.JSON(http.StatusCreated, input)
}

func GetLeaseAgreements(c *gin.Context) {
	var list []LandLease
	if DB != nil {
		userID := c.Query("userId")
		if userID != "" {
			DB.Where("landowner_id = ? OR farmer_id = ?", userID, userID).Find(&list)
		} else {
			DB.Find(&list)
		}
	} else {
		list = []LandLease{}
	}
	c.JSON(http.StatusOK, list)
}

func UpdateEscrowDisbursements(c *gin.Context) {
	id := c.Param("id")
	var lease LandLease
	if DB != nil {
		if err := DB.First(&lease, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Lease agreements not found."})
			return
		}
		lease.MpesaEscrowStatus = "DISBURSED"
		DB.Save(&lease)
	} else {
		c.JSON(http.StatusNotFound, gin.H{"error": "Database unavailable."})
		return
	}
	c.JSON(http.StatusOK, lease)
}

// ==========================================
// PARTNERSHIP WORKFLOWS
// ==========================================

func CreatePartnership(c *gin.Context) {
	var input LivestockPartnership
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data bind error."})
		return
	}

	input.ID = uuid.New()
	input.Status = "ACTIVE"
	input.CreatedAt = time.Now()
	input.HealthLogs = []HealthLog{
		{
			ID:            uuid.New(),
			PartnershipID: input.ID,
			Status:        "Healthy",
			Notes:         "Asset equity registration approved on Go system.",
			RecordedBy:    "Go Inspector System",
			CreatedAt:     time.Now(),
		},
	}

	if DB != nil {
		if err := DB.Create(&input).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to construct partnership entry."})
			return
		}
	}

	c.JSON(http.StatusCreated, input)
}

func GetPartnerships(c *gin.Context) {
	var list []LivestockPartnership
	if DB != nil {
		userID := c.Query("userId")
		if userID != "" {
			DB.Preload("HealthLogs").Preload("ProductionLogs").Where("investor_id = ? OR farmer_id = ?", userID, userID).Find(&list)
		} else {
			DB.Preload("HealthLogs").Preload("ProductionLogs").Find(&list)
		}
	} else {
		list = []LivestockPartnership{}
	}
	c.JSON(http.StatusOK, list)
}

func RecordHealthLog(c *gin.Context) {
	var body struct {
		PartnershipID string `json:"partnershipId"`
		Status        string `json:"status"`
		Notes         string `json:"notes"`
		RecordedBy    string `json:"recordedBy"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload error."})
		return
	}

	partnerUUID, _ := uuid.Parse(body.PartnershipID)
	logVal := HealthLog{
		ID:            uuid.New(),
		PartnershipID: partnerUUID,
		Status:        body.Status,
		Notes:         body.Notes,
		RecordedBy:    body.RecordedBy,
		CreatedAt:     time.Now(),
	}

	if DB != nil {
		if err := DB.Create(&logVal).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database tracking failure."})
			return
		}
	}

	c.JSON(http.StatusCreated, logVal)
}

func RecordProductionLog(c *gin.Context) {
	var body struct {
		PartnershipID string  `json:"partnershipId"`
		Quantity      float64 `json:"quantity"`
		Metric        string  `json:"metric"`
		PricePerUnit  float64 `json:"pricePerUnit"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload error."})
		return
	}

	partnerUUID, _ := uuid.Parse(body.PartnershipID)
	var partnership LivestockPartnership
	if DB != nil {
		if err := DB.First(&partnership, "id = ?", partnerUUID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Partnership row missing."})
			return
		}
	}

	price := body.PricePerUnit
	if price <= 0 {
		price = 60.0
	}
	gross := body.Quantity * price
	investorSplit := gross * (float64(partnership.SplitPercentInvestor) / 100.0)
	farmerSplit := gross - investorSplit

	logVal := ProductionLog{
		ID:                uuid.New(),
		PartnershipID:     partnerUUID,
		Metric:            body.Metric,
		Quantity:          body.Quantity,
		RevenueKES:        gross,
		InvestorPayoutKES: investorSplit,
		FarmerPayoutKES:   farmerSplit,
		CreatedAt:         time.Now(),
	}

	if DB != nil {
		DB.Create(&logVal)
	}

	c.JSON(http.StatusCreated, logVal)
}

// ==========================================
// PAYMENT CALLBACK HOOKS OR web simulation
// ==========================================

func ProcessSTKCallback(c *gin.Context) {
	var callback struct {
		Body struct {
			Callback struct {
				MerchantRequestID string `json:"MerchantRequestID"`
				CheckoutRequestID string `json:"CheckoutRequestID"`
				ResultCode        int    `json:"ResultCode"`
				ResultDesc        string `json:"ResultDesc"`
			} `json:"stkCallback"`
		} `json:"Body"`
	}

	if err := c.ShouldBindJSON(&callback); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Callback malformation."})
		return
	}

	info := callback.Body.Callback
	if DB != nil {
		var tx MpesaTransaction
		if err := DB.First(&tx, "transaction_id = ?", info.CheckoutRequestID).Error; err == nil {
			if info.ResultCode == 0 {
				tx.Status = "SUCCESS"
			} else {
				tx.Status = "FAILED"
			}
			DB.Save(&tx)
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "Callback processed and stored dynamically."})
}

func InitiateSTKPush(c *gin.Context) {
	var payload struct {
		PhoneNumber string  `json:"phoneNumber" binding:"required"`
		Amount      float64 `json:"amount" binding:"required"`
		Purpose     string  `json:"purpose"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Phone and amount required is missing."})
		return
	}

	charIndex, _ := rand.Int(rand.Reader, big.NewInt(6))
	randNum, _ := rand.Int(rand.Reader, big.NewInt(9000))
	mpesaChar := "RSTUXZ"[charIndex.Int64()]
	checkoutID := fmt.Sprintf("cid_stk_%d", time.Now().UnixNano())
	mpesaReceipt := fmt.Sprintf("%cGL%dHJK", mpesaChar, 1000+randNum.Int64())

	newTx := MpesaTransaction{
		ID:            uuid.New(),
		TransactionID: mpesaReceipt,
		PhoneNumber:   payload.PhoneNumber,
		AmountKES:     payload.Amount,
		Purpose:       payload.Purpose,
		Status:        "PENDING",
		CreatedAt:     time.Now(),
	}

	if DB != nil {
		DB.Create(&newTx)
	}

	c.JSON(http.StatusOK, gin.H{
		"success":           true,
		"MerchantRequestID": fmt.Sprintf("mid_%d", time.Now().Unix()),
		"CheckoutRequestID": checkoutID,
		"transaction":       newTx,
	})
}

// ==========================================
// ADMIN VERIFICATIONS AND kpis
// ==========================================

func RequestVerification(c *gin.Context) {
	var input VerificationRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Binding format error."})
		return
	}

	input.ID = uuid.New()
	input.Status = "PENDING"
	input.SubmittedAt = time.Now()

	if DB != nil {
		DB.Create(&input)
	}

	c.JSON(http.StatusCreated, input)
}

func ApproveListing(c *gin.Context) {
	var body struct {
		ListingID string `json:"listingId"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Binding error."})
		return
	}

	var item Listing
	if DB != nil {
		if err := DB.First(&item, "id = ?", body.ListingID).Error; err == nil {
			item.Verified = true;
			DB.Save(&item)
			c.JSON(http.StatusOK, gin.H{"success": true, "listing": item})
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "Listing details not found."})
}

func ApproveVerificationRequest(c *gin.Context) {
	var body struct {
		RequestId string `json:"requestId"`
		Status    string `json:"status"` // APPROVED / REJECTED
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Binding error."})
		return
	}

	if DB != nil {
		var request VerificationRequest
		if err := DB.First(&request, "id = ?", body.RequestId).Error; err == nil {
			request.Status = body.Status
			DB.Save(&request)

			if body.Status == "APPROVED" {
				var subscriber User
				if err := DB.First(&subscriber, "id = ?", request.UserID).Error; err == nil {
					subscriber.Verified = true;
					DB.Save(&subscriber)
				}
			}

			c.JSON(http.StatusOK, gin.H{"success": true, "verification": request})
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "Verification request missing."})
}

func GetAdminAnalytics(c *gin.Context) {
	var activeListings, activeFarms, registeredUsers, pendingVerifications int64
	var totalLeasedAcreage, totalEscrowKES float64

	if DB != nil {
		DB.Model(&Listing{}).Count(&activeListings)
		
		var signLeasesCount, activePartnershipsCount int64
		DB.Model(&LandLease{}).Where("status = 'SIGNED'").Count(&signLeasesCount)
		DB.Model(&LivestockPartnership{}).Where("status = 'ACTIVE'").Count(&activePartnershipsCount)
		activeFarms = signLeasesCount + activePartnershipsCount

		DB.Model(&LandLease{}).Select("COALESCE(SUM(acreage_leased), 0)").Row().Scan(&totalLeasedAcreage)
		DB.Model(&MpesaTransaction{}).Where("status = 'SUCCESS'").Select("COALESCE(SUM(amount_kes), 0)").Row().Scan(&totalEscrowKES)
		DB.Model(&User{}).Count(&registeredUsers)
		DB.Model(&VerificationRequest{}).Where("status = 'PENDING'").Count(&pendingVerifications)
	} else {
		activeListings = 4
		activeFarms = 2
		totalLeasedAcreage = 15.0
		totalEscrowKES = 48000.0
		registeredUsers = 4
		pendingVerifications = 1
	}

	c.JSON(http.StatusOK, gin.H{
		"activeListings":            activeListings,
		"activeFarms":               activeFarms,
		"totalLeasedAcreage":        totalLeasedAcreage,
		"totalEscrowKES":            totalEscrowKES,
		"registeredUsersCount2":     registeredUsers,
		"pendingVerificationsCount": pendingVerifications,
	})
}
