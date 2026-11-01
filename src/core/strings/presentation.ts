import { defineStrings } from '../message-format.js';
/** Strings of carousels, guided tours, avatar groups, QR codes and barcodes. */
export interface PresentationStrings {
  /** Describes the role of a carousel (`carousel`), read before its name. */
  carousel: string;
  /** Describes the role of a carousel's slide (`slide`), read before its position. */
  slide: string;
  /** Names a carousel's button that shows the previous slide. */
  previousSlide: string;
  /** Names a carousel's button that shows the next slide. */
  nextSlide: string;
  /** Names a carousel's group of slide pickers. */
  chooseSlide: string;
  /** Names a carousel's picker of one slide, from its position (`Slide 2`). */
  goToSlide: (position: number) => string;
  /** Names a carousel's button that starts automatic rotation. */
  startSlideRotation: string;
  /** Names a carousel's button that stops automatic rotation. */
  stopSlideRotation: string;
  /** Names an avatar group's list of everyone, from the count (`6 people`). */
  peopleCount: (count: number) => string;
  /** Names a QR code from the text it holds. */
  qrCodeOf: (value: string) => string;
  /** Names a QR code whose text does not fit in the largest symbol. */
  qrCodeTooLong: string;
  /** Names a barcode from its format's name (`EAN-13`) and the value it holds. */
  barcodeOf: (format: string, value: string) => string;
  /** Names a barcode whose value its format cannot hold, from the format's name. */
  barcodeInvalid: (format: string) => string;
}

/** The module's text, with the message values each text function reads its arguments as. */
export const presentationStrings = defineStrings<PresentationStrings>({
  goToSlide: (position) => ({ position }),
  peopleCount: (count) => ({ count }),
  qrCodeOf: (value) => ({ value }),
  barcodeOf: (format, value) => ({ format, value }),
  barcodeInvalid: (format) => ({ format }),
});
