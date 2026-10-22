import type * as React from "react"

import {
  MapComponent,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MarkerTooltip,
} from "@/components/ui/map"
import { CLOUD_LOCATIONS } from "@/constants/app"

type CloudMapProps = React.ComponentProps<typeof MapComponent>

export function CloudMap(props: CloudMapProps) {
  return (
    <MapComponent
      center={[-122.8059, 49.294]}
      className="bg-card"
      zoom={12}
      {...props}
    >
      {CLOUD_LOCATIONS.map((location) => (
        <MapMarker
          key={location.id}
          latitude={location.lat}
          longitude={location.lng}
        >
          <MarkerContent>
            <div className="size-4 rounded-full border-2 border-foreground bg-primary shadow-lg" />
          </MarkerContent>
          <MarkerTooltip>{location.name}</MarkerTooltip>
          <MarkerPopup>
            <div className="space-y-1">
              <p className="font-medium text-foreground">{location.name}</p>
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground text-xs">
                  {location.location}
                </p>
                <p className="text-muted-foreground text-xs">
                  ({location.region})
                </p>
              </div>
            </div>
          </MarkerPopup>
        </MapMarker>
      ))}
    </MapComponent>
  )
}
