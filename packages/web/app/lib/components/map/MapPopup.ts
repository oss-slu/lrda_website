/**
 * Custom popup overlay for Google Maps.
 * Must be created after the Google Maps API is loaded.
 */

export interface PopupRefs {
  popupHoveredRef: React.MutableRefObject<boolean>;
  hoverTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  startPopupCloseTimer: () => void;
}

/**
 * Creates a Popup class that extends google.maps.OverlayView.
 * This factory function is needed because the class must be created
 * after the Google Maps API is loaded.
 */
export function createPopupClass(refs: PopupRefs) {
  const { popupHoveredRef, hoverTimerRef, startPopupCloseTimer } = refs;

  return class Popup extends google.maps.OverlayView {
    position: google.maps.LatLng;
    containerDiv: HTMLDivElement;
    isClickPopup: boolean;

    constructor(position: google.maps.LatLng, content: HTMLElement, isClickPopup: boolean = false) {
      super();
      this.position = position;
      this.isClickPopup = isClickPopup;
      content.classList.add('popup-bubble');

      const bubbleAnchor = document.createElement('div');
      bubbleAnchor.classList.add('popup-bubble-anchor');
      bubbleAnchor.appendChild(content);

      this.containerDiv = document.createElement('div');
      this.containerDiv.classList.add('popup-container');
      this.containerDiv.appendChild(bubbleAnchor);

      Popup.preventMapHitsAndGesturesFrom(this.containerDiv);

      // Add hover listeners to the popup itself
      this.containerDiv.addEventListener('mouseenter', () => {
        popupHoveredRef.current = true;
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      });

      this.containerDiv.addEventListener('mouseleave', () => {
        popupHoveredRef.current = false;
        // Only auto-close if it was a HOVER popup
        if (!this.isClickPopup) {
          startPopupCloseTimer();
        }
      });
    }

    onAdd() {
      this.getPanes()!.floatPane.appendChild(this.containerDiv);
    }

    onRemove() {
      if (this.containerDiv.parentElement) {
        this.containerDiv.parentElement.removeChild(this.containerDiv);
      }
    }

    draw() {
      const divPosition = this.getProjection().fromLatLngToDivPixel(this.position)!;
      const display =
        Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000 ? 'block' : 'none';

      if (display === 'block') {
        this.containerDiv.style.left = divPosition.x + 'px';
        this.containerDiv.style.top = divPosition.y + 'px';
        this.containerDiv.style.transform = 'translate(-50%, calc(-100% - 10px))';
      }

      if (this.containerDiv.style.display !== display) {
        this.containerDiv.style.display = display;
      }
    }
  };
}

export type PopupClass = ReturnType<typeof createPopupClass>;
export type PopupInstance = InstanceType<PopupClass>;
