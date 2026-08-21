import React, { useState } from 'react';
import './App.css';

function App() {
  const [formData, setFormData] = useState({ 
    from: '', to: '', budget: '', days: '', travelers: 1, currency: 'INR' 
  });
  const [tripPlan, setTripPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const planTrip = async () => {
    if (!formData.from || !formData.to || !formData.budget) {
      setError("⚠️ Please fill in all fields!");
      return;
    }
    setLoading(true);
    setError(null);

    // Use environment variable for production/security
    const API_KEY = "AQ.Ab8RN6Io2OPxTt5OQw2XcE2wMrhqYe2CBv_RzZG1x3zkgrTICg";
    const MODEL = "gemini-1.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;    

    const prompt = `Act as a travel architect. Plan a trip from ${formData.from} to ${formData.to} for ${formData.days} days for ${formData.travelers} people. 
    Budget: ${formData.currency} ${formData.budget}.
    Return ONLY JSON: {
      "distance": "string",
      "transportOptions": [{"mode": "string", "time": "string", "costPerPerson": "string"}],
      "hotels": [{"name": "string", "pricePerNight": "string", "area": "string"}],
      "itinerary": [{"day": 1, "activities": ["activity 1", "activity 2"]}],
      "costBreakdown": {"perPerson": "string", "grandTotal": "string"},
      "travelTips": ["string"]
    }`;

    try {
       const response = await fetch(endpoint, {
       method: 'POST',
    headers: { 
    'Content-Type': 'application/json',
    'x-goog-api-key': API_KEY 
  },
  body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
})

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      const textResponse = data.candidates[0].content.parts[0].text;
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        setTripPlan(JSON.parse(jsonMatch[0]));
      } else {
        throw new Error("Invalid response format from AI.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection failed. Please check your API key or backend setup.");
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = (query) => {
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(mapUrl, '_blank');
  };

  return (
    <div className="App">
      <div className="container">
        <header className="main-header">
          <h1>✨ AI Voyager <span className="premium-tag">PREMIUM</span></h1>
          <p>Curated Travel Plans</p>
        </header>

        <div className="search-card">
          <div className="input-row">
            <input type="text" placeholder="From" onChange={(e)=>setFormData({...formData, from: e.target.value})}/>
            <span className="route-arrow">→</span>
            <input type="text" placeholder="To" onChange={(e)=>setFormData({...formData, to: e.target.value})}/>
          </div>
          
          <div className="params-grid">
            <div className="p-field"><label>Currency</label><select onChange={(e)=>setFormData({...formData, currency: e.target.value})}><option value="INR">INR (₹)</option><option value="USD">USD ($)</option></select></div>
            <div className="p-field"><label>Budget</label><input type="number" placeholder="Total" onChange={(e)=>setFormData({...formData, budget: e.target.value})}/></div>
            <div className="p-field"><label>Days</label><input type="number" placeholder="Qty" onChange={(e)=>setFormData({...formData, days: e.target.value})}/></div>
            <div className="p-field"><label>People</label><input type="number" placeholder="Qty" onChange={(e)=>setFormData({...formData, travelers: e.target.value})}/></div>
          </div>

          {error && <p className="error-msg" style={{color: '#ff4d4d', marginTop: '10px'}}>{error}</p>}

          <button className="cta-btn" onClick={planTrip} disabled={loading}>{loading ? "Mapping your journey..." : "Create Itinerary"}</button>
        </div>

        {tripPlan && (
          <div className="results-framer">
            <div className="dashboard-grid">
              <section className="card highlight-card">
                <h3>💰 Budget Summary</h3>
                <div className="cost-flex">
                  <div className="c-item"><span>Per Person</span><strong>{tripPlan.costBreakdown?.perPerson}</strong></div>
                  <div className="c-item"><span>Grand Total</span><strong className="total">{tripPlan.costBreakdown?.grandTotal}</strong></div>
                </div>
              </section>

              <section className="card">
                <h3>🚀 Transport ({tripPlan.distance})</h3>
                {tripPlan.transportOptions?.map((t, i) => (
                  <div key={i} className="list-row" onClick={() => openInMaps(`${t.mode} from ${formData.from} to ${formData.to}`)}>
                    <div><strong>{t.mode}</strong><p>{t.time} • {t.costPerPerson}/pp</p></div>
                    <span className="map-pill">🗺️ Map</span>
                  </div>
                ))}
              </section>
            </div>

            <section className="itinerary-card">
              <h3>📅 Daily Schedule</h3>
              <div className="itinerary-list">
                {tripPlan.itinerary?.map((d) => (
                  <div key={d.day} className="day-card">
                    <h4>Day {d.day}</h4>
                    <ul>{d.activities?.map((act, idx) => <li key={idx}>{act}</li>)}</ul>
                  </div>
                ))}
              </div>
            </section>

            <div className="dashboard-grid">
              <section className="card">
                <h3>🏨 Recommended Hotels</h3>
                {tripPlan.hotels?.map((h, i) => (
                  <div key={i} className="list-row" onClick={() => openInMaps(`${h.name} ${h.area} ${formData.to}`)}>
                    <div><strong>{h.name}</strong><p>{h.pricePerNight} • {h.area}</p></div>
                    <span className="map-pill">📍 Map</span>
                  </div>
                ))}
              </section>

              <section className="card tips-card">
                <h3>💡 Pro Tips</h3>
                <ul>{tripPlan.travelTips?.map((tip, i) => <li key={i}>{tip}</li>)}</ul>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;