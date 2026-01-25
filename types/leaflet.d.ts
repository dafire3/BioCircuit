declare module 'leaflet' {
  export interface LatLngLiteral {
    lat: number
    lng: number
  }

  export interface LatLng extends LatLngLiteral {
    equals(otherLatLng: LatLngLiteral, maxMargin?: number): boolean
    toString(): string
    distanceTo(otherLatLng: LatLngLiteral): number
    wrap(): LatLng
    toBounds(sizeInMeters: number): LatLngBounds
  }

  export interface LatLngBounds {
    extend(latlng: LatLngLiteral): this
    pad(bufferRatio: number): LatLngBounds
    getCenter(): LatLng
    getSouthWest(): LatLng
    getNorthEast(): LatLng
    getNorthWest(): LatLng
    getSouthEast(): LatLng
    getWest(): number
    getSouth(): number
    getEast(): number
    getNorth(): number
    contains(otherBoundsOrLatLng: LatLngBounds | LatLngLiteral): boolean
    intersects(otherBounds: LatLngBounds): boolean
    overlaps(otherBounds: LatLngBounds): boolean
    toBBoxString(): string
    equals(otherBounds: LatLngBounds): boolean
    isValid(): boolean
  }

  export interface Point {
    x: number
    y: number
    clone(): Point
    add(otherPoint: Point): Point
    subtract(otherPoint: Point): Point
    divideBy(num: number): Point
    multiplyBy(num: number): Point
    scaleBy(scale: Point): Point
    unscaleBy(scale: Point): Point
    round(): Point
    floor(): Point
    ceil(): Point
    trunc(): Point
    distanceTo(otherPoint: Point): number
    equals(otherPoint: Point): boolean
    contains(otherPoint: Point): boolean
    toString(): string
  }

  export interface LeafletMouseEvent {
    latlng: LatLng
    layerPoint: Point
    containerPoint: Point
    originalEvent: MouseEvent
  }

  export interface Map {
    setView(center: LatLngLiteral, zoom?: number, options?: any): this
    panTo(latlng: LatLngLiteral, options?: any): this
    flyTo(latlng: LatLngLiteral, zoom?: number, options?: any): this
    getCenter(): LatLng
    getZoom(): number
    getBounds(): LatLngBounds
    getMinZoom(): number
    getMaxZoom(): number
    latLngToContainerPoint(latlng: LatLngLiteral): Point
    containerPointToLatLng(point: Point): LatLng
    invalidateSize(options?: any): this
    remove(): this
  }

  export function latLng(lat: number, lng: number, alt?: number): LatLng
  export function latLng(coords: LatLngLiteral): LatLng
  export function latLng(coords: [number, number, number?]): LatLng

  export function latLngBounds(corner1: LatLngLiteral, corner2: LatLngLiteral): LatLngBounds

  export function point(x: number, y: number, round?: boolean): Point

  const L: {
    latLng: typeof latLng
    latLngBounds: typeof latLngBounds
    point: typeof point
  }

  export default L
}
