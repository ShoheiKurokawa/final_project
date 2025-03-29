import { spotifyDataPromise, lastfmDataPromise } from "./script";
import { getCurentPersonal, getCurentCountry, getCurentWorld } from "./main";
import { ChartData, Chart, elements, registerables, TooltipItem } from "chart.js";
import { VennDiagramChart, extractSets, VennDiagramController, ArcSlice } from "chartjs-chart-venn";
import { countryDataPromise } from "./main";

// This interface defines the structure of the data used in the Venn diagram
interface VennRawData {
  sets: string[];
  value: number;
}

interface VennArcElement extends Chart {
    refs: {
      cx: number;
      cy: number;
      r: number;
      label?: string;
    };
}
  

// Register Chart.js built-ins and venn components
Chart.register(...registerables, VennDiagramController, ArcSlice);

// Global variable to hold the chart instance
let vennChartInstance: VennDiagramChart;

// Function to create or update the chart
async function createOrUpdateChart() {
  // Read current user selections:
  const typeSelect = document.getElementById("type") as HTMLSelectElement;

  // Get current data arrays based on type.
  const personal: string[] = getCurentPersonal();
  const country: string[] = await getCurentCountry();
  const world: string[] = getCurentWorld();

  // Build dataset, but get functions already limited to the number of items selected.
  const musicSets = [
    { label: 'Personal', values: personal },
    { label: 'Country', values: country },
    { label: 'World', values: world }
  ];

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
        tooltip: {
          enabled: true,
          callbacks: {
            label: (tooltipItem: TooltipItem<'venn'>) => {
              const rawData = tooltipItem.raw as VennRawData;
              const sets = rawData.sets;
              // Create a custom label that joins the set names with "∩"
              const customLabel = sets.join(" ∩ ");
              // Mapping from set names to original arrays (using the limited arrays)
              const setMapping: Record<string, string[]> = {
                'Personal': personal,
                'Country': country,
                'World': world
              };
              let items: string[] = [];
              if (sets.length === 1) {
                items = setMapping[sets[0]] || [];
              } else {
                // Compute intersection for multiple sets
                items = setMapping[sets[0]] || [];
                for (let i = 1; i < sets.length; i++) {
                  const currentSet = setMapping[sets[i]] || [];
                  items = items.filter(item => currentSet.includes(item));
                }
              }
              return `${customLabel}: ${items.length ? items.join(', ') : '(none)'}`;
            }
          }
        }

      }
    }
  };

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
    vennChartInstance.options = newConfig.options;
    vennChartInstance.update();
  } else {
    vennChartInstance = new VennDiagramChart(ctx, newConfig) as unknown as VennDiagramChart<number[], string>;
  }
}


// Variables to track selection rectangle
let selectionRect: HTMLDivElement | null = null;
let startX = 0;
let startY = 0;

// Get the canvas element
const canvas = document.getElementById('vennChart') as HTMLCanvasElement;
if (!canvas) {
  throw new Error("Canvas element 'vennChart' not found");
}

// Mouse down: record starting coordinates and create an overlay
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  startX = e.clientX;
  startY = e.clientY;
  selectionRect = document.createElement('div');
  selectionRect.style.position = 'absolute';
  selectionRect.style.border = '2px dashed #000';
  selectionRect.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
  selectionRect.style.pointerEvents = 'none';
  document.body.appendChild(selectionRect);
  selectionRect.style.left = `${startX}px`;
  selectionRect.style.top = `${startY}px`;
  selectionRect.style.width = '0px';
  selectionRect.style.height = '0px';
});

// Mouse move: update the overlay dimensions
canvas.addEventListener('mousemove', (e) => {
  if (!selectionRect) return;
  const currentX = e.clientX;
  const currentY = e.clientY;
  const width = currentX - startX;
  const height = currentY - startY;
  selectionRect.style.left = `${width < 0 ? currentX : startX}px`;
  selectionRect.style.top = `${height < 0 ? currentY : startY}px`;
  selectionRect.style.width = `${Math.abs(width)}px`;
  selectionRect.style.height = `${Math.abs(height)}px`;
});

// Mouse up: remove overlay, compute selection bounds, and update chart
canvas.addEventListener('mouseup', async(e) => {
  if (!selectionRect) return;
  const selectionBounds = selectionRect.getBoundingClientRect();
  selectionRect.remove();
  selectionRect = null;
    
  const filteredVennData = await filterVennDataBySelection(vennChartInstance, selectionBounds);
  
  // Update the chart with the new filtered data.
  if (vennChartInstance) {
    vennChartInstance.data = filteredVennData;
    vennChartInstance.update();
  }
});


// Function to filter the Venn data based on the selection rectangle
async function filterVennDataBySelection(chart: VennDiagramChart, selectionBounds: DOMRect): Promise<ChartData<'venn', number[], string>>{
    // Retrieve dataset meta (assuming one dataset)
    const meta = chart.getDatasetMeta(0).data;
    
    // Check if the chart has any data
    const selectedLabels: string[] = [];
    
    
    
    // If no labels were selected, return the original data.
    const originalMusicSets = [
      { label: 'Personal', values: getCurentPersonal() },
      { label: 'Country', values: await getCurentCountry() }, 
      { label: 'World', values: getCurentWorld() }
    ];
    
    // Filter the original sets based on selectedLabels
    const filteredSets = originalMusicSets.filter(set => selectedLabels.includes(set.label));
    
    // If no sets are inside, just return the original data.
    if (filteredSets.length === 0) {
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
    
    // If the distance is less than or equal to the radius, the circle and rectangle intersect.
    return (dx * dx + dy * dy) <= (r * r);
}
  


// Attach event listeners to update the chart when user input changes:
document.getElementById("type")?.addEventListener("change", createOrUpdateChart);
document.getElementById("country")?.addEventListener("change", async () => {
    await countryDataPromise; // Wait until the latest update finishes.
  createOrUpdateChart();
});
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
