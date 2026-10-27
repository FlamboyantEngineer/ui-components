import type { MessageArguments } from './message-format.js';
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

/** The message values each text function reads its arguments as. */
export const mediaArguments: MessageArguments<MediaStrings> = {
  downloadFile: (name) => ({ name }),
  mediaStage: (name) => ({ name }),
};
