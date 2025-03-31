import { spotifyDataPromise, lastfmDataPromise } from "./script";
import { getCurentPersonal, getCurentCountry, getCurentWorld } from "./main";
import { ChartData, Chart, registerables, TooltipItem } from "chart.js";
import { VennDiagramChart, extractSets, VennDiagramController, ArcSlice } from "chartjs-chart-venn";
import { countryDataPromise } from "./main";


const labelOrigin = ["Personal", "Country", "World"];
let labels = ["Personal", "Country", "World"];

// Global variable to hold the chart instance
const tooltipConfig = {
    enabled: true,
    external: (context: { tooltip: any }) => {
        const tooltip = context.tooltip;
        if (tooltip.opacity === 0) return;

        setTimeout(() => {
            tooltip.update();
        }, 0);
    },
    callbacks: {
        label: (tooltipItem: TooltipItem<'venn'>) => {
            const rawData = tooltipItem.raw as VennRawData;
            const sets = rawData.sets;
            const customLabel = sets.join(" ∩ ");

            // **Fetch the latest dataset values dynamically**
            const chartData = tooltipItem.chart.data as ChartData<'venn', number[], string>;

            // **Ensure mapping of set labels to their corresponding values**
            const setMapping: Record<string, string[]> = {};

            // Iterate over the dataset and correctly map values to sets
            (chartData.datasets[0].data as any[]).forEach((entry) => {
                entry.sets.forEach((set: string) => {
                    if (!setMapping[set]) {
                        setMapping[set] = [...entry.values]; // Accumulate values instead of overwriting
                    } else {
                        setMapping[set] = [...setMapping[set], ...entry.values];
                    }
                });
            });

            let items: string[] = [];
            if (sets.length === 1) {
                items = setMapping[sets[0]] || [];
            } else {
                // **Find the correct intersection**
                items = sets.reduce((acc, set, index) => {
                    if (index === 0) return setMapping[set] || [];
                    return acc.filter(item => (setMapping[set] || []).includes(item));
                }, [] as string[]);
            }

            return `${customLabel}: ${items.length ? items.join(', ') : '(none)'}`;
        }
    }
};


// This interface defines the structure of the data used in the Venn diagram
interface VennRawData {
  sets: string[];
  value: number;
}
  
// Register Chart.js built-ins and venn components
Chart.register(...registerables, VennDiagramController, ArcSlice);

// Global variable to hold the chart instance
let vennChartInstance: VennDiagramChart;

// Function to create or update the chart
export async function createOrUpdateChart() {
    // Read current user selections:
    const typeSelect = document.getElementById("type") as HTMLSelectElement;

    await countryDataPromise; 

    // Get current data arrays based on type.
    const personal: string[] = getCurentPersonal();
    const country: string[] = await getCurentCountry();
    const world: string[] = getCurentWorld();

    let sets = [
        { label: 'Personal', values: personal },
        { label: 'Country', values: country },
        { label: 'World', values: world }
    ];

    let musicSets: any[] = [];

    if (labels.length !== musicSets.length) {
        labels.forEach((label) => {
            sets.forEach((set) => {
                if (set.label === label) {
                    musicSets.push({
                        label: set.label,
                        values: set.values
                    });
                }
            }
            );
        });
    }

    console.log("Music Sets:", musicSets);
  


    // Extract data for the venn diagram
    const newVennData = extractSets(musicSets, { label: typeSelect.value }) as unknown as ChartData<'venn', number[], string>;;

    // Define the chart configuration (we keep tooltip configuration as before)
    const newConfig = {
        type: 'venn' as const,
        data: newVennData,
        options: {
            plugins: {
                title: {
                    display: true,
                    text: "Music Venn Diagram"
                },
                tooltip: { ...tooltipConfig }
                }
            },
    }

    // Get the canvas and its 2D context
    const canvas = document.getElementById('vennChart') as HTMLCanvasElement;
    if (!canvas) {
        throw new Error("Canvas element 'vennChart' not found");
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error("Could not get 2D context from canvas");
    }

    // If a chart instance already exists, update its data, otherwise create a new one
if (vennChartInstance) {
    vennChartInstance.data = newVennData;
    vennChartInstance.update();
} else {
    vennChartInstance = new VennDiagramChart(ctx, newConfig) as unknown as VennDiagramChart<number[], string>;
}
}


// Get the canvas element
const canvas = document.getElementById('vennChart') as HTMLCanvasElement;
if (!canvas) {
  throw new Error("Canvas element 'vennChart' not found");
}

// Variables to track selection rectangle
let selectionRect: HTMLDivElement | null = null;
let startX = 0;
let startY = 0;

// Mouse down: record starting coordinates and create an overlay
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  startX = e.clientX - rect.left;  // Convert to canvas coordinates
  startY = e.clientY - rect.top;   // Convert to canvas coordinates
  
  selectionRect = document.createElement('div');
  selectionRect.style.position = 'absolute';
  selectionRect.style.border = '2px dashed #000';
  selectionRect.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
  selectionRect.style.pointerEvents = 'none';
  document.body.appendChild(selectionRect);
  selectionRect.style.left = `${e.clientX}px`;  // Keep absolute for overlay
  selectionRect.style.top = `${e.clientY}px`;   // Keep absolute for overlay
  selectionRect.style.width = '0px';
  selectionRect.style.height = '0px';
});

// Mouse move: update the overlay dimensions
canvas.addEventListener('mousemove', (e) => {
  if (!selectionRect) return;
  const rect = canvas.getBoundingClientRect();
  const currentX = e.clientX - rect.left;
  const currentY = e.clientY - rect.top;
  const width = currentX - startX;
  const height = currentY - startY;

  selectionRect.style.left = `${width < 0 ? e.clientX : startX + rect.left}px`;
  selectionRect.style.top = `${height < 0 ? e.clientY : startY + rect.top}px`;
  selectionRect.style.width = `${Math.abs(width)}px`;
  selectionRect.style.height = `${Math.abs(height)}px`;
});

// Mouse up: remove overlay, compute selection bounds, and update chart
canvas.addEventListener('mouseup', async (e) => {
  if (!selectionRect) return;
  const rect = canvas.getBoundingClientRect();
  const endX = e.clientX - rect.left;
  const endY = e.clientY - rect.top;
  const selectionBounds = new DOMRect(
    Math.min(startX, endX),
    Math.min(startY, endY),
    Math.abs(endX - startX),
    Math.abs(endY - startY)
  );
  
  selectionRect.remove();
  selectionRect = null;

  // Filter the Venn data based on selection and update chart
  const filteredVennData = await filterVennDataBySelection(vennChartInstance, selectionBounds);
  if (vennChartInstance) {
    vennChartInstance.data = filteredVennData;
    vennChartInstance.update();
  }
});

document.addEventListener("mouseup", async (e) => {
    if (selectionRect) {
        selectionRect.remove();
        selectionRect = null;
    }
});



// Function to filter the Venn data based on the selection rectangle
async function filterVennDataBySelection(chart: VennDiagramChart, selectionBounds: DOMRect): Promise<ChartData<'venn', number[], string>>{
    // Retrieve dataset meta (assuming one dataset)
    const meta = chart.getDatasetMeta(0).data;

    let i = 0;
    let selectedLabels: string[] = [];

    // Iterate through each element in the meta array
    meta.forEach((element: any) => {
        if (i >= labels.length) {
            return;
        }
        // Access the 'refs' array which contains the circle properties
        if (element.refs && element.refs.length > 0) {
            element.refs.forEach((ref: { cx: number; cy: number; r: number }) => {
                // Check if the circle intersects with the selection rectangle
                if (checkCrossing(ref.cx, ref.cy, ref.r, selectionBounds)) {
                    // Retrieve the label associated with the selected circle
                    selectedLabels.push(labelOrigin[i]);
                }
                i++;
            });
        }
    });

    
    // If no labels were selected, return the original data.
    const originalMusicSets = [
      { label: 'Personal', values: getCurentPersonal() },
      { label: 'Country', values: await getCurentCountry() }, 
      { label: 'World', values: getCurentWorld() }
    ];
    
    // Filter the original sets based on selectedLabels
    const filteredSets = originalMusicSets.filter(set => selectedLabels.includes(set.label));

    labels = selectedLabels;
    
    // If no sets are inside, just return the original data.
    if (filteredSets.length === 0) {
        labels = labelOrigin;
        return chart.data;
    }
    
    return extractSets(filteredSets, { label: "Music (Zoomed)" }) as unknown as ChartData<'venn', number[], string>;
}

// Function to check if a circle intersects with a rectangle
function checkCrossing(x: number, y: number, r: number, selectionBounds: DOMRect): boolean {
    // Find the closest point on the rectangle to the circle center
    const closestX = Math.max(selectionBounds.left, Math.min(x, selectionBounds.right));
    const closestY = Math.max(selectionBounds.top, Math.min(y, selectionBounds.bottom));
    
    // Calculate the distance from the circle center to that closest point
    const dx = x - closestX;
    const dy = y - closestY;

    if ((dx * dx + dy * dy) <= (r * r)){
        console.log("Circle intersects with rectangle");
    } else {
        console.log("Circle does not intersect with rectangle");
    }
    
    // If the distance is less than or equal to the radius, the circle and rectangle intersect.
    return (dx * dx + dy * dy) <= (r * r);
}
  


// Attach event listeners to update the chart when user input changes:
document.getElementById("type")?.addEventListener("change", createOrUpdateChart);
document.getElementById("number")?.addEventListener("change", createOrUpdateChart);

// Initialize chart after data is loaded:
Promise.all([spotifyDataPromise, lastfmDataPromise])
  .then(() => {
    // Create initial chart using default selections
    createOrUpdateChart();
  })
  .catch(error => {
    console.error("Error initializing chart data:", error);
  });

export function reset(){
    console.log(selectionRect);
    labels = labelOrigin;
    createOrUpdateChart();
}