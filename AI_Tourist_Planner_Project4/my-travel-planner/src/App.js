import React, { useState } from 'react';
import jsPDF from 'jspdf';
import './App.css';

function App() {
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    budget: '',
    days: '',
    travelers: 1
  });
  const [tripPlan, setTripPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Budget Validation
  const validateInputs = () => {
    if (!formData.from || !formData.to || !formData.budget || !formData.days) {
      setError("⚠️ Please fill in all fields!");
      return false;
    }
    const minRequired = 50 * parseInt(formData.days);
    if (parseInt(formData.budget) < minRequired) {
      setError(`⚠️ Budget too low! You need at least $${minRequired} for ${formData.days} days.`);
      return false;
    }
    return true;
  };

  const planTrip = async () => {
    if (!validateInputs()) return;
    
    setLoading(true);
    setError(null);

    // PASTE YOUR KEY HERE
    const API_KEY = "AIzaSyB88zC7f55UaHY4syFihoY3_5scUjS-4wE"; 
    
    // Updated 2026 Endpoint (Gemini 3.1 Flash-Lite is the most stable for free tier)
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${API_KEY}`;

    const prompt = `Act as an AI Travel Guide. Plan a trip from ${formData.from} to ${formData.to} for ${formData.days} days with a total budget of $${formData.budget}. 
    Return ONLY a JSON object: {
      "transport": {"type": "string", "cost": "string"},
      "hotels": [{"name": "string", "price": "string"}],
      "itinerary": [{"day": 1, "plan": "string"}],
      "attractions": [{"name": "string", "fee": "string", "desc": "string"}],
      "costSummary": {"total": "string"}
    }`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      const textResponse = data.candidates[0].content.parts[0].text;
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        setTripPlan(JSON.parse(jsonMatch[0]));
      } else {
        throw new Error("Invalid AI response. Please try again.");
      }

    } catch (err) {
      console.error("Error:", err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Missing Download PDF Function
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Travel Plan: ${formData.to}`, 10, 20);
    
    doc.setFontSize(12);
    doc.text(`From: ${formData.from}`, 10, 30);
    doc.text(`Duration: ${formData.days} Days`, 10, 40);
    doc.text(`Budget: $${formData.budget}`, 10, 50);

    let y = 70;
    doc.text("Itinerary:", 10, y);
    y += 10;

    tripPlan.itinerary.forEach((item) => {
      doc.text(`Day ${item.day}: ${item.plan.substring(0, 80)}...`, 10, y);
      y += 10;
      if (y > 280) { doc.addPage(); y = 20; }
    });

    doc.save(`Trip_to_${formData.to}.pdf`);
  };

  return (
    <div className="App">
      <header className="hero">
        <h1>🌍 AI Tourist Planner</h1>
        <p>Plan your dream trip in seconds</p>
        <div className="input-group">
          <input type="text" placeholder="Starting City" onChange={(e) => setFormData({...formData, from: e.target.value})} />
          <input type="text" placeholder="Destination" onChange={(e) => setFormData({...formData, to: e.target.value})} />
          <input type="number" placeholder="Budget ($)" onChange={(e) => setFormData({...formData, budget: e.target.value})} />
          <input type="number" placeholder="Days" onChange={(e) => setFormData({...formData, days: e.target.value})} />
          <button onClick={planTrip} disabled={loading}>{loading ? "Generating..." : "Plan Trip"}</button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {tripPlan && (
        <main className="results-area">
          <div className="summary-header">
            <h2>Your Trip to {formData.to}</h2>
            <button className="download-btn" onClick={downloadPDF}>📥 Download PDF Plan</button>
          </div>

          <section className="itinerary-section">
            <h3>📅 Day-Wise Itinerary</h3>
            {tripPlan.itinerary.map((d) => (
              <div key={d.day} className="day-card">
                <strong>Day {d.day}</strong>: {d.plan}
              </div>
            ))}
          </section>

          <section className="attractions-section">
            <h3>📍 Top Attractions</h3>
            <div className="attr-grid">
              {tripPlan.attractions.map((a, i) => (
                <div key={i} className="attr-card">
                  <img src={`https://images.unsplash.com/photo-1500624238510-0929944c9f18?auto=format&fit=crop&w=400&q=80&sig=${i}`} alt={a.name} />
                  <div className="attr-info">
                    <h4>{a.name}</h4>
                    <p>{a.desc}</p>
                    <span className="fee">Entry: {a.fee}</span>
                    <button className="map-btn" onClick={() => window.open(`https://www.google.com/maps/search/${a.name}+${formData.to}`)}>View Map</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

export default App;