<div align="center">

# 🍽️ BiteAid

**The first context-aware food AI that adapts to your life**

**Eat Now, Fix Later**

[![Try BiteAid](https://img.shields.io/badge/Try-BiteAid-emerald?style=for-the-badge)](https://ai.studio/apps/drive/1HMaj_lwAOwnCdfhxL97YWNTs38mNX0dv)

</div>

---

## 🎯 The Problem

**Students eat first, regret later.**

You're hungry. You're stressed. You grab whatever looks good.

Then 90 minutes later:
- **Crash during your exam** — that fried lunch hit at exactly the wrong time
- **Can't sleep at 2am** — the late-night pizza is still digesting
- **Sluggish at the gym** — heavy meal killed your workout

**You knew it was a bad idea. You ate it anyway.**

Because in the moment, you didn't know:
- *When* the crash would hit
- *How bad* it would affect your exam/sleep/workout
- *What to do differently* to minimize the damage

**The harm is done. The regret is real.**

Current food apps tell you "this is unhealthy" — yeah, no shit. But they don't tell you:
- How to eat it smarter
- How to reduce the harm
- How to time it better for your life

**That's the gap BiteAid fills.**

---

## 💡 The Solution

**BiteAid doesn't judge you. It helps you.**

Already decided to eat that burger? Cool. Here's how to **minimize the damage**:

### How it works:

**1. Upload a photo** of what you're about to eat

**2. (Optional) Tell us what's happening:**
   - "exam in 2 hours"
   - "late night study session"
   - "about to hit the gym"
   - Or use voice input 🎤

**3. Get harm reduction advice:**
   - **DO THIS:** "Eat protein first, drink water, skip the fries"
   - **SKIP THIS:** "Don't finish all the bread — crash risk"
   - **TIMELINE:** "You'll crash at 1.5h — right when your exam starts"
   - **QUICK FIXES:** Actions you can take right now to reduce harm

**Eat now. Fix later. Live smarter.**

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
Harm reduction: "Eat chicken only, drink 500ml water"
```

#### Context: "Late night study session"
```
🌙 LATE NIGHT MODE
Timeline: 4 hours
Advice: "Eat only 2/3, pair with herbal tea"
Focus: Sleep quality + sustained energy
Warning: "Heavy meal delays sleep by 90min"
Harm reduction: "Skip rice, keep protein, finish by 10pm"
```

#### Context: "Pre-workout in 30min"
```
💪 WORKOUT MODE
Timeline: 1 hour
Advice: "Timing mismatch — eat AFTER gym"
Issue: Meal needs 45min to digest
Alternative: "Light snack now, this meal post-workout"
Harm reduction: "If you eat now, skip fries, wait 45min before gym"
```

#### No context given
```
📊 DEFAULT MODE
Timeline: 6 hours
Advice: General harm reduction
Standard energy projection
Impact: "Moderate — manageable if you follow DO/SKIP"
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
- Exam mode: Brain fuel optimization + crash prevention
- Late night: Sleep quality + sustained energy balance
- Workout: Performance timing + recovery optimization
- Meeting: Social performance (no bloating, alertness)

### 4. **Real-time Processing**
- Gemini Flash: Image analysis <500ms
- Gemini Pro: Extended thinking for harm reduction strategy
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
│ • Pro: Extended thinking (harm reduction)   │
│ • Mode detection from context               │
└─────────────────┬───────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│ Context-Aware Analysis                      │
│ • Adaptive timeline (2h/4h/6h)              │
│ • Mode-specific harm reduction              │
│ • Crash prediction + prevention             │
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
| **Harm reduction focus** | ✅ | ❌ | ❌ | ❌ |
| **Adaptive timeline** | ✅ | ❌ | ❌ | ❌ |
| **Crash prediction** | ✅ | ❌ | ❌ | ❌ |
| **Voice input** | ✅ | ❌ | ❌ | ❌ |
| **Extended thinking** | ✅ | ❌ | ❌ | ❌ |
| **Privacy-first (no accounts)** | ✅ | ❌ | ❌ | ❌ |
| **Zero data storage** | ✅ | ❌ | ❌ | ❌ |
| **Non-judgmental** | ✅ | ❌ | ❌ | ❌ |
| **Free** | ✅ | ❌ (paid) | ✅ | ❌ |

**BiteAid is the only food app focused on harm reduction, not judgment.**

---

## 📊 Use Cases

### 👨‍🎓 Students
- **Before exams:** Prevent crashes, optimize focus timing
- **Late night study:** Balance energy + sleep quality
- **Between classes:** Quick harm reduction via voice input
- **Dining hall:** Make smarter choices when options are limited

### 💼 Professionals
- **Before meetings:** Avoid bloating, maintain alertness
- **Lunch breaks:** Context-aware harm reduction
- **Business dinners:** Social performance optimization
- **Travel:** Quick analysis in unfamiliar restaurants

### 🏋️ Athletes
- **Pre-workout:** Timing optimization, avoid sluggishness
- **Post-workout:** Recovery fuel analysis
- **Competition prep:** Performance-focused harm reduction
- **Training nutrition:** Understand meal timing impact

### 🌙 Night Workers
- **Shift work:** Sleep-aware meal analysis
- **Energy management:** Sustained focus without crashes
- **Circadian rhythm:** Context-aware timing advice
- **Late eating:** Minimize sleep disruption

---

## 🔒 Privacy First

**What we DON'T do:**
- ❌ No user accounts required
- ❌ No data storage (everything session-based)
- ❌ No tracking or analytics
- ❌ No selling your data
- ❌ No email collection
- ❌ No judgment or shame

**Your meal photos are:**
- Analyzed in real-time
- Deleted immediately after analysis
- Never stored on our servers
- Never used for training

**We don't track what you eat. We don't judge what you eat. We just help you eat it smarter.**

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
- **Text input:** Type naturally ("exam tmrw morning", "pulling all nighter")
- **Voice input:** 🎤 Tap to speak (hands-free)
- **Quick options:** One-tap presets (Exam / Late Night / Workout / Meeting)
- **Optional:** Works perfectly in default mode too
- **Messy input handling:** AI interprets casual language

### Adaptive Analysis
- **Smart mode detection:** AI interprets your situation
- **Timeline adjustment:** 1h, 2h, 4h, or 6h based on context
- **Harm reduction focus:** Minimize damage, not prevent eating
- **Crash prediction:** When and why energy drops
- **Quick fixes:** Actionable steps to reduce harm

### Visual Feedback
- **Context badge:** Photo shows detected mode instantly
- **Color coding:** Emerald (good), Rose (bad), Blue (info)
- **Confidence indicators:** Know when AI is uncertain
- **Impact scoring:** LOW/MODERATE/HIGH harm levels
- **Interactive items:** Tap to simulate removing ingredients

### Simulation
- **"What if" scenarios:** Remove items, see impact changes
- **Trade-off analysis:** Understand nutritional consequences
- **Smart suggestions:** AI recommends alternatives
- **Quick decisions:** 5-second scannable results
- **Harm comparison:** Current meal vs modified version

---

## 🧠 How It Works (Technical Deep Dive)

### Context Detection Algorithm
```
User input: "got midterms tmrw need to cram tonight"

AI interprets:
→ Situation: Exam (tomorrow) + Late night study (tonight)
→ Urgency: HIGH (keywords: "need to", "cram")
→ Time sensitivity: ~12-16 hours
→ Primary concern: Sustained focus + sleep quality
→ Mode selected: LATE NIGHT (eating NOW for tonight)

Adaptive prompt adjustments:
→ Timeline: 4 hours (covers study session)
→ Focus metrics: Energy sustainability, sleep impact
→ Warnings: Bedtime timing, morning grogginess
→ Harm reduction: Balance energy vs sleep quality
```

### Extended Thinking in Action

For exam mode harm reduction:
```
Standard AI: "This meal has protein and carbs"

Gemini 3 Extended Thinking:
1. Detected: Fried chicken (high fat), white rice (high GI)
2. Absorption timeline: Fat = 60-90min, carbs = 30-45min
3. Energy peak calculation: +45min (carb spike)
4. Crash prediction: +90min (insulin response + fat digestion)
5. Exam timing: 2 hours = 120min from now
6. Delta analysis: Peak at 45min, crash at 90min, exam at 120min
7. Harm assessment: "Crash 30min before exam — critical timing issue"
8. Reduction strategy: "Remove rice (delay crash), keep protein (stability), add water (dilution)"

Result: Context-aware harm reduction, not generic advice
```

### Adaptive Timeline Generation
```javascript
// Exam in 2h → Generate 5 points, focus on crash timing
timeline = [
  { time: "now", energy: 80, harm: "Starting point" },
  { time: "+30min", energy: 95, harm: "Peak focus - good" },
  { time: "+1h", energy: 75, harm: "Starting decline" },
  { time: "+1.5h", energy: 60, harm: "⚠️ Crash zone" },
  { time: "+2h (EXAM)", energy: 55, harm: "❌ Below optimal - CRITICAL" }
]

Harm reduction advice:
→ "Skip rice to delay crash"
→ "Drink 500ml water to slow absorption"
→ "Keep banana as backup for +1.5h"

// Late night study → Generate 5 points over 4h, focus on sleep
timeline = [
  { time: "now", energy: 80, harm: "Heavy meal starting" },
  { time: "+1h", energy: 85, harm: "Good focus window" },
  { time: "+2h", energy: 80, harm: "Sustained - good" },
  { time: "+3h", energy: 70, harm: "Natural dip" },
  { time: "+4h", energy: 60, harm: "Sleep quality impacted if eating now" }
]

Harm reduction advice:
→ "Eat only 2/3 portion to reduce digestion load"
→ "Finish by 10pm for midnight sleep"
→ "Pair with green tea for alertness without sleep disruption"
```

---

## 🎓 Built With

- **React 19** — Latest React with concurrent features
- **TypeScript** — Type-safe development
- **Gemini 3 Flash** — Fast multimodal analysis
- **Gemini 3 Pro** — Extended thinking (harm reduction reasoning)
- **Tailwind CSS** — Utility-first styling
- **Vite** — Lightning-fast build tool
- **Lucide Icons** — Beautiful, consistent icons
- **Web Speech API** — Voice input

---

## 📈 Impact & Vision

### Current Impact
- **Target users:** 20M+ college students worldwide
- **Problem solved:** Meal regret → harm reduction intelligence
- **Unique value:** First context-aware harm reduction AI
- **Privacy stance:** Zero data collection, no judgment, pure help

### Future Vision
- **Personalization:** Learn preferences over sessions (opt-in only)
- **Multi-language:** Support 10+ languages
- **Offline mode:** Local model for privacy + speed
- **Wearable integration:** Apple Watch, Fitbit timing optimization
- **Group harm reduction:** Analyze meals for multiple people at once
- **Restaurant integration:** Real-time menu harm reduction

---

## 🏆 Why This Matters

### For Users
Bad meals happen. The harm compounds:
- Exam crash → Lower grade → GPA impact → Career consequences
- Poor sleep → Chronic fatigue → Mental health decline
- Wrong pre-workout fuel → Injury → Months of recovery

**BiteAid doesn't prevent bad meals. It reduces the harm when they happen.**

Because let's be real: you're eating that pizza.

The question is: **how do you eat it smarter?**

### For AI Research
Demonstrates:
- **Context-aware prompting** at scale
- **Extended thinking** for biological reasoning
- **Multimodal chaining** (vision + text + context)
- **Adaptive UX** based on AI interpretation
- **Harm reduction** as an AI application domain

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
- Everyone who eats first, regrets later (we see you)

---

## 📬 Contact & Feedback

- **Try it:** [BiteAid on AI Studio](https://ai.studio/apps/drive/1HMaj_lwAOwnCdfhxL97YWNTs38mNX0dv)
- **Issues:** Found a bug? Please report it
- **Suggestions:** Ideas for improvement? Let us know

---

<div align="center">

**Built with ❤️ using Gemini 3**

**Eat Now, Fix Later**

Privacy First • No Data Stored • No Judgment • No Tracking

[Try BiteAid](https://ai.studio/apps/drive/1HMaj_lwAOwnCdfhxL97YWNTs38mNX0dv)

</div>