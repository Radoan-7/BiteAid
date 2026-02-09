<div align="center">

# 🍽️ BiteAid

**The first context-aware food AI that adapts to your life**

Same meal. Different situation. Different advice.

Eat Now, Fix Later
</div>

---

## 🎯 The Problem

Students and young professionals face **decision paralysis** 3 times a day at meals.

Worse: **the same food affects you differently** based on when and why you're eating:
- Coffee before an exam ≠ coffee before sleep
- Heavy lunch before a workout ≠ heavy lunch on a lazy Sunday
- Fried rice at 12pm ≠ fried rice at 11pm

**Current food apps don't understand context.**

---

## 💡 The Solution

BiteAid analyzes your meal **AND** your situation.

### How it works:

**1. Upload a photo** of your meal

**2. (Optional) Tell us what's happening:**
   - "exam in 2 hours"
   - "late night study session"
   - "about to hit the gym"
   - Or use voice input 🎤

**3. Get context-aware advice:**
   - **DO THIS / SKIP THIS** adapted to your situation
   - **Adaptive timeline** showing when effects hit
   - **Warnings** about crashes at critical moments

---

## ✨ Context-Aware Intelligence

### Example: Same Meal, Different Context

**🍗 Meal:** Fried chicken, rice, fries

#### Context: "Exam in 2 hours"
```
📚 EXAM MODE
Timeline: 2 hours
Advice: "Focus on protein first, skip fries entirely"
Warning: "Sugar crash at 1.5h — right when exam starts"
Peak focus: +1h (too early for exam)
```

#### Context: "Late night study session"
```
🌙 LATE NIGHT MODE  
Timeline: 4 hours
Advice: "Eat only 2/3, pair with herbal tea"
Focus: Sleep quality + sustained energy
Warning: "Heavy meal delays sleep by 90min"
```

#### Context: "Pre-workout in 30min"
```
💪 WORKOUT MODE
Timeline: 1 hour
Advice: "Timing mismatch — eat AFTER gym"
Issue: Meal needs 45min to digest
Alternative: "Light snack now, this meal post-workout"
```

#### No context given
```
📊 DEFAULT MODE
Timeline: 6 hours
Advice: General harm reduction
Standard energy projection
```

**Same food. Different advice. Based on YOUR life.**

---

## 🔬 Why Gemini 3?

### 1. **Extended Thinking** (2048 tokens)
Complex biological reasoning:
- "How will this meal affect my focus in 2 hours?"
- "What's the crash timing relative to my exam?"
- "Sleep impact of eating heavy food at 10pm?"

### 2. **Multimodal Intelligence**
- **Vision:** Detect foods from photo
- **Text:** Understand messy context ("got test tmrw lol")
- **Structured output:** JSON schemas prevent hallucination

### 3. **Adaptive Prompting**
Different analysis per context:
- Exam mode: Brain fuel optimization
- Late night: Sleep quality + sustained energy
- Workout: Performance timing
- Meeting: Social performance (no bloating!)

### 4. **Real-time Processing**
- Gemini Flash: Image analysis <500ms
- Gemini Pro: Extended thinking for predictions
- Streaming: Results appear as they're generated

---

## 🏗️ Architecture
```
┌─────────────────────────────────────────────┐
│ User Input (Photo + Optional Context)       │
└─────────────────┬───────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│ React Frontend (TypeScript)                 │
│ • Upload handling                           │
│ • Voice input (Web Speech API)              │
│ • Context detection                         │
└─────────────────┬───────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│ Gemini 3 API                                │
│ • Flash: Image analysis (fast)              │
│ • Pro: Extended thinking (deep reasoning)   │
│ • Mode detection from context               │
└─────────────────┬───────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│ Context-Aware Analysis                      │
│ • Adaptive timeline (2h/4h/6h)              │
│ • Mode-specific advice                      │
│ • Structured JSON output                    │
└─────────────────┬───────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│ Dynamic UI Rendering                        │
│ • Context badge on photo                    │
│ • Adaptive DO/SKIP advice                   │
│ • Timeline graph (context-based points)     │
└─────────────────────────────────────────────┘
```

**Tech Stack:**
- React 19 + TypeScript
- Gemini 3 Flash (image analysis)
- Gemini 3 Pro (extended thinking)
- Web Speech API (voice input)
- Vite (build tool)

---

## 🆚 Comparison

| Feature | BiteAid | MyFitnessPal | Yuka | Nutritionix |
|---------|---------|--------------|------|-------------|
| **Context-aware analysis** | ✅ | ❌ | ❌ | ❌ |
| **Adaptive timeline** | ✅ | ❌ | ❌ | ❌ |
| **Voice input** | ✅ | ❌ | ❌ | ❌ |
| **Extended thinking** | ✅ | ❌ | ❌ | ❌ |
| **Privacy-first (no accounts)** | ✅ | ❌ | ❌ | ❌ |
| **Zero data storage** | ✅ | ❌ | ❌ | ❌ |
| **Free** | ✅ | ❌ (paid) | ✅ | ❌ |
| **Real-time processing** | ✅ | ❌ | ❌ | ❌ |

**BiteAid is the only food app that understands your life context.**

---

## 📊 Use Cases

### 👨‍🎓 Students
- Before exams: Optimize for focus, avoid crashes
- Late night study: Balance energy + sleep quality
- Between classes: Quick decisions with voice input

### 💼 Professionals
- Before meetings: Avoid bloating, maintain alertness
- Lunch breaks: Context-aware choices
- Travel: Quick analysis in unfamiliar restaurants

### 🏋️ Athletes
- Pre-workout: Timing optimization
- Post-workout: Recovery fuel analysis
- Competition prep: Performance-focused advice

### 🌙 Night Workers
- Shift work: Sleep-aware meal analysis
- Energy management: Sustained focus without crashes
- Circadian rhythm: Context-aware timing

---

## 🔒 Privacy First

**What we DON'T do:**
- ❌ No user accounts required
- ❌ No data storage (everything session-based)
- ❌ No tracking or analytics
- ❌ No selling your data
- ❌ No email collection

**Your meal photos are:**
- Analyzed in real-time
- Deleted immediately after analysis
- Never stored on our servers
- Never used for training

**Pure privacy. Pure AI. Pure help.**

---

## 🚀 Try It Now

### Live Demo
👉 **[Launch BiteAid](https://ai.studio/apps/drive/1HMaj_lwAOwnCdfhxL97YWNTs38mNX0dv)**

### Run Locally

**Prerequisites:** Node.js 18+
```bash
# 1. Clone or download this repository

# 2. Install dependencies
npm install

# 3. Set your Gemini API key
# Create .env.local file with:
# GEMINI_API_KEY=your_api_key_here

# 4. Run the app
npm run dev

# 5. Open http://localhost:5173
```

**Get a Gemini API key:** [Google AI Studio](https://aistudio.google.com/app/apikey)

---

## 🎨 Features in Detail

### Context Input
- **Text input:** Type naturally ("exam tmrw morning")
- **Voice input:** 🎤 Tap to speak
- **Quick options:** One-tap presets (Exam / Late Night / Workout / Meeting)
- **Optional:** Works perfectly in default mode too

### Adaptive Analysis
- **Smart mode detection:** AI interprets messy input
- **Timeline adjustment:** 1h, 2h, 4h, or 6h based on context
- **Advice customization:** DO/SKIP tailored to your goal
- **Impact prediction:** When crashes happen relative to your event

### Visual Feedback
- **Context badge:** Photo shows detected mode
- **Color coding:** Emerald (good), Rose (bad), Blue (info)
- **Confidence indicators:** Know when AI is uncertain
- **Interactive items:** Tap to simulate removing ingredients

### Simulation
- **"What if" scenarios:** Remove items, see impact
- **Trade-off analysis:** Understand nutritional changes
- **Smart suggestions:** AI recommends alternatives
- **Quick decisions:** 5-second scannable results

---

## 🧠 How It Works (Technical Deep Dive)

### Context Detection Algorithm
```
User input: "got midterms tmrw need to cram tonight"

AI interprets:
→ Situation: Exam (tomorrow) + Late night study (tonight)
→ Urgency: HIGH (keyword: "need to", "cram")
→ Time sensitivity: ~12-16 hours
→ Primary concern: Sustained focus + sleep quality
→ Mode selected: LATE NIGHT (since eating is NOW for tonight)

Adaptive prompt adjustments:
→ Timeline: 4 hours (covers study session)
→ Focus metrics: Energy sustainability, sleep impact
→ Warnings: Bedtime timing, morning grogginess
```

### Extended Thinking in Action

For exam mode analysis:
```
Standard AI: "This meal has protein and carbs"

Gemini 3 Extended Thinking:
1. Detected: Fried chicken (high fat), white rice (high GI)
2. Absorption timeline: Fat = 60-90min, carbs = 30-45min
3. Energy peak calculation: +45min (carb peak)
4. Crash prediction: +90min (insulin spike + fat digestion)
5. Exam timing: 2 hours = 120min
6. Delta analysis: Peak at 45min, crash at 90min, exam at 120min
7. Conclusion: "You'll crash 30min before exam — bad timing"
8. Recommendation: "Reduce carbs, increase protein stability"

Result: Context-aware, biologically-grounded advice
```

### Adaptive Timeline Generation
```javascript
// Exam in 2h → Generate 5 points
timeline = [
  { time: "now", energy: 80 },
  { time: "+30min", energy: 95, note: "Peak focus" },
  { time: "+1h", energy: 75, note: "Starting decline" },
  { time: "+1.5h", energy: 60, note: "Crash zone" },
  { time: "+2h (EXAM)", energy: 55, note: "Below optimal" }
]

// Late night study → Generate 5 points over 4h
timeline = [
  { time: "now", energy: 80 },
  { time: "+1h", energy: 85, note: "Good focus" },
  { time: "+2h", energy: 80, note: "Sustained" },
  { time: "+3h", energy: 70, note: "Moderate dip" },
  { time: "+4h", energy: 60, note: "Need break" }
]
```

---

## 🎓 Built With

- **React 19** — Latest React with concurrent features
- **TypeScript** — Type-safe development
- **Gemini 3 API** — Multimodal AI with extended thinking
- **Tailwind CSS** — Utility-first styling
- **Vite** — Lightning-fast build tool
- **Lucide Icons** — Beautiful, consistent icons

---

## 📈 Impact & Vision

### Current Impact
- **Target users:** 20M+ college students worldwide
- **Problem solved:** Daily decision paralysis (3x/day)
- **Unique value:** First context-aware food AI
- **Privacy stance:** Zero data collection, ethical AI

### Future Vision
- **Personalization:** Learn preferences over sessions (with user consent)
- **Multi-language:** Support 10+ languages
- **Offline mode:** Local model for privacy + speed
- **Wearable integration:** Apple Watch, Fitbit timing optimization
- **Group decisions:** Analyze meals for multiple people at once

---

## 🏆 Why This Matters

### For Users
Every meal is a decision. Bad decisions compound:
- Exam crash → Lower grade → GPA impact
- Poor sleep → Fatigue → Productivity loss
- Wrong pre-workout fuel → Injury risk

**BiteAid turns meals into strategic choices.**

### For AI Research
Demonstrates:
- **Context-aware prompting** at scale
- **Extended thinking** for biological reasoning
- **Multimodal chaining** (vision + text)
- **Adaptive UX** based on AI interpretation

**Pushes boundaries of what AI can do for daily decisions.**

---

## 📄 License

MIT License — Free to use, modify, and distribute.

---

## 🙏 Acknowledgments

Built for the **Gemini 3 Hackathon** (February 2026)

Special thanks to:
- Google AI team for Gemini 3 API
- Students who tested early versions
- The hackathon community for feedback

---

## 📬 Contact & Feedback

- **Try it:** [BiteAid on AI Studio](https://ai.studio/apps/drive/1HMaj_lwAOwnCdfhxL97YWNTs38mNX0dv)
- **Issues:** Found a bug? Please report it
- **Suggestions:** Ideas for improvement? Let us know

---

<div align="center">

**Built with ❤️ using Gemini 3**

Privacy First • No Data Stored • No Tracking

[Try BiteAid](https://ai.studio/apps/drive/1HMaj_lwAOwnCdfhxL97YWNTs38mNX0dv) • [View Code](#) • [Report Issue](#)

</div>