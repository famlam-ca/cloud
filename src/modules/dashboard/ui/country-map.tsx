import { IconMapPinFilled } from "@tabler/icons-react"
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps/core"

import { CLOUD_LOCATIONS } from "@/constants/app"

const geoUrl =
  "https://gist.githubusercontent.com/Saw-mon-and-Natalie/a11f058fc0dcce9343b02498a46b3d44/raw/e8afc74f791169a64d6e8df033d7e88ff85ba673/canada.json"

export function CountryMap() {
  const location = CLOUD_LOCATIONS.at(0)
  if (!location) return null

  return (
    <div className="relative aspect-4/3 w-full">
      <ComposableMap
        className="fill-accent size-full"
        projection="geoMercator"
        projectionConfig={{
          center: [-100, 60],
          scale: 500,
        }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography geography={geo} key={geo.rsmKey} />
            ))
          }
        </Geographies>
        <Marker coordinates={[location.lng, location.lat]}>
          <g transform="translate(-40, -80)">
            <IconMapPinFilled className="fill-primary stroke-0" size={80} />
          </g>
        </Marker>
      </ComposableMap>
    </div>
  )
}
