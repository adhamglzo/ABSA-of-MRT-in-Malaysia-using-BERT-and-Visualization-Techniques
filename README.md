# 🚇 Aspect-Based Sentiment Analysis (ABSA) for MRT Transit Reviews

## Project Title
**Aspect-Based Sentiment Analysis of Mass Rapid Transit in Malaysia using BERT and Visualization Techniques**

---

## 🎯 TLDR (Too Long; Didn't Read)

This project, a Final Year Project for the Big Data specialization, implements a custom **Aspect-Based Sentiment Analysis (ABSA)** pipeline. It analyzes public reviews from all Malaysian MRT stations to extract **specific aspects** (e.g., 'Cleanliness', 'Frequency', 'Service') and determine the corresponding **sentiment** (Positive, Neutral, Negative) for each one. This provides MRT transportation authorities with actionable, pinpointed insights far superior to traditional, document-level sentiment scoring.

---

## 💡 Problem Statement & Solution

### The Challenge
Traditional sentiment analysis (which classifies an entire review as simply Positive or Negative) is insufficient for complex public feedback. A review like *"The train was on time (Positive), but the platform was dirty (Negative)"* would be classified as Neutral, masking critical operational issues.

### The Solution: Aspect-Based Sentiment Analysis (ABSA)
This project solves this by classifying sentiment at the phrase level, linking specific opinions to specific service aspects. The system is designed to generate data that answers questions like:

* "What percentage of reviews for **KG06 Kota Damansara** mention the **'Cleanliness'** aspect?"
* "Of those reviews, what is the net sentiment (Positive vs. Negative) towards **'Service Staff'**?"

---

## ✨ Key Technical Features & Achievements

Developed as part of the Computer Science (Big Data Path) curriculum, this project demonstrates mastery in the following areas:

1.  **Dual-Task BERT Implementation:** The core of the system utilizes the **BERT (Bidirectional Encoder Representations from Transformers)** model, fine-tuned for two sequential NLP tasks:
    * **Aspect Term Extraction (ATE):** Automatically identifying the specific service aspects mentioned by the user in the raw text.
    * **Aspect Sentiment Classification (ASC):** Classifying the polarity (Positive, Neutral, Negative) toward the extracted aspects.

2.  **Real-World Data Engine:** Data was scraped and aggregated from all active MRT stations across the Klang Valley. This raw, unstructured data was subjected to a rigorous **data preprocessing pipeline** (tokenization, cleaning, and normalization) to create a structured dataset suitable for the BERT model.

3.  **Custom Dataset Training:** A synthetic/dummy dataset was created and labeled to validate the model architecture and train the initial ATE and ASC models before deployment on real-world reviews, ensuring model stability and interpretability.

4.  **Actionable Visualization Dashboard:** The final output is structured and visualized to be directly usable by transportation stakeholders. Visualizations focus on:
    * Aspect-level sentiment distribution.
    * Station-wise performance comparison.
    * Trend analysis of polarity over time for critical aspects.

---

## ⚙️ Project Architecture & Tech Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Model** | **BERT** (Hugging Face Transformers) | Foundation for advanced sequence labeling and text classification. |
| **Deep Learning Framework** | **Python** (`PyTorch`) | Used for model building, training, and inference. |
| **Data Processing** | `Pandas`, `NumPy`, `NLTK`, Custom Python Scripts | Handles data acquisition, cleaning, preprocessing, and feature engineering. |
| **Analysis Environment** | **Jupyter Notebooks** (`.ipynb`) | Used for iterative data exploration, model training, and reporting. |
| **Data Visualization** | `Matplotlib`, `Seaborn` | Generating comparative and segmented plots for the final results. |

---

## 🎓 Academic Context

This project was submitted in partial fulfillment of the requirements for the **Bachelor of Computer Science (Hons.)** degree, specializing in the **Big Data Path**, at **Universiti Teknologi MARA (UiTM) Jasin, Melaka**.

* **Student:** Adham Bin Mohd Sabki
* **Date:** July 2025

*(Note: If you have a separate folder for visualizations, you can add a section here like: "## 🖼️ Visualizations and Results" and include image links.)*
