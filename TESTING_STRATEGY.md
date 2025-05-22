# Testing Strategy for One-Page Website Generator

This document outlines the conceptual testing strategy for the one-page website generator. These tests would ideally be automated using a UI testing framework.

## 1. Core Drag-and-Drop Functionality

### Test Case 1.1: Drag section from palette to valid container
- **Description:** User drags a 'header' section from the palette and drops it into the 'header-container'.
- **Expected Outcome:** The header section is successfully cloned and appended to the 'header-container'. The original section remains in the palette. The 'header-container' now contains the new header.

### Test Case 1.2: Drag section from palette to invalid container
- **Description:** User attempts to drag a 'header' section from the palette and drop it into the 'content-container'.
- **Expected Outcome:** The drop is prevented. The 'content-container' remains unchanged. No new element is added.

### Test Case 1.3: Replace header/footer
- **Description:** User drops a 'header' section into the 'header-container' which already contains a header.
- **Expected Outcome:** The old header is replaced by the new header. Only one header section is present in the 'header-container'. (Similar test for footer).

### Test Case 1.4: Add multiple content sections
- **Description:** User drags and drops three different 'content' sections into the 'content-container'.
- **Expected Outcome:** All three content sections are successfully added to the 'content-container' in the order they were dropped.

### Test Case 1.5: Reorder content sections
- **Description:** User has three content sections in 'content-container'. User drags the first section and drops it between the second and third sections.
- **Expected Outcome:** The order of content sections in 'content-container' is updated to reflect the new position.

## 2. Section Palette Functionality

### Test Case 2.1: Palette items remain after drag
- **Description:** User drags a section from the palette and drops it onto a container.
- **Expected Outcome:** The original section item remains visible and usable in the `section-palette`.

## 3. Export Functionality

### Test Case 3.1: Export simple page
- **Description:** User creates a page with one header, one content section, and one footer. User clicks "Export HTML".
- **Expected Outcome:** A textarea appears with HTML code. The code should contain the HTML structure of the header, content, and footer sections. Builder-specific attributes (like `draggable`, `data-section-category`) should be removed from the exported HTML. Basic inline styles should be present.

### Test Case 3.2: Export page with multiple content sections
- **Description:** User creates a page with one header, three content sections (in a specific order), and one footer. User clicks "Export HTML".
- **Expected Outcome:** The exported HTML in the textarea should reflect the structure, including all three content sections in their correct order.

### Test Case 3.3: Export empty page
- **Description:** User has not dropped any sections and clicks "Export HTML".
- **Expected Outcome:** The exported HTML should be a valid HTML document but with an empty body (or minimal structure if placeholder content is added by default to empty containers, which is not the current design).

## 4. Basic UI Rendering

### Test Case 4.1: Initial page load
- **Description:** User opens `index.html`.
- **Expected Outcome:** The section palette is visible and populated with all predefined section options. The header, content, and footer drop zones are visible and empty. The export button is visible.
