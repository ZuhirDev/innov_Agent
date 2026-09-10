# 🍀 Irish Business Grants AI Agent

An intelligent, automated assistant that finds, filters, and organizes energy and sustainability grants for businesses in Ireland.

---

## 🌟 What does it do?

Finding the right grant for a business can be a tedious process involving sifting through dozens of government websites, reading complex eligibility criteria, and dodging outdated information.

Our **Grants Agent** completely automates this research. Working quietly in the background, it:
* 🔎 **Discovers** new and active government grants.
* 🧹 **Filters out noise** (discards household grants, generic blogs, and non-Irish sources).
* 📝 **Translates legal jargon** into clear, plain-English summaries.
* 🔄 **Keeps the data fresh** by automatically updating our system with the latest opportunities.

---

## ⚙️ How it works (Step-by-Step)

You don't need a background in programming to understand how our agent works. Here is its exact workflow:

### 1. The Trigger
The process is kicked off automatically or by clicking a button. The agent is assigned specific topics to investigate, such as *"Ireland SEAI business energy grants"*.

### 2. Smart Search (Powered by Tavily)
Instead of using standard search engines that return millions of sponsored or irrelevant links, the agent uses **Tavily**—an AI search engine built for accurate research. 
> We restrict Tavily to **trusted, official Irish domains** (`seai.ie`, `gov.ie`, `enterprise-ireland.com`). This guarantees authentic government data.

### 3. The AI Brain (Filtering)
Once search results are gathered, the AI reads through every page and applies strict business rules:
* 🇮🇪 **Is it for Ireland?** *(Discards UK or generic European programs)*
* 🏢 **Is it for businesses?** *(Discards residential/household subsidies)*
* 🏛️ **Is it official?** *(Discards unverified blogs and third-party sites)*

### 4. Plain-English Summaries
Government websites are full of technical jargon. For every valid grant found, the agent writes a concise summary highlighting:
* What the grant covers.
* Who is eligible.
* A direct link to the official application page.

### 5. Safe Database Refresh
To ensure users never see expired or duplicate entries, the agent wipes outdated entries in PostgreSQL and replaces them with the freshly validated list inside a secure transaction.

---

## 🚀 The Final Result

When a business owner or administrator opens the application, they are instantly greeted with a clean, up-to-date list of **Active Grants**—complete with clear eligibility criteria and direct application links.