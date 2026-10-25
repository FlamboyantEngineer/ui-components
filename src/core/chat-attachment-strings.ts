/** Strings of chat attachments and attachment lists. */
export interface ChatAttachmentStrings {
  /** Names a list of attachments. */
  attachmentList: string;
  /** Names the button that opens an image attachment in the media viewer, from the file name. */
  viewAttachment: (name: string) => string;
  /** Names an attachment's upload progress, from the file name. */
  attachmentUploading: (name: string) => string;
  /** Explains a failed upload the host gave no reason for, from the file name. */
  attachmentFailed: (name: string) => string;
}

export const chatAttachmentStrings: ChatAttachmentStrings = {
  attachmentList: 'Attachments',
  viewAttachment: (name) => `View ${name}`,
  attachmentUploading: (name) => `Uploading ${name}`,
  attachmentFailed: (name) => `${name} could not be uploaded.`,
};
