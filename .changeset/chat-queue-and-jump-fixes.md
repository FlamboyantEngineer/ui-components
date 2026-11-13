---
'@flamboyantengineer/ui-components': minor
---

`Chat`: the highlight a pressed quote leaves on the quoted message now ends after two seconds, so the same quote jumps again and a search that ends never falls back to an earlier jump. A queued message whose removal the host has not answered yet stays out of the next queue the chat builds, a steer that waits holds only its own conversation's Steer buttons, and a reply sent while a response runs reads "Sending…". The chat controller no longer sends the queue when an edit ends after a reply the reader stopped, and gives its sources part the id `sources` so the reader's choice to open it survives a remount. Edit and Reply no longer take focus back to the composer from a control the reader presses within the next two frames.
