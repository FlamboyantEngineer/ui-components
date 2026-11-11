import { defineStrings } from '../message-format.js';
/** Strings of media viewers, attached file lists and mini-apps. */
interface MediaStrings {
  /** Names a link that downloads a file, from the file name. */
  downloadFile: (name: string) => string;
  /** Stands in for a file a media viewer cannot show. */
  previewUnavailable: string;
  /** Says a media viewer's image failed to load, from the file name. */
  imageLoadFailed: (name: string) => string;
  /** Requests an image that failed to load again. */
  imageRetry: string;
  /** Names a media viewer's strip of thumbnails. */
  thumbnails: string;
  /** Names a media viewer's stage, from the shown file's name. */
  mediaStage: (name: string) => string;
  /** Says a mini-app is starting, from its title. */
  miniAppLoading: (title: string) => string;
  /** Says a mini-app failed to start or stopped, from its title. */
  miniAppFailed: (title: string) => string;
  /** Labels an asset picker's search box. */
  assetSearch: string;
  /** Names an asset picker's grid of results. */
  assetResults: string;
  /** Says an asset picker's search found nothing. */
  assetsEmpty: string;
  /** Labels the text that describes a chosen image to those who cannot see it. */
  assetAlt: string;
  /** Labels a chosen image's width in pixels. */
  assetWidth: string;
  /** Labels a chosen image's height in pixels. */
  assetHeight: string;
  /** Labels the choice that keeps a chosen image's width and height in proportion. */
  assetConstrain: string;
  /** Labels the alignment of a chosen image. */
  assetAlign: string;
  assetAlignStart: string;
  assetAlignCenter: string;
  assetAlignEnd: string;
}

/** The module's text, with the message values each text function reads its arguments as. */
export const mediaStrings = defineStrings<MediaStrings>({
  downloadFile: (name) => ({ name }),
  imageLoadFailed: (name) => ({ name }),
  mediaStage: (name) => ({ name }),
  miniAppLoading: (title) => ({ title }),
  miniAppFailed: (title) => ({ title }),
});
