export default function PreferencesPanel({ preferences, onChange }) {
  function set(patch) {
    onChange({ ...preferences, ...patch });
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div>
        <label className="field-label">Session length</label>
        <select
          className="field-input"
          value={preferences.sessionLength}
          onChange={(e) => set({ sessionLength: parseInt(e.target.value, 10) })}
        >
          {[30, 45, 60, 90, 120].map((m) => (
            <option key={m} value={m}>
              {m} min
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label">Max hours / day</label>
        <input
          type="number"
          min="0.5"
          step="0.5"
          className="field-input"
          value={preferences.dailyMaxHours}
          onChange={(e) => set({ dailyMaxHours: parseFloat(e.target.value) || 0 })}
        />
      </div>
      <div>
        <label className="field-label">Term start</label>
        <input
          type="date"
          className="field-input"
          value={preferences.startDate}
          onChange={(e) => set({ startDate: e.target.value })}
        />
      </div>
      <div>
        <label className="field-label">Term end</label>
        <input
          type="date"
          className="field-input"
          value={preferences.endDate}
          onChange={(e) => set({ endDate: e.target.value })}
        />
      </div>
    </div>
  );
}
