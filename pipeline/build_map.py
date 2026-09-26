"""build_map.py: builds the data behind the "Where to start" map.

Run it from the repo root or from pipeline/:
    python build_map.py

WHAT IT DOES TODAY (stub)
Writes a PLACEHOLDER GeoJSON file to app/src/data/map.geojson so the app has
something to load. It uses only Python's built-in json module, so it runs
even before pandas/geopandas are installed.

WHAT IS GEOJSON?
A standard JSON format for map data. The top level is a "FeatureCollection":
a list of "features". Each feature has:
  - "geometry": the shape (a Point, or a Polygon such as a census tract outline)
    as [longitude, latitude] coordinates. Note: longitude comes FIRST.
  - "properties": any data about that shape (name, score, etc.)
Map libraries in the browser can draw it directly.

WHY THE OUTPUT IS COMMITTED TO GIT
Vercel builds only the React app; it does not run Python. So the pipeline runs
on a laptop, and its output file (map.geojson) is committed like any other
source file.
"""

import json
from pathlib import Path

# Path(__file__) is this script's location. Building paths from it (instead
# of from wherever the terminal happens to be) means the script works no
# matter which folder you run it from.
REPO_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = REPO_ROOT / "data" / "raw"  # downloaded source data (never edited by hand)
PROCESSED_DIR = REPO_ROOT / "data" / "processed"  # cleaned tables from this pipeline
OUTPUT_PATH = REPO_ROOT / "app" / "src" / "data" / "map.geojson"

# Downtown Fresno, only so the placeholder has a plausible location.
FRESNO_LON, FRESNO_LAT = -119.7871, 36.7378


def build_placeholder():
    """Return a GeoJSON FeatureCollection with one clearly fake feature."""
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [FRESNO_LON, FRESNO_LAT]},
                "properties": {
                    # The app checks this flag and labels the map as placeholder data.
                    "placeholder": True,
                    "tract_id": "PLACEHOLDER",
                    "score": None,
                    "notes": "PLACEHOLDER: not real data. Replace by running the real pipeline.",
                },
            }
        ],
    }


# TODO (Ronnie): replace build_placeholder() with the real pipeline once each
# step works in a notebook. Planned steps, from README "Refill Map":
#   1. Load Fresno County census tract shapes from data/raw/ (geopandas.read_file).
#   2. Load and join per-tract data:
#        - restaurant density (source to confirm: county food facility permits
#          or business listings)
#        - ACS: population density, median income, share of Spanish-speaking households
#        - CalEnviroScreen disadvantaged community score
#      (CalRecycle per capita disposal is city-level context only; it can't be
#      compared across cities, so it should not go into the tract score.)
#   3. Scale each measure to 0-1 and combine them with transparent weights.
#   4. Save a "why this tract" breakdown (each measure's contribution) in properties.
#   5. Write intermediate tables to data/processed/ and the final GeoJSON to OUTPUT_PATH.


def main():
    collection = build_placeholder()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(collection, f, indent=2)
        f.write("\n")
    print(f"Wrote {len(collection['features'])} placeholder feature(s) to {OUTPUT_PATH.relative_to(REPO_ROOT)}")


# This block only runs when the file is run directly (python build_map.py),
# not when another script imports it.
if __name__ == "__main__":
    main()
