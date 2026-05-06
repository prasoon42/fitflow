---

# 🚀 FitFlow Backend — AI Recommendation Engine

This is the core engine of **FitFlow**, powered by **FastAPI**, **YOLOv8**, and **Generative AI (Llama 3)**. It handles image processing, wardrobe management, and intelligent outfit scoring.

---

## 🤖 Generative AI Integration (The "Brain")

The FitFlow backend leverages **Large Language Models (Llama 3 via Groq)** to provide more than just numbers. It acts as a **Generative AI Fashion Consultant** that:

*   **Analyzes Outfits**: Evaluates the relationship between Top, Bottom, and Footwear using natural language.
*   **Explains Logic**: Generates human-like feedback on *why* an outfit works (e.g., "The blue and gray tones create a professional yet calming look").
*   **Identifies Issues**: Detects clashing styles or inappropriate items for an occasion (e.g., "Sneakers are too casual for a formal wedding").
*   **Suggests Improvements**: Recommends items from the user's *actual* wardrobe to fix a low-scoring look.

---

## 🛠️ Machine Learning Stack

*   **YOLOv8**: Real-time object detection for categorizing clothing uploads.
*   **OpenCV & K-Means**: Color extraction to identify primary hex codes of garments.
*   **Llama 3 (Groq API)**: The generative reasoning engine for fashion advice.
*   **Deterministic Scoring**: A weighted algorithm (100-point scale) used to evaluate Occasion Fit, Style, Combo, and Color Harmony.

---

## 🏗️ Architecture

```
backend/
├── main.py           # FastAPI Entry Point & App Configuration
├── auth.py           # JWT Authentication Logic
├── db.py             # MongoDB connection & schemas
├── ml/               # Core Machine Learning logic
│   ├── recommender.py # Scoring Engine & Groq Integration
│   └── occasion_rules.py # Predefined fashion constraints
├── routes/           # API Endpoint controllers (Wardrobe, Auth, etc.)
└── services/         # Third-party integrations (Cloudinary, SerpAPI)
```

---

## ⚙️ Setup Instructions

1.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
2.  **Environment Variables**:
    Create a `.env` file with the following:
    ```env
    MONGO_URI=your_uri
    CLOUDINARY_URL=your_url
    GROQ_API_KEY=your_key
    SERP_API_KEY=your_key
    JWT_SECRET=your_secret
    ```
3.  **Run Server**:
    ```bash
    uvicorn main:app --reload
    ```

---

## 🧮 Scoring Breakdown (100 Points)

*   **Occasion Fit**: 50 Points
*   **Style Compatibility**: 20 Points
*   **Outfit Combination**: 15 Points
*   **Color Harmony**: 15 Points

*Scores are normalized to a 10-point scale for the frontend.*
