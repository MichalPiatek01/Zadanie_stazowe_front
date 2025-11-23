import { useEffect, useState } from "react";
import Chart from "chart.js/auto";

export default function Home() {
    const [energyData, setEnergyData] = useState([]);
    const [charts, setCharts] = useState([]);
    const [hours, setHours] = useState(2);
    const [optimal, setOptimal] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchEnergyMix() {
            try {
                const res = await fetch("/api/energy/mix");
                if (!res.ok) {
                    throw new Error("Failed to fetch energy mix");
                }
                const data = await res.json();
                setEnergyData(data);
            } catch (err) {
                console.error("Error fetching mix: ", err);
                setError("Nie udało się pobrać miksu energetycznego.");
            }
        }
        fetchEnergyMix();
    }, []);

    useEffect(() => {
        charts.forEach((c) => c.destroy());
        const newCharts = [];

        energyData.forEach((dayData, index) => {
            const canvas = document.getElementById(`chart-${index}`);
            if (!canvas) return;

            const labels = Object.keys(dayData.averageFuelShare || {});
            const values = Object.values(dayData.averageFuelShare || {});

            const chart = new Chart(canvas, {
                type: "pie",
                data: {
                    labels,
                    datasets: [
                        {
                            data: values,
                            backgroundColor: [
                                "#4caf50",
                                "#9e9e9e",
                                "#2196f3",
                                "#ff9800",
                                "#f44336",
                                "#795548",
                                "#00bcd4",
                                "#ffc107",
                                "#8bc34a",
                            ],
                        },
                    ],
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: "bottom" },
                    },
                },
            });

            newCharts.push(chart);
        });

        setCharts(newCharts);
    }, [energyData]);

    async function getOptimalWindow() {
        setError("");
        setOptimal(null);

        try {
            const res = await fetch(`/api/energy/optimal-window?hours=${hours}`);

            if (!res.ok) {
                throw new Error("backend error");
            }

            const data = await res.json();
            setOptimal(data);
        } catch (err) {
            console.error("Error fetching optimal window: ", err);
            setError("Nie udało się pobrać najlepszego okna ładowania.");
        }
    }

    function formatDate(ts) {
        const d = new Date(ts);
        return d.toLocaleString("pl-PL", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    }

    return (
        <div style={{ padding: "20px", maxWidth: "950px", margin: "auto" }}>
            <h1>Energia — Podsumowanie</h1>

            <h2>Miks energetyczny</h2>

            {error && (
                <p style={{ color: "red" }}>
                    {error}
                </p>
            )}

            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                {energyData.map((dayData, index) => (
                    <div key={index} style={{ width: "300px", textAlign: "center" }}>
                        <h3>{dayData.date}</h3>
                        <p>
                            Czysta energia:{" "}
                            <strong>{dayData.cleanEnergyShare.toFixed(1)}%</strong>
                        </p>
                        <canvas id={`chart-${index}`} width="300" height="300" />
                    </div>
                ))}
            </div>

            <h2 style={{ marginTop: "40px" }}>Optymalne okno ładowania</h2>

            <label>
                Czas ładowania (1–6 godzin):{" "}
                <select
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                >
                    {[1, 2, 3, 4, 5, 6].map((h) => (
                        <option key={h} value={h}>
                            {h} h
                        </option>
                    ))}
                </select>
            </label>

            <button
                style={{
                    marginLeft: "10px",
                    padding: "8px 12px",
                    cursor: "pointer",
                }}
                onClick={getOptimalWindow}
            >
                Oblicz
            </button>

            {optimal && (
                <div
                    style={{
                        marginTop: "20px",
                        padding: "15px",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        background: "#f7f7f7",
                        width: "350px",
                    }}
                >
                    <h3>Najlepsze okno ładowania:</h3>
                    <p>
                        <strong>Start:</strong> {formatDate(optimal.start)}
                    </p>
                    <p>
                        <strong>Koniec:</strong> {formatDate(optimal.end)}
                    </p>
                    <p>
                        <strong>Czysta energia:</strong>{" "}
                        {optimal.averageCleanEnergyShare.toFixed(1)}%
                    </p>
                </div>
            )}
        </div>
    );
}
