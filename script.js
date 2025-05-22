document.addEventListener('DOMContentLoaded', () => {
    const paletteItems = document.querySelectorAll('#section-palette .header-option, #section-palette .content-option, #section-palette .footer-option');
    const headerContainer = document.getElementById('header-container');
    const contentContainer = document.getElementById('content-container');
    const footerContainer = document.getElementById('footer-container');
    const dropContainers = [headerContainer, contentContainer, footerContainer];

    let draggedItem = null; // To store the actual element being dragged from the palette

    // 1. Make section options draggable
    paletteItems.forEach(item => {
        item.setAttribute('draggable', 'true');

        item.addEventListener('dragstart', (event) => {
            // Store the dragged item itself
            draggedItem = event.target; 
            
            // Store data-type and data-section-category
            event.dataTransfer.setData('text/plain', event.target.dataset.type);
            event.dataTransfer.setData('application/json', JSON.stringify({
                type: event.target.dataset.type,
                category: event.target.dataset.sectionCategory,
                // outerHTML: event.target.outerHTML // Storing outerHTML for cloning later
            }));
            event.dataTransfer.effectAllowed = 'copy';
            // Optional: Add a class for styling the item being dragged from the palette
            event.target.classList.add('palette-item-dragging'); 
        });

        item.addEventListener('dragend', (event) => {
            // Optional: Remove the styling class when dragging ends
            event.target.classList.remove('palette-item-dragging');
            draggedItem = null; 
        });
    });

    // 2. Designate drop zones
    dropContainers.forEach(container => {
        container.addEventListener('dragover', (event) => {
            event.preventDefault(); // Allow dropping
            const draggedData = JSON.parse(event.dataTransfer.getData('application/json'));
            const targetCategory = container.id.replace('-container', ''); // header, content, footer

            if (draggedData.category === targetCategory) {
                event.dataTransfer.dropEffect = 'copy';
                container.classList.add('drag-over');
            } else {
                event.dataTransfer.dropEffect = 'none';
            }
        });

        container.addEventListener('dragleave', (event) => {
            container.classList.remove('drag-over');
        });

        container.addEventListener('drop', (event) => {
            event.preventDefault();
            container.classList.remove('drag-over');

            const draggedData = JSON.parse(event.dataTransfer.getData('application/json'));
            const targetCategory = container.id.replace('-container', ''); // header, content, footer

            // Ensure the dragged item is from the palette and category matches
            if (!draggedItem || draggedData.category !== targetCategory) {
                console.warn('Drop rejected: Item not from palette or category mismatch.');
                return;
            }
            
            // Clone the original element from the palette
            const clonedElement = draggedItem.cloneNode(true);

            // Clean up palette-specific attributes and classes from the clone
            clonedElement.classList.remove('header-option', 'content-option', 'footer-option', 'palette-item-dragging');
            clonedElement.classList.add('dropped-section');
            // Remove draggable attribute if items in containers are not meant to be immediately draggable
            // clonedElement.removeAttribute('draggable'); // Decide later for reordering

            // Logic for container types
            if (targetCategory === 'header' || targetCategory === 'footer') {
                // Replace existing content if any
                container.innerHTML = ''; 
                container.appendChild(clonedElement);
            } else if (targetCategory === 'content') {
                // Append to content container
                container.appendChild(clonedElement);
            }
            
            // After dropping, enable reordering for items in the content container
            if (targetCategory === 'content') {
                makeContentSectionsDraggable(container);
            }
             // Make sure the newly dropped header/footer is also re-draggable if it was a content item before (not applicable here, but good practice)
            if (targetCategory === 'header' || targetCategory === 'footer') {
                 clonedElement.setAttribute('draggable', 'false'); // Headers/Footers are not re-draggable for now
            }


            draggedItem = null; // Clear after successful drop
        });
    });

    // 3. Reordering within #content-container
    function makeContentSectionsDraggable(container) {
        const items = container.querySelectorAll('.dropped-section');
        items.forEach(item => {
            // Only make content items draggable for reordering
            if (item.dataset.sectionCategory === 'content') {
                item.setAttribute('draggable', 'true');
                item.classList.add('draggable-content'); // For specific styling/identification if needed
            } else {
                 item.setAttribute('draggable', 'false'); // Ensure headers/footers dropped are not re-draggable
            }


            // Remove previously attached listeners to avoid duplication
            item.removeEventListener('dragstart', handleContentDragStart);
            item.removeEventListener('dragend', handleContentDragEnd);

            item.addEventListener('dragstart', handleContentDragStart);
            item.addEventListener('dragend', handleContentDragEnd);
        });
    }
    
    let currentlyDraggedContentItem = null;

    function handleContentDragStart(event) {
        // Check if the item is actually draggable (is a content item)
        if (event.target.getAttribute('draggable') !== 'true' || !event.target.classList.contains('dropped-section') || event.target.dataset.sectionCategory !== 'content') {
            event.preventDefault();
            return;
        }
        currentlyDraggedContentItem = event.target;
        event.dataTransfer.setData('text/x-reorder-item-id', event.target.id || Math.random().toString(36).substr(2, 9)); // Use existing ID or generate one
        if (!event.target.id) {
            event.target.id = event.dataTransfer.getData('text/x-reorder-item-id');
        }
        event.dataTransfer.effectAllowed = 'move';
        event.target.classList.add('content-item-dragging'); // Style for dragging content item
        // Important: Stop propagation to prevent palette's dragstart if events bubble (though here it's a different set of items)
        // event.stopPropagation(); 
    }

    function handleContentDragEnd(event) {
        if (currentlyDraggedContentItem) {
            currentlyDraggedContentItem.classList.remove('content-item-dragging');
        }
        currentlyDraggedContentItem = null;
    }

    contentContainer.addEventListener('dragover', (event) => {
        event.preventDefault(); // Necessary for 'drop' to fire
        if (event.dataTransfer.types.includes('text/x-reorder-item-id')) {
             event.dataTransfer.dropEffect = 'move';
            // Visual feedback for reordering
            const draggingItem = currentlyDraggedContentItem;
            if (!draggingItem) return;

            const boundingBox = event.target.closest('.dropped-section');
            if (boundingBox && boundingBox !== draggingItem) {
                const rect = boundingBox.getBoundingClientRect();
                const isAfter = event.clientY > rect.top + rect.height / 2;
                if (isAfter) {
                    boundingBox.parentNode.insertBefore(draggingItem, boundingBox.nextSibling);
                } else {
                    boundingBox.parentNode.insertBefore(draggingItem, boundingBox);
                }
            }
        }
    });
    
    contentContainer.addEventListener('drop', (event) => {
        event.preventDefault();
        // Check if this drop is for reordering an item already in the content container
        const reorderItemId = event.dataTransfer.getData('text/x-reorder-item-id');
        if (reorderItemId && currentlyDraggedContentItem && currentlyDraggedContentItem.id === reorderItemId) {
            // The actual reordering logic is mostly handled by dragover for immediate feedback.
            // Here we just finalize, e.g., remove any temporary styling.
            // The currentlyDraggedContentItem is already in its new position due to DOM manipulation in dragover.
            // No need to appendChild if it's a reorder.
            // event.stopPropagation(); // Prevent palette drop logic if it's a reorder
        } else if (event.dataTransfer.types.includes('application/json')) {
            // This is a drop from the palette, handled by the generic drop listener.
            // This specific 'drop' for contentContainer might need to ensure it doesn't double-process.
            // However, the initial generic drop handler for dropContainers already covers this.
            // To avoid double processing, we could check if the item was already appended.
            // For now, the structure ensures that the generic one handles palette drops.
        }
        if (currentlyDraggedContentItem) {
           currentlyDraggedContentItem.classList.remove('content-item-dragging');
        }
        currentlyDraggedContentItem = null;
        // Ensure all content items are re-evaluated for draggability
        makeContentSectionsDraggable(contentContainer);
    });

    // Initial call to make existing content items (if any, though there shouldn't be on load) draggable
    makeContentSectionsDraggable(contentContainer);

    // --- HTML Export Functionality ---
    const exportHtmlButton = document.getElementById('export-html-button');
    const exportedHtmlTextarea = document.getElementById('exported-html');

    function cleanElementForExport(element) {
        if (!element) return null;
        const clone = element.cloneNode(true);

        // Remove builder-specific attributes from the main cloned element
        clone.removeAttribute('draggable');
        clone.removeAttribute('data-type');
        clone.removeAttribute('data-section-category');
        clone.removeAttribute('id'); // Remove IDs that might have been generated for reordering

        // Remove builder-specific classes
        clone.classList.remove('drag-over', 'content-item-dragging', 'palette-item-dragging', 'draggable-content', 'header-option', 'content-option', 'footer-option');
        // 'dropped-section' class is kept as it might be used for basic styling in the exported page

        // Recursively clean children ONLY if they are also 'dropped-section' (which shouldn't happen with current structure)
        // or if they have specific builder classes/attributes we know we want to remove.
        // For now, let's focus on cleaning attributes from direct children if they are not standard HTML tags
        // or if they are known to have builder attributes.
        // This simplistic approach cleans the main dropped section and its immediate children if they also look like builder components.
        
        const elementsToCleanRecursively = clone.querySelectorAll('[draggable="true"], [data-type], [data-section-category], .drag-over, .content-item-dragging, .palette-item-dragging, .draggable-content');
        elementsToCleanRecursively.forEach(child => {
            child.removeAttribute('draggable');
            child.removeAttribute('data-type');
            child.removeAttribute('data-section-category');
            child.removeAttribute('id');
            child.classList.remove('drag-over', 'content-item-dragging', 'palette-item-dragging', 'draggable-content', 'header-option', 'content-option', 'footer-option');
        });

        // A more robust way for cleaning all descendants:
        // clone.querySelectorAll('*').forEach(descendant => {
        //     descendant.removeAttribute('draggable');
        //     descendant.removeAttribute('data-type');
        //     descendant.removeAttribute('data-section-category');
        //     // Be careful with removing all IDs, some might be legitimate.
        //     // descendant.removeAttribute('id'); 
        //     descendant.classList.remove('drag-over', 'content-item-dragging', 'palette-item-dragging', 'draggable-content');
        // });


        return clone;
    }

    exportHtmlButton.addEventListener('click', () => {
        let finalHtml = '';
        let headerHtml = '';
        let contentHtml = '';
        let footerHtml = '';

        // Get and clean header
        const headerElement = headerContainer.querySelector('.dropped-section');
        if (headerElement) {
            const cleanedHeader = cleanElementForExport(headerElement);
            if (cleanedHeader) headerHtml = cleanedHeader.outerHTML;
        }

        // Get and clean content sections
        const contentElements = contentContainer.querySelectorAll('.dropped-section');
        contentElements.forEach(el => {
            const cleanedContentEl = cleanElementForExport(el);
            if (cleanedContentEl) contentHtml += cleanedContentEl.outerHTML + '\n';
        });

        // Get and clean footer
        const footerElement = footerContainer.querySelector('.dropped-section');
        if (footerElement) {
            const cleanedFooter = cleanElementForExport(footerElement);
            if (cleanedFooter) footerHtml = cleanedFooter.outerHTML;
        }
        
        const fullPageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Page</title>
    <!-- Basic styling for dropped sections (optional) -->
    <style>
        body { font-family: sans-serif; margin: 0; padding: 0; background-color: #f0f0f0; }
        .dropped-section { padding: 20px; margin-bottom: 10px; background-color: #fff; border: 1px solid #ddd; }
        /* Add more generic styles for common elements if desired, e.g., h1, p, nav, form */
        .dropped-section[data-type^="header-"] { background-color: #f8f9fa; padding: 20px; }
        .dropped-section[data-type^="header-"] h1 { font-size: 2em; margin-top:0; }
        .dropped-section[data-type="header-nav"] nav ul { list-style: none; padding: 0; display: flex; gap: 15px; }
        .dropped-section[data-type="header-nav"] nav a { text-decoration: none; color: #007bff; }
        .dropped-section[data-type="content-gallery"] .gallery-container { display: flex; flex-wrap: wrap; gap: 10px; }
        .dropped-section[data-type="content-gallery"] .gallery-item-placeholder { width: 100px; height: 100px; background-color: #eee; border: 1px solid #ccc; display:flex; align-items:center; justify-content:center; }
        .dropped-section[data-type="content-contact"] form div { margin-bottom: 10px; }
        .dropped-section[data-type="content-contact"] form label { display: block; margin-bottom: 5px; }
        .dropped-section[data-type="content-contact"] form input,
        .dropped-section[data-type="content-contact"] form textarea { width: calc(100% - 16px); padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
        .dropped-section[data-type="content-contact"] form button { padding: 10px 15px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .dropped-section[data-type^="footer-"] { text-align: center; font-size: 0.9em; padding: 15px; background-color: #f8f9fa; }
        .dropped-section[data-type="footer-social"] ul { list-style: none; padding: 0; display: flex; justify-content: center; gap: 15px; }
        .dropped-section[data-type="footer-social"] ul li a { text-decoration: none; color: #007bff; }
    </style>
</head>
<body>
    ${headerHtml}
    ${contentHtml}
    ${footerHtml}
</body>
</html>`;

        exportedHtmlTextarea.value = fullPageHtml;
        exportedHtmlTextarea.style.display = 'block'; // Show the textarea
        // Scroll to the textarea
        exportedHtmlTextarea.scrollIntoView({ behavior: 'smooth' });
    });
});
