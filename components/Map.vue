<template>
  <div>
    <LegendModal ref="legendModalComponent" />
    <div id="map" class="rounded-lg h-full w-full" />
  </div>
</template>

<script setup>
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import style from '@/assets/style.json'
import LegendControl from '@/maplibre/LegendControl'
import FullscreenControl from '@/maplibre/FullscreenControl'
import ShrinkControl from '@/maplibre/ShrinkControl'

const { features, options } = defineProps({
  features: { type: Array, required: true },
  options: {
    type: Object,
    required: false,
    default: () => ({
      fullscreen: false,
      onFullscreenControlClick: () => {},
      shrink: false,
      onShrinkControlClick: () => {}
    })
  }
})

const legendModalComponent = ref(null)

const {
  plotDoneSections,
  plotWipSections,
  plotPlannedSections,
  plotVarianteSections,
  plotVariantePostponedSections,
  plotUnknownSections,
  plotPostponedSections,
  plotPois,
  fitBounds
} = useMap()

const { getTooltipHtml, getTooltipPoi } = useTooltip()

onMounted(() => {
  const map = new maplibregl.Map({
    container: 'map',
    style,
    center: [4.8312188, 45.757198],
    zoom: 12,
    attributionControl: false
  })
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left')
  map.addControl(new maplibregl.AttributionControl(), 'bottom-left')
  if (options.fullscreen) {
    const fullscreenControl = new FullscreenControl({
      onClick: () => options.onFullscreenControlClick()
    })
    map.addControl(fullscreenControl, 'top-right')
  }
  if (options.shrink) {
    const shrinkControl = new ShrinkControl({
      onClick: () => options.onShrinkControlClick()
    })
    map.addControl(shrinkControl, 'top-right')
  }
  const legendControl = new LegendControl({
    onClick: () => legendModalComponent.value.openModal()
  })
  map.addControl(legendControl, 'top-right')

  map.on('load', () => {
    plotDoneSections({ map, features })
    plotPlannedSections({ map, features })
    plotVarianteSections({ map, features })
    plotVariantePostponedSections({ map, features })
    plotWipSections({ map, features })
    plotUnknownSections({ map, features })
    plotPostponedSections({ map, features })
    plotPois({ map, features })

    fitBounds({ map, features })
  })

  // must do this to avoid multiple popups
  map.on('click', (e) => {
    // console.log('e.lngLat >>', e.lngLat)
    const features = map
      .queryRenderedFeatures(e.point)
      .filter(({ layer }) => layer.source !== 'openmaptiles')

    if (features.length === 0) {
      return
    }

    const isPoiLayerClicked = features.some(({ layer }) => layer.id === 'pois')
    if (isPoiLayerClicked) {
      const feature = features.find(({ layer }) => layer.id === 'pois')
      new maplibregl.Popup({ closeButton: false, closeOnClick: true })
        .setLngLat(e.lngLat)
        .setHTML(getTooltipPoi(feature.properties))
        .addTo(map)
    } else {
      new maplibregl.Popup({ closeButton: false, closeOnClick: true })
        .setLngLat(e.lngLat)
        .setHTML(getTooltipHtml(features[0].properties))
        .addTo(map)
    }
  })
})
</script>

<style>
.maplibregl-popup-content {
    @apply p-0;
}

.maplibregl-info {
    background-repeat: no-repeat;
    background-position: center;
    pointer-events: auto;
    background-image: url('~/maplibre/info.svg');
    background-size: 85%;
}

.maplibregl-fullscreen {
    background-repeat: no-repeat;
    background-position: center;
    pointer-events: auto;
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='29' height='29' fill='%23333'%3E%3Cpath d='M24 16v5.5c0 1.75-.75 2.5-2.5 2.5H16v-1l3-1.5-4-5.5 1-1 5.5 4 1.5-3h1zM6 16l1.5 3 5.5-4 1 1-4 5.5 3 1.5v1H7.5C5.75 24 5 23.25 5 21.5V16h1zm7-11v1l-3 1.5 4 5.5-1 1-5.5-4L6 13H5V7.5C5 5.75 5.75 5 7.5 5H13zm11 2.5c0-1.75-.75-2.5-2.5-2.5H16v1l3 1.5-4 5.5 1 1 5.5-4 1.5 3h1V7.5z'/%3E%3C/svg%3E");
}

.maplibregl-shrink {
    background-repeat: no-repeat;
    background-position: center;
    pointer-events: auto;
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='29' height='29'%3E%3Cpath d='M18.5 16c-1.75 0-2.5.75-2.5 2.5V24h1l1.5-3 5.5 4 1-1-4-5.5 3-1.5v-1h-5.5zM13 18.5c0-1.75-.75-2.5-2.5-2.5H5v1l3 1.5L4 24l1 1 5.5-4 1.5 3h1v-5.5zm3-8c0 1.75.75 2.5 2.5 2.5H24v-1l-3-1.5L25 5l-1-1-5.5 4L17 5h-1v5.5zM10.5 13c1.75 0 2.5-.75 2.5-2.5V5h-1l-1.5 3L5 4 4 5l4 5.5L5 12v1h5.5z'/%3E%3C/svg%3E");
}

.maplibregl-popup-anchor-top .maplibregl-popup-tip,
.maplibregl-popup-anchor-top-left .maplibregl-popup-tip,
.maplibregl-popup-anchor-top-right .maplibregl-popup-tip {
    border-bottom-color: transparent;
}
.maplibregl-popup-anchor-bottom .maplibregl-popup-tip,
.maplibregl-popup-anchor-bottom-left .maplibregl-popup-tip,
.maplibregl-popup-anchor-bottom-right .maplibregl-popup-tip {
    border-top-color: transparent;
}
.maplibregl-popup-anchor-left .maplibregl-popup-tip {
    border-right-color: transparent;
}
.maplibregl-popup-anchor-right .maplibregl-popup-tip {
    border-left-color: transparent;
}
</style>
