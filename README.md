# 🧬 BioSynth Designer

**BioSynth Designer** is a modern React-based application that allows users to design DNA nanostructures and organoids, visualize them in 3D, and perform CRISPR-Cas9 targeting to find PAM sites and suggest gRNA sequences.

---

## 🌟 Features

- 🔧 Add & manage synthetic DNA elements (Gene, Promoter, Terminator, etc.)
- 🎯 CRISPR Tool: Detect NGG PAM sites & generate gRNA sequences
- 🧠 AI-Driven gRNA suggestion using LLM (Gemini API integration)
- 🧬 3D visualization of DNA nanostructures and organoids (Three.js + OrbitControls)
- 📦 Export design to FASTA, GenBank, SBOL, and STL formats

---

## 📸 Preview

![App Screenshot](https://user-images.githubusercontent.com/your-/your-screenshot.png)  

---

## 🛠️ Tech Stack

- **Frontend:** React.js, Tailwind CSS
- **3D Graphics:** Three.js, OrbitControls
- **CRISPR Analysis:** Google Gemini Pro API
- **Export Formats:** FASTA, GenBank, SBOL, STL

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Likhitha599/BioSynth-Designer.git
cd BioSynth-Designer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm start
```

---

## 🔑 Environment Variables

You need a Gemini API key to use CRISPR LLM features.

Create a `.env` file in the root and add:

```env
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🧪 Example CRISPR Input

```
ATGCGTAGCTAGCGTACGGTAGCTAGGCTAGCTAGGCTA
```

---

## 📄 License

MIT License © 2025 [Likhitha599](https://github.com/Likhitha599)
