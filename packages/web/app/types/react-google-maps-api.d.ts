import * as React from "react";

declare module "@react-google-maps/api" {
  // Autocomplete component
  export interface AutocompleteProps {
    onLoad?: (autocomplete: google.maps.places.Autocomplete) => void;
    onPlaceChanged?: () => void;
    onUnmount?: (autocomplete: google.maps.places.Autocomplete) => void;
    options?: google.maps.places.AutocompleteOptions;
    className?: string;
    children?: React.ReactNode;
  }

  export const Autocomplete: React.FC<AutocompleteProps>;

  // GoogleMap component
  export interface GoogleMapProps {
    id?: string;
    mapContainerStyle?: React.CSSProperties;
    mapContainerClassName?: string;
    options?: google.maps.MapOptions;
    extraMapTypes?: google.maps.MapType[];
    center?: google.maps.LatLng | google.maps.LatLngLiteral;
    clickableIcons?: boolean;
    heading?: number;
    mapTypeId?: string;
    streetView?: google.maps.StreetViewPanorama;
    tilt?: number;
    zoom?: number;
    onClick?: (e: google.maps.MapMouseEvent) => void;
    onDblClick?: (e: google.maps.MapMouseEvent) => void;
    onDrag?: () => void;
    onDragEnd?: () => void;
    onDragStart?: () => void;
    onMapTypeIdChanged?: () => void;
    onMouseMove?: (e: google.maps.MapMouseEvent) => void;
    onMouseOut?: (e: google.maps.MapMouseEvent) => void;
    onMouseOver?: (e: google.maps.MapMouseEvent) => void;
    onRightClick?: (e: google.maps.MapMouseEvent) => void;
    onCenterChanged?: () => void;
    onLoad?: (map: google.maps.Map) => void;
    onUnmount?: (map: google.maps.Map) => void;
    onBoundsChanged?: () => void;
    onHeadingChanged?: () => void;
    onIdle?: () => void;
    onProjectionChanged?: () => void;
    onResize?: () => void;
    onTilesLoaded?: () => void;
    onTiltChanged?: () => void;
    onZoomChanged?: () => void;
    children?: React.ReactNode;
  }

  export const GoogleMap: React.FC<GoogleMapProps>;

  // Marker component (MarkerF is the functional version)
  export interface MarkerProps {
    position: google.maps.LatLng | google.maps.LatLngLiteral;
    animation?: google.maps.Animation;
    clickable?: boolean;
    cursor?: string;
    draggable?: boolean;
    icon?: string | google.maps.Icon | google.maps.Symbol;
    label?: string | google.maps.MarkerLabel;
    opacity?: number;
    options?: google.maps.MarkerOptions;
    shape?: google.maps.MarkerShape;
    title?: string;
    visible?: boolean;
    zIndex?: number;
    clusterer?: unknown;
    noClustererRedraw?: boolean;
    onClick?: (e: google.maps.MapMouseEvent) => void;
    onDblClick?: (e: google.maps.MapMouseEvent) => void;
    onDrag?: (e: google.maps.MapMouseEvent) => void;
    onDragEnd?: (e: google.maps.MapMouseEvent) => void;
    onDragStart?: (e: google.maps.MapMouseEvent) => void;
    onMouseDown?: (e: google.maps.MapMouseEvent) => void;
    onMouseOut?: (e: google.maps.MapMouseEvent) => void;
    onMouseOver?: (e: google.maps.MapMouseEvent) => void;
    onMouseUp?: (e: google.maps.MapMouseEvent) => void;
    onRightClick?: (e: google.maps.MapMouseEvent) => void;
    onLoad?: (marker: google.maps.Marker) => void;
    onUnmount?: (marker: google.maps.Marker) => void;
    onAnimationChanged?: () => void;
    onClickableChanged?: () => void;
    onCursorChanged?: () => void;
    onDraggableChanged?: () => void;
    onFlatChanged?: () => void;
    onIconChanged?: () => void;
    onPositionChanged?: () => void;
    onShapeChanged?: () => void;
    onTitleChanged?: () => void;
    onVisibleChanged?: () => void;
    onZindexChanged?: () => void;
    children?: React.ReactNode;
  }

  export const Marker: React.FC<MarkerProps>;
  export const MarkerF: React.FC<MarkerProps>;

  // LoadScript component
  export interface LoadScriptProps {
    id?: string;
    googleMapsApiKey: string;
    googleMapsClientId?: string;
    version?: string;
    language?: string;
    region?: string;
    libraries?: (
      | "drawing"
      | "geometry"
      | "localContext"
      | "places"
      | "visualization"
    )[];
    preventGoogleFontsLoading?: boolean;
    channel?: string;
    mapIds?: string[];
    authReferrerPolicy?: "origin";
    onLoad?: () => void;
    onError?: (error: Error) => void;
    onUnmount?: () => void;
    loadingElement?: React.ReactNode;
    children?: React.ReactNode;
    nonce?: string;
  }

  export const LoadScript: React.FC<LoadScriptProps>;

  // useLoadScript hook
  export interface UseLoadScriptOptions {
    id?: string;
    googleMapsApiKey?: string;
    googleMapsClientId?: string;
    version?: string;
    language?: string;
    region?: string;
    libraries?: (
      | "drawing"
      | "geometry"
      | "localContext"
      | "places"
      | "visualization"
    )[];
    preventGoogleFontsLoading?: boolean;
    channel?: string;
    mapIds?: string[];
    authReferrerPolicy?: "origin";
    nonce?: string;
  }

  export interface LoadScriptStatus {
    isLoaded: boolean;
    loadError: Error | undefined;
  }

  export function useLoadScript(options: UseLoadScriptOptions): LoadScriptStatus;

  // useJsApiLoader hook (alternative to useLoadScript)
  export function useJsApiLoader(
    options: UseLoadScriptOptions
  ): LoadScriptStatus;

  // InfoWindow component
  export interface InfoWindowProps {
    anchor?: google.maps.MVCObject;
    options?: google.maps.InfoWindowOptions;
    position?: google.maps.LatLng | google.maps.LatLngLiteral;
    zIndex?: number;
    onCloseClick?: () => void;
    onDomReady?: () => void;
    onContentChanged?: () => void;
    onPositionChanged?: () => void;
    onZindexChanged?: () => void;
    onLoad?: (infoWindow: google.maps.InfoWindow) => void;
    onUnmount?: (infoWindow: google.maps.InfoWindow) => void;
    children?: React.ReactNode;
  }

  export const InfoWindow: React.FC<InfoWindowProps>;

  // Circle component
  export interface CircleProps {
    options?: google.maps.CircleOptions;
    center?: google.maps.LatLng | google.maps.LatLngLiteral;
    radius?: number;
    draggable?: boolean;
    editable?: boolean;
    visible?: boolean;
    onDblClick?: (e: google.maps.MapMouseEvent) => void;
    onDragEnd?: (e: google.maps.MapMouseEvent) => void;
    onDragStart?: (e: google.maps.MapMouseEvent) => void;
    onMouseDown?: (e: google.maps.MapMouseEvent) => void;
    onMouseMove?: (e: google.maps.MapMouseEvent) => void;
    onMouseOut?: (e: google.maps.MapMouseEvent) => void;
    onMouseOver?: (e: google.maps.MapMouseEvent) => void;
    onMouseUp?: (e: google.maps.MapMouseEvent) => void;
    onRightClick?: (e: google.maps.MapMouseEvent) => void;
    onClick?: (e: google.maps.MapMouseEvent) => void;
    onDrag?: (e: google.maps.MapMouseEvent) => void;
    onCenterChanged?: () => void;
    onRadiusChanged?: () => void;
    onLoad?: (circle: google.maps.Circle) => void;
    onUnmount?: (circle: google.maps.Circle) => void;
    children?: React.ReactNode;
  }

  export const Circle: React.FC<CircleProps>;

  // Polygon component
  export interface PolygonProps {
    options?: google.maps.PolygonOptions;
    paths?:
      | google.maps.MVCArray<google.maps.MVCArray<google.maps.LatLng>>
      | google.maps.MVCArray<google.maps.LatLng>
      | google.maps.LatLng[]
      | google.maps.LatLng[][]
      | google.maps.LatLngLiteral[]
      | google.maps.LatLngLiteral[][];
    draggable?: boolean;
    editable?: boolean;
    visible?: boolean;
    onClick?: (e: google.maps.PolyMouseEvent) => void;
    onDblClick?: (e: google.maps.PolyMouseEvent) => void;
    onDrag?: (e: google.maps.MapMouseEvent) => void;
    onDragEnd?: (e: google.maps.MapMouseEvent) => void;
    onDragStart?: (e: google.maps.MapMouseEvent) => void;
    onMouseDown?: (e: google.maps.PolyMouseEvent) => void;
    onMouseMove?: (e: google.maps.PolyMouseEvent) => void;
    onMouseOut?: (e: google.maps.PolyMouseEvent) => void;
    onMouseOver?: (e: google.maps.PolyMouseEvent) => void;
    onMouseUp?: (e: google.maps.PolyMouseEvent) => void;
    onRightClick?: (e: google.maps.PolyMouseEvent) => void;
    onLoad?: (polygon: google.maps.Polygon) => void;
    onUnmount?: (polygon: google.maps.Polygon) => void;
    children?: React.ReactNode;
  }

  export const Polygon: React.FC<PolygonProps>;

  // Polyline component
  export interface PolylineProps {
    options?: google.maps.PolylineOptions;
    path?:
      | google.maps.MVCArray<google.maps.LatLng>
      | google.maps.LatLng[]
      | google.maps.LatLngLiteral[];
    draggable?: boolean;
    editable?: boolean;
    visible?: boolean;
    onClick?: (e: google.maps.PolyMouseEvent) => void;
    onDblClick?: (e: google.maps.PolyMouseEvent) => void;
    onDrag?: (e: google.maps.MapMouseEvent) => void;
    onDragEnd?: (e: google.maps.MapMouseEvent) => void;
    onDragStart?: (e: google.maps.MapMouseEvent) => void;
    onMouseDown?: (e: google.maps.PolyMouseEvent) => void;
    onMouseMove?: (e: google.maps.PolyMouseEvent) => void;
    onMouseOut?: (e: google.maps.PolyMouseEvent) => void;
    onMouseOver?: (e: google.maps.PolyMouseEvent) => void;
    onMouseUp?: (e: google.maps.PolyMouseEvent) => void;
    onRightClick?: (e: google.maps.PolyMouseEvent) => void;
    onLoad?: (polyline: google.maps.Polyline) => void;
    onUnmount?: (polyline: google.maps.Polyline) => void;
    children?: React.ReactNode;
  }

  export const Polyline: React.FC<PolylineProps>;

  // Rectangle component
  export interface RectangleProps {
    options?: google.maps.RectangleOptions;
    bounds?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral;
    draggable?: boolean;
    editable?: boolean;
    visible?: boolean;
    onClick?: (e: google.maps.MapMouseEvent) => void;
    onDblClick?: (e: google.maps.MapMouseEvent) => void;
    onDrag?: (e: google.maps.MapMouseEvent) => void;
    onDragEnd?: (e: google.maps.MapMouseEvent) => void;
    onDragStart?: (e: google.maps.MapMouseEvent) => void;
    onMouseDown?: (e: google.maps.MapMouseEvent) => void;
    onMouseMove?: (e: google.maps.MapMouseEvent) => void;
    onMouseOut?: (e: google.maps.MapMouseEvent) => void;
    onMouseOver?: (e: google.maps.MapMouseEvent) => void;
    onMouseUp?: (e: google.maps.MapMouseEvent) => void;
    onRightClick?: (e: google.maps.MapMouseEvent) => void;
    onBoundsChanged?: () => void;
    onLoad?: (rectangle: google.maps.Rectangle) => void;
    onUnmount?: (rectangle: google.maps.Rectangle) => void;
    children?: React.ReactNode;
  }

  export const Rectangle: React.FC<RectangleProps>;

  // Data component
  export interface DataProps {
    options?: google.maps.Data.DataOptions;
    onClick?: (e: google.maps.Data.MouseEvent) => void;
    onAddFeature?: (e: google.maps.Data.AddFeatureEvent) => void;
    onRemoveFeature?: (e: google.maps.Data.RemoveFeatureEvent) => void;
    onRemoveProperty?: (e: google.maps.Data.RemovePropertyEvent) => void;
    onSetGeometry?: (e: google.maps.Data.SetGeometryEvent) => void;
    onSetProperty?: (e: google.maps.Data.SetPropertyEvent) => void;
    onMouseDown?: (e: google.maps.Data.MouseEvent) => void;
    onMouseOut?: (e: google.maps.Data.MouseEvent) => void;
    onMouseOver?: (e: google.maps.Data.MouseEvent) => void;
    onMouseUp?: (e: google.maps.Data.MouseEvent) => void;
    onRightClick?: (e: google.maps.Data.MouseEvent) => void;
    onDblClick?: (e: google.maps.Data.MouseEvent) => void;
    onLoad?: (data: google.maps.Data) => void;
    onUnmount?: (data: google.maps.Data) => void;
    children?: React.ReactNode;
  }

  export const Data: React.FC<DataProps>;

  // OverlayView component
  export interface OverlayViewProps {
    mapPaneName: string;
    position?: google.maps.LatLng | google.maps.LatLngLiteral;
    bounds?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral;
    getPixelPositionOffset?: (
      offsetWidth: number,
      offsetHeight: number
    ) => { x: number; y: number };
    onLoad?: (overlayView: google.maps.OverlayView) => void;
    onUnmount?: (overlayView: google.maps.OverlayView) => void;
    children?: React.ReactNode;
  }

  export const OverlayView: React.FC<OverlayViewProps>;

  // HeatmapLayer component
  export interface HeatmapLayerProps {
    data:
      | google.maps.MVCArray<
          google.maps.LatLng | google.maps.visualization.WeightedLocation
        >
      | (google.maps.LatLng | google.maps.visualization.WeightedLocation)[];
    options?: google.maps.visualization.HeatmapLayerOptions;
    onLoad?: (heatmapLayer: google.maps.visualization.HeatmapLayer) => void;
    onUnmount?: (heatmapLayer: google.maps.visualization.HeatmapLayer) => void;
  }

  export const HeatmapLayer: React.FC<HeatmapLayerProps>;

  // KmlLayer component
  export interface KmlLayerProps {
    url?: string;
    options?: google.maps.KmlLayerOptions;
    onClick?: (e: google.maps.KmlMouseEvent) => void;
    onDefaultViewportChanged?: () => void;
    onStatusChanged?: () => void;
    onLoad?: (kmlLayer: google.maps.KmlLayer) => void;
    onUnmount?: (kmlLayer: google.maps.KmlLayer) => void;
  }

  export const KmlLayer: React.FC<KmlLayerProps>;

  // StreetViewPanorama component
  export interface StreetViewPanoramaProps {
    options?: google.maps.StreetViewPanoramaOptions;
    position?: google.maps.LatLng | google.maps.LatLngLiteral;
    pov?: google.maps.StreetViewPov;
    zoom?: number;
    visible?: boolean;
    onCloseClick?: (event: google.maps.MapMouseEvent) => void;
    onPanoChanged?: () => void;
    onPositionChanged?: () => void;
    onPovChanged?: () => void;
    onResize?: () => void;
    onStatusChanged?: () => void;
    onVisibleChanged?: () => void;
    onZoomChanged?: () => void;
    onLoad?: (streetViewPanorama: google.maps.StreetViewPanorama) => void;
    onUnmount?: (streetViewPanorama: google.maps.StreetViewPanorama) => void;
    children?: React.ReactNode;
  }

  export const StreetViewPanorama: React.FC<StreetViewPanoramaProps>;

  // DirectionsRenderer component
  export interface DirectionsRendererProps {
    options?: google.maps.DirectionsRendererOptions;
    directions?: google.maps.DirectionsResult;
    panel?: HTMLElement;
    routeIndex?: number;
    onDirectionsChanged?: () => void;
    onLoad?: (directionsRenderer: google.maps.DirectionsRenderer) => void;
    onUnmount?: (directionsRenderer: google.maps.DirectionsRenderer) => void;
  }

  export const DirectionsRenderer: React.FC<DirectionsRendererProps>;

  // DirectionsService component
  export interface DirectionsServiceProps {
    options: google.maps.DirectionsRequest;
    callback: (
      result: google.maps.DirectionsResult | null,
      status: google.maps.DirectionsStatus
    ) => void;
    onLoad?: (directionsService: google.maps.DirectionsService) => void;
    onUnmount?: (directionsService: google.maps.DirectionsService) => void;
  }

  export const DirectionsService: React.FC<DirectionsServiceProps>;

  // DistanceMatrixService component
  export interface DistanceMatrixServiceProps {
    options: google.maps.DistanceMatrixRequest;
    callback: (
      response: google.maps.DistanceMatrixResponse | null,
      status: google.maps.DistanceMatrixStatus
    ) => void;
    onLoad?: (distanceMatrixService: google.maps.DistanceMatrixService) => void;
    onUnmount?: (
      distanceMatrixService: google.maps.DistanceMatrixService
    ) => void;
  }

  export const DistanceMatrixService: React.FC<DistanceMatrixServiceProps>;

  // StandaloneSearchBox component
  export interface StandaloneSearchBoxProps {
    bounds?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral;
    onLoad?: (searchBox: google.maps.places.SearchBox) => void;
    onUnmount?: (searchBox: google.maps.places.SearchBox) => void;
    onPlacesChanged?: () => void;
    children?: React.ReactNode;
  }

  export const StandaloneSearchBox: React.FC<StandaloneSearchBoxProps>;

  // DrawingManager component
  export interface DrawingManagerProps {
    options?: google.maps.drawing.DrawingManagerOptions;
    drawingMode?: google.maps.drawing.OverlayType | null;
    onCircleComplete?: (circle: google.maps.Circle) => void;
    onMarkerComplete?: (marker: google.maps.Marker) => void;
    onOverlayComplete?: (e: google.maps.drawing.OverlayCompleteEvent) => void;
    onPolygonComplete?: (polygon: google.maps.Polygon) => void;
    onPolylineComplete?: (polyline: google.maps.Polyline) => void;
    onRectangleComplete?: (rectangle: google.maps.Rectangle) => void;
    onLoad?: (drawingManager: google.maps.drawing.DrawingManager) => void;
    onUnmount?: (drawingManager: google.maps.drawing.DrawingManager) => void;
  }

  export const DrawingManager: React.FC<DrawingManagerProps>;

  // BicyclingLayer component
  export interface BicyclingLayerProps {
    onLoad?: (bicyclingLayer: google.maps.BicyclingLayer) => void;
    onUnmount?: (bicyclingLayer: google.maps.BicyclingLayer) => void;
  }

  export const BicyclingLayer: React.FC<BicyclingLayerProps>;

  // TrafficLayer component
  export interface TrafficLayerProps {
    options?: google.maps.TrafficLayerOptions;
    onLoad?: (trafficLayer: google.maps.TrafficLayer) => void;
    onUnmount?: (trafficLayer: google.maps.TrafficLayer) => void;
  }

  export const TrafficLayer: React.FC<TrafficLayerProps>;

  // TransitLayer component
  export interface TransitLayerProps {
    onLoad?: (transitLayer: google.maps.TransitLayer) => void;
    onUnmount?: (transitLayer: google.maps.TransitLayer) => void;
  }

  export const TransitLayer: React.FC<TransitLayerProps>;

  // GroundOverlay component
  export interface GroundOverlayProps {
    url: string;
    bounds: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral;
    options?: google.maps.GroundOverlayOptions;
    opacity?: number;
    onClick?: (e: google.maps.MapMouseEvent) => void;
    onDblClick?: (e: google.maps.MapMouseEvent) => void;
    onLoad?: (groundOverlay: google.maps.GroundOverlay) => void;
    onUnmount?: (groundOverlay: google.maps.GroundOverlay) => void;
  }

  export const GroundOverlay: React.FC<GroundOverlayProps>;
}
