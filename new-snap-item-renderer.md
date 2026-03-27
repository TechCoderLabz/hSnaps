Here’s a clean, structured **technical README (Markdown)** based on your transcription—optimized so an AI/dev can directly implement it:

---

# 📦 Snap Renderer Component

## Overview

The **Snap Renderer** is a reusable UI component designed to render mixed-media content ("snaps") efficiently across mobile and web platforms.

A **Snap** may contain:

* Text content
* Images
* GIFs
* Videos (native / external)
* Audio (including 3Speak)
* External embeds (YouTube, Twitter, etc.)

The goal is to:

* Provide a **consistent preview experience**
* Support **multiple attachments**
* Ensure **performance optimization via lazy loading**

---

## 🎯 Key Design Goals

* Unified rendering for all media types
* Mobile-first responsive design
* Lightweight initial load
* On-demand media rendering (lazy load via popup)
* Smooth swipe navigation for multiple attachments

---

## 🧱 Component Structure

```
Snap
 ├── SnapHeader (text/content)
 └── SnapMediaContainer
      ├── AttachmentPreview (swipeable)
      └── PopupRenderer (on-demand)
```

---

## 📐 Layout Specifications

### Snap Container

* Width: `100%` (mobile device width)
* Max Height: `150px`
* Aspect: Rectangle (can adapt square if needed)
* Content Scaling: `object-fit: contain`

### Behavior

* Text/content appears **above media container**
* Media container displays **attachment previews**

---

## 🖼️ Attachment Handling

### Supported Types

| Type         | Behavior                      |
| ------------ | ----------------------------- |
| Image        | Thumbnail preview             |
| GIF          | Thumbnail / animated preview  |
| Video        | Placeholder → popup playback  |
| Audio        | Placeholder → popup player    |
| YouTube      | Placeholder → popup embed     |
| Twitter      | Placeholder → popup embed     |
| 3Speak Video | Placeholder → iframe in popup |
| 3Speak Audio | Placeholder → iframe in popup |

---

## 🔄 Multiple Attachments

### Swipe Navigation

* Horizontal swipe (left ↔ right)
* Default: **first attachment visible**
* Navigation:

  * Swipe gesture
  * Optional buttons: `Next / Previous`

### Example

If a snap has:

* Image
* Twitter link
* YouTube video

Then:

1. First slide → Image thumbnail
2. Swipe → Twitter placeholder
3. Swipe → YouTube placeholder

---

## 🧩 Preview Behavior

### Image / GIF

* Display directly inside container
* Scaled to fit within 150px height

---

### External / Heavy Content

Instead of loading directly:

Show placeholder:

```
[ Twitter attachment ]
Tap to preview
```

```
[ YouTube video attached ]
Tap to preview
```

```
[ 3Speak audio attached ]
Tap to view
```

---

## 🚀 Popup Rendering (Lazy Load)

### Trigger

* User taps on attachment preview

### Behavior

* Open modal / popup
* Load actual embed dynamically

### Examples

| Type    | Rendering Method     |
| ------- | -------------------- |
| Twitter | Embed widget         |
| YouTube | iframe player        |
| 3Speak  | iframe               |
| Audio   | HTML5 audio player   |
| Video   | HTML5 video / iframe |

### Close Action

* Close popup → return to snap preview
* No persistent heavy DOM elements

---

## ⚡ Performance Strategy

### Problem

Loading all embeds by default:

* High memory usage
* Slow mobile performance
* Poor UX

### Solution

* **Lazy load all heavy content**
* Only render embeds when user interacts
* Keep initial DOM lightweight

---

## 🧠 Rendering Logic (Pseudo Flow)

```js
if (attachment.type === "image" || attachment.type === "gif") {
  renderInlinePreview();
} else {
  renderPlaceholder();
}

onClick(attachment) {
  openPopup();
  loadEmbed(attachment);
}
```

---

## 🧭 UX Flow

1. User views snap
2. Sees first attachment preview
3. Swipes to explore more
4. Taps on any attachment
5. Popup opens with full preview
6. User closes popup → returns to snap

---

## 📱 Mobile Considerations

* Touch-friendly swipe gestures
* Minimal initial load
* Avoid autoplay media
* Optimize for low memory devices

---

## 🔮 Future Enhancements

* Prefetch next attachment (optional optimization)
* Caching viewed embeds
* Fullscreen media mode
* Gesture-based close (swipe down)
* Progressive image loading

---

## ✅ Summary

The Snap Renderer:

* Handles **heterogeneous media types**
* Uses **swipeable previews**
* Loads heavy content **on demand**
* Ensures **fast, scalable performance**
