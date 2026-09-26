// MapPage.jsx: the "Where to start" screen.
//
// The real map (Fresno County census tracts ranked by launch priority) needs
// the data pipeline first. For now this screen explains what's coming and
// proves the wiring works: it loads app/src/data/map.geojson (written by
// pipeline/build_map.py) and labels it as placeholder data.

import PlaceholderBadge from '../components/PlaceholderBadge.jsx'
import { useLanguage } from '../i18n/languageContext.js'
// Vite doesn't know the .geojson extension, so we import it as text (?raw)
// and parse it ourselves. GeoJSON is just JSON with an agreed-upon shape.
import mapGeojsonText from '../data/map.geojson?raw'

const mapData = JSON.parse(mapGeojsonText)
const IS_PLACEHOLDER = mapData.features.some((f) => f.properties?.placeholder === true)

// The data sources the README plans to use, as i18n keys.
const SOURCES = ['restaurants', 'census', 'calenviroscreen']

export default function MapPage() {
  const { t } = useLanguage()

  return (
    <section>
      <h1>{t('map.title')}</h1>
      <p className="lead">{t('map.comingSoon')}</p>

      <div className="card">
        {IS_PLACEHOLDER && <PlaceholderBadge textKey="map.placeholderData" />}
        <h2>{t('map.sourcesTitle')}</h2>
        <ul className="facts">
          {SOURCES.map((key) => (
            <li key={key}>{t(`map.sources.${key}`)}</li>
          ))}
        </ul>
        <p className="small muted">{t('map.scoreNote')}</p>
      </div>
    </section>
  )
}
