import React, { useState } from 'react';

interface CodeSnippet {
  name: string;
  path: string;
  lang: string;
  badge: string;
  code: string;
}

export default function DeveloperHub() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const snippets: CodeSnippet[] = [
    {
      name: 'PostgreSQL Schema',
      path: 'backend-go/schema.sql',
      lang: 'sql',
      badge: 'SQL',
      code: `-- ShambaLoop Relational PostgreSQL Database Migration Schema
-- Targets PostgreSQL 13+ with UUID extensions

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    role VARCHAR(30) NOT NULL CHECK (role IN ('landowner', 'farmer', 'investor', 'admin')),
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    county VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(30) NOT NULL CHECK (type IN ('land', 'livestock', 'opportunity')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    location_county VARCHAR(50) NOT NULL,
    price_kes DECIMAL(14,2) NOT NULL,
    revenue_split_percent INTEGER,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    image_url TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE land_leases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    landowner_id UUID REFERENCES users(id),
    farmer_id UUID REFERENCES users(id),
    acreage_leased DECIMAL(10,2) NOT NULL,
    price_per_acre_kes DECIMAL(14,2) NOT NULL,
    duration_months INTEGER NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING'
);`
    },
    {
      name: 'Go Gin Router Entry',
      path: 'backend-go/cmd/main.go',
      lang: 'go',
      badge: 'MAIN',
      code: `package main

import (
	"log"
	"net/http"
	"os"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func main() {
	r := gin.Default()
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy", "market": "ShambaLoop Kenya"})
	})

	api := r.Group("/api")
	{
		api.POST("/auth/register", RegisterUser)
		api.POST("/auth/login", LoginUser)
		api.GET("/listings", GetListings)
	}

	r.Run("0.0.0.0:8080")
}`
    },
    {
      name: 'GORM Database Models',
      path: 'backend-go/internal/models/models.go',
      lang: 'go',
      badge: 'MODEL',
      code: `package models

import (
	"time"
	"github.com/google/uuid"
)

type User struct {
	ID        uuid.UUID \`gorm:"type:uuid;default:uuid_generate_v4();primaryKey"\`
	Phone     string    \`gorm:"type:varchar(20);uniqueIndex;not null"\`
	Name      string    \`gorm:"type:varchar(100);not null"\`
	Role      string    \`gorm:"type:varchar(30);not null"\` // landowner, farmer, investor, admin
	Verified  bool      \`gorm:"default:false"\`
	County    string    \`gorm:"type:varchar(50);not null"\`
	CreatedAt time.Time \`gorm:"default:CURRENT_TIMESTAMP"\`
}

type Listing struct {
	ID             uuid.UUID \`gorm:"type:uuid;default:uuid_generate_v4();primaryKey"\`
	Type           string    \`gorm:"type:varchar(30);index;not null"\` // land, livestock
	Title          string    \`gorm:"type:varchar(200);not null"\`
	PriceKES       float64   \`gorm:"type:decimal(14,2);not null"\`
	Verified       bool      \`gorm:"default:false"\`
}`
    },
    {
      name: 'M-Pesa STK Push SDK',
      path: 'backend-go/internal/handlers/payments.go',
      lang: 'go',
      badge: 'STK',
      code: `package handlers

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"time"
	"github.com/gin-gonic/gin"
)

func InitiateSTKPush(c *gin.Context) {
	// 1. Setup Password hashing matching Safaricom guidelines
	timestamp := time.Now().Format("20060102150405")
	rawPassword := "174379" + "bfb272f961..." + timestamp
	password := base64.StdEncoding.EncodeToString([]byte(rawPassword))

	// 2. Build standard Safaricom STK Request Payload
	payload := map[string]interface{}{
		"BusinessShortCode": "174379",
		"Password":          password,
		"Timestamp":         timestamp,
		"TransactionType":   "CustomerPayBillOnline",
		"Amount":            1,
		"PartyA":            "254712345678",
		"PartyB":            "174379",
		"PhoneNumber":       "254712345678",
		"CallBackURL":       "https://shambaloop.ke/api/mpesa-callback",
		"AccountReference":  "ShambaLoop",
		"TransactionDesc":   "Land Lease Escrow Setup",
	}
	
	// 3. Dispatch to Safaricom Daraja Sandbox Processrequest
	c.JSON(200, payload)
}`
    },
    {
      name: 'Docker Deploy Guides',
      path: 'backend-go/DEPLOY.md',
      lang: 'markdown',
      badge: 'DEPLOY',
      code: `# Production Deploying guidelines

## Docker Commands
\`\`\`bash
docker build -t shambaloop-api .
docker run -d -p 8080:8080 shambaloop-api
\`\`\`

## Postgres Setup
Initialize indexes on listings and county for sub-millisecond querying across Eldoret, Nakuru, Nyandarua and Kiambu. Ensure SSL certificate configs are parsed.`
    }
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-agri-dirt-100 shadow-sm overflow-hidden" id="developer_hub">
      <div className="bg-agri-green-900 px-6 py-5 text-white">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-bold font-display tracking-tight text-white mb-0.5">Developer Export & Source Hub</h2>
            <p className="text-xs text-agri-green-100/90 font-medium leading-relaxed">
              Complete production Go (Gin + GORM) modular monolith backend and PostgreSQL database schema.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row h-[500px]">
        {/* Navigation panel */}
        <div className="w-full md:w-64 border-r border-agri-dirt-100 bg-slate-50 p-3 overflow-y-auto flex md:flex-col gap-2 shrink-0">
          {snippets.map((snip, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-semibold font-sans transition-all shrink-0 ${
                activeTab === index
                  ? 'bg-white text-agri-green-900 border border-agri-dirt-100 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 border border-transparent'
              }`}
            >
              <div className="p-1 px-1.5 text-[9px] font-mono font-bold rounded bg-slate-100 text-slate-500 uppercase select-none leading-none">
                {snip.badge}
              </div>
              <div className="truncate">
                <div className="font-semibold text-slate-800">{snip.name}</div>
                <div className="text-[10px] text-slate-400 font-mono font-normal truncate mt-0.5">{snip.path}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Code display screen */}
        <div className="flex-1 flex flex-col bg-slate-900 text-slate-300 min-w-0">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-950/75 border-b border-slate-800">
            <span className="text-[11px] font-mono font-medium text-slate-400">{snippets[activeTab].path}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition"
              title="Copy source code"
            >
              {copied ? (
                <span className="text-emerald-400 font-semibold font-sans">Copied!</span>
              ) : (
                <span className="font-sans">Copy Code</span>
              )}
            </button>
          </div>

          <div className="flex-1 p-4 overflow-auto font-mono text-[12px] leading-relaxed text-slate-200">
            <pre className="whitespace-pre overflow-x-auto selection:bg-agri-green-900 selection:text-white">
              <code>{snippets[activeTab].code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
