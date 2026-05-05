---

# 👔 FitFlow — AI Virtual Wardrobe Stylist

FitFlow is a professional-grade **AI-powered personal stylist** and wardrobe management system. It digitizes your clothing collection using Computer Vision and provides intelligent, rule-based outfit recommendations for any occasion.

By combining **YOLOv8** for object detection and **LLMs (Llama 3)** for fashion reasoning, FitFlow helps users maximize their current wardrobe, track laundry cycles, and fill style gaps with integrated shopping suggestions.

---

## 🚀 Key Features

*   📸 **AI Wardrobe Digitization**: 
    *   Automatic garment detection (Top, Bottom, Shoes, etc.) via **YOLOv8**.
    *   Precision color extraction using K-Means clustering.
    *   Automated background removal for a clean "catalog" look.
*   🧥 **Intelligent Outfit Builder**: 
    *   **AI Recommendations**: Generates full looks based on 6+ occasions (Formal, Office, Gym, Travel, etc.).
    *   **Strict Scoring Engine**: A deterministic 100-point logic evaluating Fit, Style, Combination, and Color Harmony.
    *   **Natural Language Feedback**: Detailed "Why this works" explanations and style improvement tips.
*   🧼 **Smart Laundry Tracker**: 
    *   Track "Days since washed" for every item.
    *   Real-time status updates (Available vs. In Laundry).
    *   "Return from Laundry" quick-actions directly from the wardrobe.
*   🛍️ **Integrated Shopping**: 
    *   Detects missing pieces in a suggested look.
    *   Provides real-time "Buy Now" links from Google Shopping (via SerpAPI).
*   ❤️ **Favourites**: Save and name your best looks for instant access.

---

## 🧠 Tech Stack

### **Frontend**
*   **React.js (Vite)**: High-performance single-page architecture.
*   **Vanilla CSS**: Custom "Glassmorphism" design system with smooth animations.
*   **Context API**: Global state management for Wardrobe, Laundry, and Auth.

### **Backend & AI**
*   **FastAPI (Python)**: High-speed asynchronous API orchestrator.
*   **YOLOv8**: Real-time object detection for clothing categorization.
*   **Groq (Llama 3 70B)**: Large Language Model for fashion reasoning and natural language feedback.
*   **OpenCV**: Image processing and K-Means color clustering.

### **Data & Storage**
*   **MongoDB Atlas**: Scalable NoSQL storage for wardrobe items and outfits.
*   **Cloudinary**: Automated cloud image hosting and optimization.

---

## 🧮 The Scoring Engine (100-Point Logic)

FitFlow uses a professional weighted scoring system to evaluate outfits:

1.  **Occasion Fit (50 pts)**: Strict adherence to situational dress codes (e.g., No sneakers for Formal).
2.  **Style Compatibility (20 pts)**: Matching stylistic "vibes" (e.g., Business vs. Casual).
3.  **Outfit Combination (15 pts)**: Evaluation of standard garment pairings.
4.  **Color Harmony (15 pts)**: Complementary and analogous color matching.

*Final scores are displayed out of 10 in the UI for a clean, modern user experience (e.g., 8.5/10).*

---

## 📦 Project Structure

```
fitflow/
├── frontend/             # React App (Vite + Vanilla CSS)
│   ├── src/components/   # Wardrobe, OutfitBuilder, Laundry, etc.
│   └── src/context/      # Global state (WardrobeContext)
├── backend/              # FastAPI Application
│   ├── main.py           # API Entry Point
│   ├── ml/               # AI Engine (YOLO & Recommender logic)
│   ├── routes/           # API Endpoints
│   └── services/         # Image & Cloudinary services
└── README.md
```

---

## ⚙️ Setup & Installation

### **1. Clone & Install**
```bash
git clone https://github.com/your-username/fitflow.git
cd fitflow
```

### **2. Backend Setup**
```bash
cd backend
pip install -r requirements.txt
# Create .env with MONGO_URI, CLOUDINARY_URL, GROQ_API_KEY, SERP_API_KEY
uvicorn main:app --reload
```

### **3. Frontend Setup**
```bash
cd frontend
npm install
# Set VITE_API_BASE_URL in .env
npm run dev
```

---

## 🤝 Contributing
Contributions are welcome! If you'd like to improve the scoring logic or add new AI models, please open an issue or submit a pull request.

## 📄 License
This project is licensed under the MIT License.

---

*FitFlow — Redefining personal style through the fusion of Computer Vision and Generative AI.*
