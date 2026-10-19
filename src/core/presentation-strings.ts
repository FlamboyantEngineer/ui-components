/** Strings of carousels, guided tours, avatar groups and QR codes. */
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
}

export const presentationStrings: PresentationStrings = {
  carousel: 'carousel',
  slide: 'slide',
  previousSlide: 'Previous slide',
  nextSlide: 'Next slide',
  chooseSlide: 'Choose a slide',
  goToSlide: (position) => `Slide ${position}`,
  startSlideRotation: 'Start automatic slide show',
  stopSlideRotation: 'Stop automatic slide show',
  peopleCount: (count) => (count === 1 ? '1 person' : `${count} people`),
  qrCodeOf: (value) => `QR code: ${value}`,
  qrCodeTooLong: 'The text is too long for a QR code.',
};
