package handlers

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

// Safaricom Credentials & Configuration endpoints
const (
	SafaricomSandboxAuthURL  = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
	SafaricomSandboxSTKURL   = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
)

type MpesaSTKPayload struct {
	PhoneNumber string  `json:"phoneNumber" binding:"required"`
	Amount      float64 `json:"amount" binding:"required"`
	Purpose     string  `json:"purpose"`
}

type MpesaSTKRequest struct {
	BusinessShortCode string `json:"BusinessShortCode"`
	Password          string `json:"Password"`
	Timestamp         string `json:"Timestamp"`
	TransactionType   string `json:"TransactionType"` // CustomerPayBillOnline
	Amount            int    `json:"Amount"`
	PartyA            string `json:"PartyA"` // Senders phone
	PartyB            string `json:"PartyB"` // Paybill/Till number
	PhoneNumber       string `json:"PhoneNumber"`
	CallBackURL       string `json:"CallBackURL"`
	AccountReference  string `json:"AccountReference"`
	TransactionDesc   string `json:"TransactionDesc"`
}

type TokenResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   string `json:"expires_in"`
}

// InitiateSTKPush carries out real M-Pesa client interaction or falls back dynamically with structured logs
func InitiateSTKPush(c *gin.Context) {
	var payload MpesaSTKPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Mobile subscriber phone and KES monetary amount are required."})
		return
	}

	shortcode := os.Getenv("MPESA_BUSINESS_SHORTCODE")
	passkey := os.Getenv("MPESA_PASSKEY")
	consumerKey := os.Getenv("MPESA_CONSUMER_KEY")
	consumerSecret := os.Getenv("MPESA_CONSUMER_SECRET")
	callbackURL := os.Getenv("MPESA_CALLBACK_URL")

	// If variables are missing, simulate success with simulated transaction details for instant sandbox testing
	if shortcode == "" || passkey == "" || consumerKey == "" {
		logMpesaSimulation(payload)
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"simulated": true,
			"MerchantRequestID": "SIM-STK-Push-10294-M",
			"CheckoutRequestID": "ws_CO_13062026123405",
			"ResponseCode": "0",
			"CustomerMessage": "Success. Enter M-Pesa PIN on your phone screen to seal agreement.",
		})
		return
	}

	// 1. Generate Bearer Token from Daraja
	accessToken, err := getMpesaToken(consumerKey, consumerSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Daraja Auth Token Failure: %v", err)})
		return
	}

	// 2. Format Timestamp and encrypt Password
	timestamp := time.Now().Format("20060102150405")
	rawPassword := fmt.Sprintf("%s%s%s", shortcode, passkey, timestamp)
	encodedPassword := base64.StdEncoding.EncodeToString([]byte(rawPassword))

	stkReq := MpesaSTKRequest{
		BusinessShortCode: shortcode,
		Password:          encodedPassword,
		Timestamp:         timestamp,
		TransactionType:   "CustomerPayBillOnline",
		Amount:            int(payload.Amount),
		PartyA:            payload.PhoneNumber,
		PartyB:            shortcode,
		PhoneNumber:       payload.PhoneNumber,
		CallBackURL:       callbackURL,
		AccountReference:  "ShambaLoopAc",
		TransactionDesc:   payload.Purpose,
	}

	reqBody, _ := json.Marshal(stkReq)
	req, err := http.NewRequest("POST", SafaricomSandboxSTKURL, bytes.NewBuffer(reqBody))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Safaricom payload request"})
		return
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": fmt.Sprintf("Safaricom API connection error: %v", err)})
		return
	}
	defer resp.Body.Close()

	respBytes, _ := io.ReadAll(resp.Body)
	var responseMap map[string]interface{}
	json.Unmarshal(respBytes, &responseMap)

	c.JSON(resp.StatusCode, responseMap)
}

func getMpesaToken(key, secret string) (string, error) {
	req, err := http.NewRequest("GET", SafaricomSandboxAuthURL, nil)
	if err != nil {
		return "", err
	}

	req.SetBasicAuth(key, secret)
	req.Header.Set("Accept", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("unexpected status code generating token: %d", resp.StatusCode)
	}

	var d TokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&d); err != nil {
		return "", err
	}

	return d.AccessToken, nil
}

func logMpesaSimulation(payload MpesaSTKPayload) {
	// Print nice dashboard audits for system tracking in simulation mode
	fmt.Printf("[M-PESA SIMULATOR] STK Push Triggered Successfully!\n")
	fmt.Printf("Phone: %s | Amount: %v KES | Action Detail: %s\n", payload.PhoneNumber, payload.Amount, payload.Purpose)
}
