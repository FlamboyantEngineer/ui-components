/** Strings of media viewers and attached file lists. */
export interface MediaStrings {
  /** Names a link that downloads a file, from the file name. */
  downloadFile: (name: string) => string;
  /** Stands in for a file a media viewer cannot show. */
  previewUnavailable: string;
  /** Names a media viewer's strip of thumbnails. */
  thumbnails: string;
  /** Names a media viewer's stage, from the shown file's name. */
  mediaStage: (name: string) => string;
}

export const mediaStrings: MediaStrings = {
  downloadFile: (name) => `Download ${name}`,
  previewUnavailable: 'No preview is available for this file.',
  thumbnails: 'Thumbnails',
  mediaStage: (name) => `${name}, viewer`,
};
