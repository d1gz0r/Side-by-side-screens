
# Side-by-Side Screens

An interactive web application designed to help users compare PC monitors visually and statistically.

## Features

-   **Visual Comparison:** Drag and drop monitors on a virtual canvas to see how they look next to each other.
-   **Scale Reference:** Includes a draggable keyboard (100% or 75% size) that snaps to monitor edges for accurate size reference.
-   **Specs Calculation:** Automatically calculates PPI (Pixels Per Inch) and physical dimensions based on diagonal size, aspect ratio, and resolution.
-   **Orientation:** Easily toggle monitors between Landscape and Portrait modes.
-   **Layering:** Smaller monitors automatically layer on top of larger ones for better visibility.
-   **Theme:** Fully supported Dark Mode and Light Mode.
-   **Responsive:** Works on desktop and mobile devices with touch support.

## Tech Stack

-   **React:** For UI components and state management.
-   **TypeScript:** For type safety and better developer experience.
-   **Tailwind CSS:** For rapid, responsive styling.
-   **Vite/ESBuild:** (Implied by current structure) for fast bundling.

## Setup & Usage

1.  **Clone the repository.**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
4.  **Open in Browser:** Navigate to the local server address (usually `http://localhost:5173`).

## Usage Guide

1.  **Add Monitors:** Use the sidebar form to input diagonal size, aspect ratio, and resolution. Presets are available for common configurations.
2.  **Arrange:** Drag monitors around the main preview area.
3.  **Keyboard Scale:** Enable the keyboard from the sidebar list to see a physical size reference. Drag it near monitors to snap it to edges.
4.  **Controls:** Use the eye icon to hide monitors, the rotate icon to change orientation, and the trash icon to remove them.

## License

MIT
