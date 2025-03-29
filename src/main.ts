import { spotifyDataPromise, myArtists, myTracks, lastfmDataPromise, worldArtists, worldTracks} from "./script.ts";
import { getTopArtistsByCountry, getTopTracksByCountry } from "./lastfm.ts";
import { reset, createOrUpdateChart } from "./musicVenn";

const typeSelect = document.getElementById("type") as HTMLSelectElement;
const countrySelect = document.getElementById("country") as HTMLSelectElement;
const numberSelect = document.getElementById("number") as HTMLSelectElement;
const personalList = document.getElementById("pLists") as HTMLSelectElement;
const countryList = document.getElementById("cLists") as HTMLSelectElement;
const worldList = document.getElementById("wLists") as HTMLSelectElement;

let currentCountryArtists: any = null;
let currentCountryTracks: any = null;

export let countryDataPromise: Promise<void> = Promise.resolve();

// Function to update country data from API
export function updateCountryData(selectedCountry: string, limit = 20, page = 2): Promise<void> {
  countryDataPromise = Promise.all([
    getTopArtistsByCountry(selectedCountry, limit, page),
    getTopTracksByCountry(selectedCountry, limit, page)
  ]).then(([artistsData, tracksData]) => {
    currentCountryArtists = artistsData.topartists.artist;
    currentCountryTracks = tracksData.tracks.track;
  }).catch(error => {
    console.error("Error updating country data:", error);
    throw error;
  });
  
  return countryDataPromise;
}

// Default artists for the country
getTopArtistsByCountry("United States", 20, 2).then((data) => {
  currentCountryArtists = data.topartists.artist;
  countryList.innerHTML = "";
  for (let i = 0; i < parseInt(numberSelect.value); i++) {
    const li = document.createElement("li");
    li.innerText = data.topartists.artist[i].name;
    countryList.appendChild(li);
  }
});

// Default title
setTypeTitle(typeSelect.value, countrySelect.value);

// Default tracks for the country
getTopTracksByCountry("United States", 20, 2).then((data) => {
  currentCountryTracks = data.tracks.track;
});

// Function to set the title based on the selected type and country
function setTypeTitle(type: string, country: string) {
  const personalTitle = document.getElementById("pType") as HTMLHeadingElement;
  const worldTitle = document.getElementById("wType") as HTMLHeadingElement;
  const countryTitle = document.getElementById("cType") as HTMLHeadingElement;
  personalTitle.innerText = `Your Top ${type}`;
  worldTitle.innerText = `World Top ${type}`;
  countryTitle.innerText = `Top ${type} in ${country}`;
}

// Number of items to display
numberSelect.addEventListener("change", () => {
  if(typeSelect.value == "Artists"){
    setArtistList(myArtists);
    setWorldArtists(worldArtists);
    setCountryList(currentCountryArtists);
  } else {
    setTrackList(myTracks);
    setWorldTracks(worldTracks);
    setCountryList(currentCountryTracks);
  }
});

// User chooses between artists and tracks
typeSelect.addEventListener("change", () => {
  if(typeSelect.value == "Artists"){
    setTypeTitle(typeSelect.value, countrySelect.value);
    setArtistList(myArtists);
    setWorldArtists(worldArtists);
    setCountryList(currentCountryArtists);
  } else {
    setTypeTitle(typeSelect.value, countrySelect.value);
    setTrackList(myTracks);
    setWorldTracks(worldTracks);
    setCountryList(currentCountryTracks);
  }
});

// Personal Artists List
function setArtistList(artistNames: string[]) {
  personalList.innerHTML = "";
  
  const num = parseInt(numberSelect.value);
  for (let i = 0; i < Math.min(num, artistNames.length); i++) {
    const li = document.createElement("li");
    li.innerText = artistNames[i];
    personalList.appendChild(li);
  }
}

// Personal Tracks List
function setTrackList(trackNames: string[]){
  personalList.innerHTML = "";
  
  const num = parseInt(numberSelect.value);
  for (let i = 0; i < Math.min(num, trackNames.length); i++) {
    const li = document.createElement("li");
    li.innerText = trackNames[i];
    personalList.appendChild(li);
  }
}

// Wait for the data promise to resolve:
spotifyDataPromise.then(() => {
  // Now artists array is populated, so we can use it to update the UI:
  if(typeSelect.value == "Artists"){
    setArtistList(myArtists);
  } else {
    setTrackList(myTracks);
  }
});

// World Ranked Artists List
function setWorldArtists(artistNames: string[]) {
  worldList.innerHTML = "";
  
  const num = parseInt(numberSelect.value);
  for (let i = 0; i < Math.min(num, artistNames.length); i++) {
    const li = document.createElement("li");
    li.innerText = artistNames[i];
    worldList.appendChild(li);
  }
}

// World Ranked Tracks List
function setWorldTracks(trackNames: string[]){
  worldList.innerHTML = "";
  
  const num = parseInt(numberSelect.value);
  for (let i = 0; i < Math.min(num, trackNames.length); i++) {
    const li = document.createElement("li");
    li.innerText = trackNames[i];
    worldList.appendChild(li);
  }
}

// Wait for the data promise to resolve (Make sure that all data is loaded before updating the UI):
lastfmDataPromise.then(() => {
  // Now artists array is populated, so we can use it to update the UI:
  if(typeSelect.value == "Artists"){
    setWorldArtists(worldArtists);
  } else {
    setWorldTracks(worldTracks);
  }
});

// Country change event
countrySelect.addEventListener("change", async () => {
  const selectedCountry = countrySelect.value;
  try {
    await updateCountryData(selectedCountry, 20, 2);
    await countryDataPromise
    setTypeTitle(typeSelect.value, selectedCountry);
    if (typeSelect.value === "Artists") {
      setCountryList(currentCountryArtists);
    } else {
      setCountryList(currentCountryTracks);
    }
    createOrUpdateChart();
  } catch (error) {
    console.error("Error fetching country data:", error);
  }
});

// Function to set the country list
function setCountryList(countryData: any) {
  countryList.innerHTML = "";
  const num = parseInt(numberSelect.value);
  for (let i = 0; i < Math.min(num, countryData.length); i++) {
    const li = document.createElement("li");
    li.innerText = countryData[i].name;
    countryList.appendChild(li);
  }
}

export function getCurentPersonal(){
  let makePersonal = [];
  let num = parseInt(numberSelect.value);
  if(typeSelect.value == "Artists"){
    for(let i = 0; i < Math.min(num, myArtists.length); i++){
      makePersonal.push(myArtists[i]);
    }
  } else{
    for(let i = 0; i < Math.min(num, myTracks.length); i++){
      makePersonal.push(myTracks[i]);
    }
  }
  return makePersonal;
}

export async function getCurentCountry(): Promise<string[]> {
  await countryDataPromise; // Wait until the latest update finishes.
  const numberSelect = document.getElementById("number") as HTMLSelectElement;
  let makeCountry = [];
  let num = parseInt(numberSelect.value);
  if(typeSelect.value == "Artists"){
    for(let i = 0; i < Math.min(num, currentCountryArtists.length); i++){
      makeCountry.push(currentCountryArtists[i].name);
    }
  } else{
    for(let i = 0; i < Math.min(num, currentCountryTracks.length); i++){
      makeCountry.push(currentCountryTracks[i].name);
    }
  }
  return makeCountry;
}

export function getCurentWorld(){
  let makeWorld = [];
  let num = parseInt(numberSelect.value);
  if(typeSelect.value == "Artists"){
    for(let i = 0; i < Math.min(num, worldArtists.length); i++){
      makeWorld.push(worldArtists[i]);
    }
  } else{
    for(let i = 0; i < Math.min(num, worldTracks.length); i++){
      makeWorld.push(worldTracks[i]);
    }
  }
  return makeWorld;
}

document.getElementById("reset")?.addEventListener("click", async() => {
  typeSelect.value = "Artists";
  countrySelect.value = "United States";
  numberSelect.value = "5";
  updateCountryData("United States", 20, 2);
  await getCurentCountry();
  setTypeTitle(typeSelect.value, countrySelect.value);
  setArtistList(myArtists);
  setWorldArtists(worldArtists);
  setCountryList(currentCountryArtists);
  reset();
});