---

# 👔 FitFlow — AI Virtual Wardrobe Stylist

FitFlow is an **AI-powered virtual wardrobe assistant** that digitizes your clothing collection and generates intelligent outfit recommendations based on **fashion rules, color theory, and occasion context**.

It transforms raw clothing images into structured fashion data and uses a scoring engine to build optimized outfits—reducing decision fatigue and improving daily styling.

---

## 🚀 Features

* 📸 **Smart Clothing Detection**

  * Upload an image → Automatically detects clothing type using YOLOv8

* 🎨 **Color Extraction**

  * Extracts dominant color using OpenCV + KMeans

* 🧥 **Digital Wardrobe**

  * Stores all clothing items with metadata (type, color, image)

* 👗 **AI Outfit Recommendations**

  * Generates outfits based on:

    * Occasion (Office, Casual, Party)
    * Color harmony
    * Style compatibility

* 🛍️ **Shopping Suggestions**

  * Detects missing wardrobe items
  * Fetches real-time product suggestions using SerpApi

* 🧼 **Background Removal**

  * Clean clothing cutouts via Remove.bg API

---

## 🏗️ Architecture Overview

```
Frontend (React + Vite)
        ↓
Backend API (FastAPI)
        ↓
ML Layer (YOLOv8 + OpenCV)
        ↓
Storage (MongoDB + Cloudinary)
        ↓
External APIs (Remove.bg + SerpApi)
```

---

## 🧠 Tech Stack

### Frontend

* React.js
* Vite
* Vanilla CSS

### Backend

* Python
* FastAPI

### Machine Learning

* YOLOv8 (Object Detection)
* OpenCV (Image Processing)
* KMeans Clustering (Color Extraction)

### Database & Storage

* MongoDB Atlas
* Cloudinary

### Integrations

* Remove.bg API
* SerpApi (Google Shopping)

---

## 🔄 How It Works

### 1. Authentication

* Secure login using JWT tokens

### 2. Upload Clothing Item

* Image is uploaded
* Background removed (Remove.bg)
* YOLO detects clothing type
* OpenCV extracts dominant color
* Image stored in Cloudinary
* Metadata saved in MongoDB

### 3. Outfit Recommendation

* User selects occasion
* Backend generates combinations
* Applies scoring rules
* Returns best outfit

### 4. Shopping Suggestions

* Missing items detected
* SerpApi fetches real products

---

## 🧮 Scoring Engine (Core Logic)

Outfits are ranked using a weighted scoring system:

```
Score = 
  w1 * color_match +
  w2 * occasion_fit +
  w3 * style_alignment +
  w4 * user_preference
```

### Factors Considered:

* Color harmony (complementary / analogous)
* Occasion compatibility
* Style consistency (formal vs casual)
* Clothing hierarchy

---

## 📦 Project Structure

```
fitflow/
│
├── frontend/          # React App
├── backend/
│   ├── main.py        # FastAPI entry point
│   ├── routes/        # API endpoints
│   ├── models/        # ML models
│   ├── services/      # Business logic
│   └── recommender.py # Outfit scoring engine
│
├── database/          # MongoDB schemas
├── utils/             # Image processing helpers
└── README.md
```

---

## ⚙️ Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/your-username/fitflow.git
cd fitflow
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Environment Variables

Create a `.env` file in backend:

```
MONGO_URI=your_mongodb_uri
CLOUDINARY_URL=your_cloudinary_url
REMOVE_BG_API_KEY=your_key
SERP_API_KEY=your_key
JWT_SECRET=your_secret
```

---

## 📈 Future Improvements

* 🔍 Personalized recommendations (user preference learning)
* 🧠 Deep learning-based outfit ranking
* 🌦️ Weather-based outfit suggestions
* ⚡ Redis caching for faster recommendations
* 📱 Mobile app version

---

## 🧪 Challenges Faced

* Accurate clothing detection on real-world messy images
* Extracting consistent colors under different lighting
* Designing a scalable outfit scoring system
* Handling asynchronous image processing efficiently

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo
2. Create your feature branch
3. Commit your changes
4. Open a pull request

---

## 📄 License

This project is licensed under the MIT License.

---

## ⭐ Final Note

FitFlow is not just a wardrobe app—it is a **fusion of computer vision, recommendation systems, and modern web engineering** aimed at redefining how users interact with their clothing.

---

